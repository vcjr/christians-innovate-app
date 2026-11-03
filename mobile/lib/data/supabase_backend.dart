import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/models.dart';
import '../domain/scripture.dart';
import 'backend.dart';
import 'offline_store.dart';
import 'outbox.dart';

/// The reaction the prayer wall's "Praying" button stores in `post_reactions`.
const prayingEmoji = '🙏';

typedef _Row = Map<String, dynamic>;

/// [Backend] on the shared Supabase project. Queries and side effects (notifications on
/// group invitations and join requests) follow the web app's server actions.
///
/// Every `.order()` states its direction: the Dart client sorts descending by default,
/// unlike supabase-js.
///
/// Offline: each read saves the raw rows it got under a key in [OfflineStore] and falls back
/// to them when the server can't be reached. The everyday changes (mark as read, praying,
/// comments, commitment status, reflections, notifications read) go into an [Outbox] when
/// offline, are applied to the saved rows straight away so the app shows them, and are sent
/// in order once the server answers again.
class SupabaseBackend implements Backend {
  SupabaseBackend(this._db, {required this.siteUrl, OfflineStore? store}) : _store = store ?? OfflineStore.memory() {
    _authEvents.listen((s) async {
      await _outbox.load(s.session?.user.id);
      _emit();
      unawaited(sync());
    });
  }

  final SupabaseClient _db;
  final OfflineStore _store;
  late final _outbox = Outbox(_store);

  /// The web app, for links that finish on the web (password reset).
  final String siteUrl;

  static const _timeout = Duration(seconds: 20);

  String get _uid {
    final id = _db.auth.currentUser?.id;
    if (id == null) throw const BackendException('Your session ended. Sign in again.');
    return id;
  }

  /// Where this member's saved rows live, so another account on the device never sees them.
  String _k(String name) => 'u/$_uid/$name';

  // Connection state

  var _offline = false;
  var _state = const SyncState();
  final _states = StreamController<SyncState>.broadcast();
  Timer? _probe;
  var _syncing = false;

  @override
  SyncState get syncState => _state;
  @override
  Stream<SyncState> get syncStates => _states.stream;

  void _emit() {
    final s = SyncState(offline: _offline, pending: _outbox.length);
    if (s == _state) return;
    _state = s;
    _states.add(s);
  }

  void _setOffline(bool offline) {
    if (offline == _offline) return;
    _offline = offline;
    _emit();
    _probe?.cancel();
    if (offline) {
      // Nothing tells us when the network comes back, so check now and then.
      _probe = Timer.periodic(const Duration(seconds: 20), (_) => sync());
    } else {
      unawaited(sync());
    }
  }

  /// The request never got an answer: no network, DNS, TLS or a timeout.
  static bool _isUnreachable(Object e) =>
      e is SocketException ||
      e is TimeoutException ||
      e is HandshakeException ||
      e is HttpException ||
      e is http.ClientException ||
      e is AuthRetryableFetchException;

  Future<T> _run<T>(Future<T> Function() body, {Duration? timeout = _timeout}) async {
    try {
      final result = await (timeout == null ? body() : body().timeout(timeout));
      _setOffline(false);
      return result;
    } on BackendException {
      rethrow;
    } catch (e) {
      if (_isUnreachable(e)) {
        _setOffline(true);
        throw BackendException.unreachable;
      }
      _setOffline(false);
      throw switch (e) {
        AuthException() => BackendException(_authMessage(e)),
        PostgrestException(:final code) => BackendException(
          code == '23505' ? 'That’s already been done.' : 'Something went wrong. Try again.',
        ),
        StorageException() => const BackendException('The upload didn’t go through. Try again.'),
        _ => const BackendException('Something went wrong. Try again.'),
      };
    }
  }

  /// How long a screen waits on the network before showing what's saved instead.
  static const _patience = Duration(seconds: 4);

  /// Fetches fresh rows and saves them under [key]; offline, builds from the saved copy instead.
  ///
  /// Once a request has failed for lack of connection, the saved copy is used straight away
  /// until the probe finds the server again (then every screen reloads). While changes are
  /// waiting to be sent, the saved copy (which already shows them) also wins over the server's.
  Future<T> _read<T>(String key, Future<Object?> Function() fetch, T Function(dynamic raw) build) async {
    await _outbox.load(userId);
    if (_offline || !_outbox.isEmpty) {
      final saved = await _store.get(key);
      if (saved != null) {
        if (!_outbox.isEmpty) unawaited(sync());
        return build(saved);
      }
    }
    final fresh = _run(fetch).then((raw) {
      unawaited(_store.put(key, raw));
      return raw;
    });
    fresh.ignore(); // Its error is handled below, or it's no longer wanted after a timeout.
    Object? raw;
    try {
      // A slow connection (or a sign-in token that can't renew) shouldn't hold up a screen
      // that has something saved to show; the fresh rows are still saved when they arrive.
      raw = await fresh.timeout(_patience, onTimeout: () async => await _store.get(key) ?? await fresh);
    } on BackendException catch (e) {
      if (!e.offline) rethrow;
      raw = await _store.get(key);
      if (raw == null) rethrow;
    }
    return build(raw);
  }

  static List<_Row> _rows(Object? raw) => [for (final r in raw as List) (r as Map).cast<String, dynamic>()];

  static String _authMessage(AuthException e) {
    final m = e.message.toLowerCase();
    if (m.contains('invalid login')) return 'That email and password don’t match.';
    if (m.contains('not confirmed')) return 'Confirm your email first. The link is in your inbox.';
    if (m.contains('already registered')) return 'There’s already an account with that email. Sign in instead.';
    if (m.contains('password')) return e.message;
    return 'Something went wrong. Try again.';
  }

  Future<List<_Row>> _authorRows(Iterable<String> userIds) async {
    final ids = userIds.toSet().toList();
    if (ids.isEmpty) return [];
    return await _db.from('user_profiles').select('user_id, full_name, avatar_url').inFilter('user_id', ids);
  }

  static Map<String, Author> _authorMap(Object? rows) => {
    for (final r in _rows(rows))
      r['user_id'] as String: Author(
        userId: r['user_id'] as String,
        name: r['full_name'] as String?,
        avatarUrl: r['avatar_url'] as String?,
      ),
  };

  Author _authorFromJoin(String userId, Object? join) {
    final p = join is Map ? join : null;
    return Author(userId: userId, name: p?['full_name'] as String?, avatarUrl: p?['avatar_url'] as String?);
  }

  static List<Comment> _comments(dynamic raw) {
    final authors = _authorMap(raw['authors']);
    return [
      for (final r in _rows(raw['rows']))
        Comment(
          id: r['id'] as String,
          author: authors[r['user_id']] ?? Author(userId: r['user_id'] as String),
          content: r['content'] as String,
          createdAt: DateTime.parse(r['created_at'] as String).toLocal(),
        ),
    ];
  }

  Future<void> _notify(String userId, String type, String title, String message, String link, String referenceId) => _db.rpc(
    'create_notification_for_user',
    params: {'p_user_id': userId, 'p_type': type, 'p_title': title, 'p_message': message, 'p_link': link, 'p_reference_id': referenceId},
  );

  Future<String> _myName() async {
    final r = await _db.from('user_profiles').select('full_name').eq('user_id', _uid).maybeSingle();
    final name = (r?['full_name'] as String?)?.trim();
    return name == null || name.isEmpty ? 'Someone' : name;
  }

  // Auth

  @override
  String? get userId => _db.auth.currentUser?.id;

  /// Sign-in changes. Supabase also reports a token that couldn't renew (offline) as an error
  /// on this stream; the member is still signed in, so those are dropped rather than letting
  /// every screen that follows the signed-in member reload.
  Stream<AuthState> get _authEvents => _db.auth.onAuthStateChange.handleError((Object _) {});

  @override
  Stream<String?> get userChanges => _authEvents.map((s) => s.session?.user.id);

  @override
  Future<void> signIn(String email, String password) => _run(() => _db.auth.signInWithPassword(email: email.trim(), password: password));

  @override
  Future<bool> signUp(SignUpDetails d) => _run(() async {
    final res = await _db.auth.signUp(
      email: d.email.trim(),
      password: d.password,
      data: {
        'full_name': d.fullName.trim(),
        'ci_updates': d.ciUpdates,
        'bible_year': d.bibleYear,
        'skill_share': d.skillShare,
        if (d.referral?.trim().isNotEmpty ?? false) 'referral': d.referral!.trim(),
      },
    );
    return res.session == null;
  });

  @override
  Future<void> sendPasswordReset(String email) =>
      _run(() => _db.auth.resetPasswordForEmail(email.trim(), redirectTo: '$siteUrl/auth/confirm?type=recovery'));

  /// Also forgets this member's saved rows and any changes still waiting, so the next person
  /// to sign in on the device sees nothing of theirs. Downloaded translations stay.
  @override
  Future<void> signOut() async {
    final uid = userId;
    await _run(() => _db.auth.signOut());
    await _outbox.clear();
    if (uid != null) await _store.removePrefix('u/$uid/');
    _emit();
  }

  // Profile

  @override
  Future<Profile> myProfile() => _read(
    _k('profile'),
    () => _db.from('user_profiles').select().eq('user_id', _uid).single(),
    (raw) => Profile.fromRow((raw as Map).cast<String, dynamic>()),
  );

  @override
  Future<void> updateProfile(Map<String, Object?> fields) => _run(() async {
    await _db.from('user_profiles').update({...fields, 'updated_at': DateTime.now().toUtc().toIso8601String()}).eq('user_id', _uid);
    // The web's middleware reads onboarding state from the auth metadata, so keep it in step.
    if (fields['has_completed_onboarding'] == true) {
      await _db.auth.updateUser(UserAttributes(data: {'has_completed_onboarding': true}));
    }
  });

  @override
  Future<String> uploadAvatar(Uint8List bytes, String extension) => _run(() async {
    final path = '$_uid/avatar.$extension';
    await _db.storage.from('avatars').uploadBinary(path, bytes, fileOptions: const FileOptions(upsert: true));
    // Same path every time, so bust caches that already hold the old photo.
    return '${_db.storage.from('avatars').getPublicUrl(path)}?v=${DateTime.now().millisecondsSinceEpoch}';
  }, timeout: const Duration(seconds: 60));

  // Plans

  @override
  Future<List<ReadingPlan>> plans() => _read(
    _k('plans'),
    () => _db.from('reading_plans').select('*, plan_days(count)').order('created_at', ascending: false),
    (raw) => [for (final r in _rows(raw)) ReadingPlan.fromRow(r)],
  );

  @override
  Future<List<String>> subscribedPlanIds() => _read(
    _k('subscriptions'),
    () => _db.from('plan_subscriptions').select('plan_id').eq('user_id', _uid).order('subscribed_at', ascending: true),
    (raw) => [for (final r in _rows(raw)) r['plan_id'] as String],
  );

  @override
  Future<void> subscribe(String planId) =>
      _run(() => _db.from('plan_subscriptions').upsert({'user_id': _uid, 'plan_id': planId}, onConflict: 'user_id,plan_id'));

  @override
  Future<void> unsubscribe(String planId) => _run(() => _db.from('plan_subscriptions').delete().eq('user_id', _uid).eq('plan_id', planId));

  @override
  Future<List<PlanDay>> planDays(String planId) => _read(
    _k('planDays/$planId'),
    () async {
      final (days, progress) = await (
        _db.from('plan_days').select().eq('plan_id', planId).order('day_number', ascending: true),
        // Only this member's rows, filtered explicitly (the web does the same rather than trust RLS).
        _db
            .from('user_progress')
            .select('day_id, is_completed, completed_at, plan_days!inner(plan_id)')
            .eq('user_id', _uid)
            .eq('plan_days.plan_id', planId),
      ).wait;
      return {'days': days, 'progress': progress};
    },
    (raw) {
      final done = {
        for (final p in _rows(raw['progress']))
          if (p['is_completed'] != false) p['day_id'] as String: DateTime.parse(p['completed_at'] as String).toLocal(),
      };
      return [for (final d in _rows(raw['days'])) PlanDay.fromRow(d, completedAt: done[d['id']])];
    },
  );

  @override
  Future<void> setDayComplete(String dayId, bool complete) => _change({'op': 'day_complete', 'day': dayId, 'complete': complete});

  @override
  Future<List<Comment>> dayComments(String dayId) => _read(_k('dayComments/$dayId'), () async {
    final rows = await _db.from('day_comments').select().eq('day_id', dayId).order('created_at', ascending: true);
    return {'rows': rows, 'authors': await _authorRows(rows.map((r) => r['user_id'] as String))};
  }, _comments);

  @override
  Future<void> addDayComment(String dayId, String content) => _change({'op': 'day_comment', 'day': dayId, 'content': content.trim()});

  @override
  Future<void> deleteDayComment(String commentId) => _run(() => _db.from('day_comments').delete().eq('id', commentId).eq('user_id', _uid));

  // Scripture

  final _bibles = <String, Map<String, dynamic>>{};

  static String _translationKey(String t) => 'translation/$t';

  Future<Map<String, dynamic>?> _bible(String translation) async {
    final hit = _bibles[translation];
    if (hit != null) return hit;
    final raw = await _store.get(_translationKey(translation));
    if (raw is! Map) return null;
    return _bibles[translation] = raw.cast<String, dynamic>();
  }

  /// A passage from a downloaded translation, filtered the same way as the query below.
  static List<Verse> _fromBible(Map<String, dynamic> bible, Passage p) => [
    for (var c = p.chapter; c <= (p.chapterEnd ?? p.chapter); c++)
      for (final v in (bible['${p.book}|$c'] as List? ?? const []))
        if (p.chapterEnd != null ||
            p.verseStart == null ||
            (p.verseEnd == null ? v[0] == p.verseStart : (v[0] as int) >= p.verseStart! && (v[0] as int) <= p.verseEnd!))
          Verse(book: p.book, chapter: c, number: v[0] as int, text: v[1] as String),
  ];

  @override
  Future<List<Verse>> passage(Passage p, String translation) async {
    // A downloaded translation answers straight from the device, online or not.
    final bible = await _bible(translation);
    if (bible != null) return _fromBible(bible, p);
    return _read(
      'passage/$translation/${p.book}/${p.chapter}-${p.chapterEnd}/${p.verseStart}-${p.verseEnd}',
      () {
        var q = _db
            .from('bible_verses')
            .select('chapter, verse_start, text')
            .eq('translation', translation)
            .eq('book', p.book)
            .not('verse_start', 'is', null);
        if (p.chapterEnd != null) {
          q = q.gte('chapter', p.chapter).lte('chapter', p.chapterEnd!);
        } else {
          q = q.eq('chapter', p.chapter);
          if (p.verseStart != null) {
            q = p.verseEnd != null
                ? q.gte('verse_start', p.verseStart!).lte('verse_start', p.verseEnd!)
                : q.eq('verse_start', p.verseStart!);
          }
        }
        return q.order('chapter', ascending: true).order('verse_start', ascending: true).limit(3000);
      },
      (raw) => [
        for (final r in _rows(raw))
          Verse(
            book: p.book,
            chapter: r['chapter'] as int,
            number: r['verse_start'] as int,
            text: cleanVerseText(r['text'] as String, translation),
          ),
      ],
    );
  }

  @override
  Future<Set<String>> downloadedTranslations() async => {
    for (final k in await _store.keys('translation/')) k.substring('translation/'.length),
  };

  @override
  Future<int> downloadedSize() => _store.size('translation/');

  /// Fetches every verse of [translation] a page at a time (PostgREST returns at most 1000
  /// rows a request) and saves it as one document keyed "Book|chapter".
  @override
  Future<void> downloadTranslation(String translation, {void Function(double progress)? onProgress}) async {
    const page = 1000, parallel = 4;
    PostgrestFilterBuilder<List<_Row>> verses() =>
        _db.from('bible_verses').select('book, chapter, verse_start, text').eq('translation', translation).not('verse_start', 'is', null);
    final total = await _run(() async => (await verses().count(CountOption.exact)).count);
    final chapters = <String, List<List<Object>>>{};
    var done = 0;
    for (var from = 0; from < total; from += page * parallel) {
      final batch = await _run(
        () => Future.wait([
          for (var f = from; f < from + page * parallel && f < total; f += page)
            verses().order('id', ascending: true).range(f, f + page - 1),
        ]),
        timeout: const Duration(seconds: 60),
      );
      for (final rows in batch) {
        for (final r in rows) {
          (chapters['${r['book']}|${r['chapter']}'] ??= []).add([
            r['verse_start'] as int,
            cleanVerseText(r['text'] as String, translation),
          ]);
          done++;
        }
      }
      onProgress?.call(total == 0 ? 1 : done / total);
    }
    for (final list in chapters.values) {
      list.sort((a, b) => (a[0] as int).compareTo(b[0] as int));
    }
    _bibles[translation] = chapters;
    await _store.put(_translationKey(translation), chapters);
  }

  @override
  Future<void> removeTranslation(String translation) async {
    _bibles.remove(translation);
    await _store.remove(_translationKey(translation));
  }

  // Community

  @override
  Future<List<PrayerPost>> posts() => _read(
    _k('posts'),
    () => _db
        .from('launch_prayer_posts')
        .select('*, user_profiles(full_name, avatar_url), post_reactions(user_id, emoji), post_comments(count)')
        .or('user_id.eq.$_uid,and(is_active.eq.true,is_hidden.eq.false)')
        .order('created_at', ascending: false)
        .limit(100),
    (raw) {
      final me = _uid;
      return [
        for (final r in _rows(raw))
          () {
            final praying = [
              for (final x in (r['post_reactions'] as List? ?? const []))
                if (x['emoji'] == prayingEmoji) x['user_id'],
            ];
            final comments = r['post_comments'] as List? ?? const [];
            return PrayerPost(
              id: r['id'] as String,
              author: _authorFromJoin(r['user_id'] as String, r['user_profiles']),
              type: PostType.parse(r['type'] as String),
              title: r['title'] as String,
              content: r['content'] as String,
              createdAt: DateTime.parse(r['created_at'] as String).toLocal(),
              isActive: r['is_active'] as bool? ?? true,
              prayingCount: praying.length,
              iAmPraying: praying.contains(me),
              commentCount: comments.isEmpty ? 0 : (comments.first as Map)['count'] as int? ?? 0,
            );
          }(),
      ];
    },
  );

  @override
  Future<void> createPost(PostType type, String title, String content) => _run(
    () => _db.from('launch_prayer_posts').insert({
      'user_id': _uid,
      'type': type.name,
      'title': title.trim(),
      'content': content.trim(),
      'is_active': true,
    }),
  );

  @override
  Future<void> setPostActive(String postId, bool active) =>
      _run(() => _db.from('launch_prayer_posts').update({'is_active': active}).eq('id', postId).eq('user_id', _uid));

  @override
  Future<void> deletePost(String postId) => _run(() => _db.from('launch_prayer_posts').delete().eq('id', postId).eq('user_id', _uid));

  @override
  Future<void> setPraying(String postId, bool praying) => _change({'op': 'praying', 'post': postId, 'praying': praying});

  @override
  Future<List<Comment>> postComments(String postId) => _read(_k('postComments/$postId'), () async {
    final rows = await _db.from('post_comments').select().eq('post_id', postId).order('created_at', ascending: true);
    return {'rows': rows, 'authors': await _authorRows(rows.map((r) => r['user_id'] as String))};
  }, _comments);

  @override
  Future<void> addPostComment(String postId, String content) => _change({'op': 'post_comment', 'post': postId, 'content': content.trim()});

  @override
  Future<List<Profile>> members() => _read(
    _k('members'),
    () => _db
        .from('user_profiles')
        .select(
          'user_id, full_name, avatar_url, bio, skills, interests, looking_for_business_partner, looking_for_accountability_partner, linkedin_url, facebook_url, twitter_url, website_url',
        )
        .neq('user_id', _uid)
        .not('full_name', 'is', null)
        .order('full_name', ascending: true),
    (raw) => [for (final r in _rows(raw)) Profile.fromRow(r)],
  );

  // Groups

  Future<List<_Row>> _previewRows(List<String> groupIds) async {
    if (groupIds.isEmpty) return [];
    return _rows(await _db.rpc('get_groups_member_preview', params: {'p_group_ids': groupIds}));
  }

  static Map<String, _Row> _previewMap(Object? rows) => {for (final r in _rows(rows)) r['group_id'] as String: r};

  GroupSummary _summary(Map<String, dynamic> g, Map<String, dynamic>? preview, {String? requestId, String? requestStatus}) => GroupSummary(
    id: g['id'] as String,
    name: g['name'] as String,
    objective: g['target_objective'] as String? ?? '',
    createdBy: g['created_by'] as String,
    memberCount: preview?['member_count'] as int? ?? 0,
    previewNames: [for (final n in (preview?['preview_names'] as List? ?? const [])) (n as String?) ?? 'Member'],
    previewAvatars: [for (final a in (preview?['preview_avatars'] as List? ?? const [])) a as String?],
    myRequestId: requestId,
    myRequestStatus: requestStatus,
  );

  Future<List<String>> _myGroupIds() async {
    final rows = await _db.from('user_group_memberships').select('group_id').eq('user_id', _uid);
    return [for (final r in rows) r['group_id'] as String];
  }

  @override
  Future<List<GroupSummary>> myGroups() => _read(
    _k('myGroups'),
    () async {
      final ids = await _myGroupIds();
      if (ids.isEmpty) return {'groups': const [], 'previews': const []};
      final (groups, previews) = await (
        _db.from('accountability_groups').select().inFilter('id', ids).order('created_at', ascending: true),
        _previewRows(ids),
      ).wait;
      return {'groups': groups, 'previews': previews};
    },
    (raw) {
      final previews = _previewMap(raw['previews']);
      return [for (final g in _rows(raw['groups'])) _summary(g, previews[g['id']])];
    },
  );

  @override
  Future<List<Invitation>> invitations() => _read(
    _k('invitations'),
    () async {
      final rows = await _db
          .from('group_invitations')
          .select('id, group_id, invited_by, accountability_groups(name)')
          .eq('invited_user_id', _uid)
          .eq('status', 'pending')
          .order('created_at', ascending: false);
      return {'rows': rows, 'authors': await _authorRows(rows.map((r) => r['invited_by'] as String))};
    },
    (raw) {
      final inviters = _authorMap(raw['authors']);
      return [
        for (final r in _rows(raw['rows']))
          Invitation(
            id: r['id'] as String,
            groupId: r['group_id'] as String,
            groupName: (r['accountability_groups'] as Map?)?['name'] as String? ?? 'A group',
            invitedBy: inviters[r['invited_by']] ?? Author(userId: r['invited_by'] as String),
          ),
      ];
    },
  );

  @override
  Future<List<GroupSummary>> discoverGroups() => _run(() async {
    final (groups, mine, requests) = await (
      _db.from('accountability_groups').select('id, name, target_objective, created_by, created_at').order('created_at', ascending: false),
      _myGroupIds(),
      _db.from('group_join_requests').select('id, group_id, status').eq('requester_id', _uid),
    ).wait;
    final others = [
      for (final g in groups)
        if (!mine.contains(g['id'])) g,
    ];
    final previews = _previewMap(await _previewRows([for (final g in others) g['id'] as String]));
    final byGroup = {for (final r in requests) r['group_id'] as String: r};
    return [
      for (final g in others)
        _summary(
          g,
          previews[g['id']],
          requestId: byGroup[g['id']]?['id'] as String?,
          requestStatus: byGroup[g['id']]?['status'] as String?,
        ),
    ];
  });

  @override
  Future<GroupDetail> group(String groupId) => _read(
    _k('group/$groupId'),
    () async {
      final (group, previews, commitments, reflections) = await (
        _db.from('accountability_groups').select().eq('id', groupId).single(),
        _previewRows([groupId]),
        _db.from('group_commitments').select().eq('group_id', groupId).order('created_at', ascending: false),
        _db.from('debrief_sessions').select().eq('group_id', groupId).order('session_date', ascending: false).limit(30),
      ).wait;
      final requests = group['created_by'] == _uid
          ? await _db
                .from('group_join_requests')
                .select()
                .eq('group_id', groupId)
                .eq('status', 'pending')
                .order('created_at', ascending: true)
          : const <_Row>[];
      final authors = await _authorRows([
        for (final c in commitments) c['user_id'] as String,
        for (final r in reflections) r['facilitator_id'] as String,
        for (final r in requests) r['requester_id'] as String,
      ]);
      return {
        'group': group,
        'previews': previews,
        'commitments': commitments,
        'reflections': reflections,
        'requests': requests,
        'authors': authors,
      };
    },
    (raw) {
      final group = (raw['group'] as Map).cast<String, dynamic>();
      final authors = _authorMap(raw['authors']);
      Author who(Object? id) => authors[id] ?? Author(userId: id as String);
      final rhythm = group['rhythm_config'] as Map?;
      return GroupDetail(
        summary: _summary(group, _previewMap(raw['previews'])[groupId]),
        commitments: [for (final c in _rows(raw['commitments'])) Commitment.fromRow(c, who(c['user_id']))],
        reflections: [
          for (final r in _rows(raw['reflections']))
            Reflection(
              id: r['id'] as String,
              author: who(r['facilitator_id']),
              notes: r['reflection_notes'] as String? ?? '',
              hardQuestion: r['hard_question_response'] as String?,
              date: DateTime.parse(r['session_date'] as String),
            ),
        ],
        joinRequests: [
          for (final r in _rows(raw['requests']))
            JoinRequest(
              id: r['id'] as String,
              requester: who(r['requester_id']),
              message: r['message'] as String?,
              createdAt: DateTime.parse(r['created_at'] as String).toLocal(),
            ),
        ],
        rhythmDay: rhythm?['day'] as String?,
        rhythmTime: rhythm?['time'] as String?,
      );
    },
  );

  @override
  Future<String> createGroup(String name, String objective) => _run(() async {
    final g = await _db
        .from('accountability_groups')
        .insert({'name': name.trim(), 'target_objective': objective.trim(), 'created_by': _uid})
        .select('id')
        .single();
    await _db.from('user_group_memberships').insert({'user_id': _uid, 'group_id': g['id']});
    return g['id'] as String;
  });

  @override
  Future<void> requestToJoin(String groupId, String? message) => _run(() async {
    final existing = await _db
        .from('group_join_requests')
        .select('id, status')
        .eq('requester_id', _uid)
        .eq('group_id', groupId)
        .maybeSingle();
    if (existing?['status'] == 'pending') throw const BackendException('Your request is already waiting for the group leader.');
    if (existing != null) await _db.from('group_join_requests').delete().eq('id', existing['id'] as String);
    final req = await _db
        .from('group_join_requests')
        .insert({'group_id': groupId, 'requester_id': _uid, 'message': (message?.trim().isEmpty ?? true) ? null : message!.trim()})
        .select('id')
        .single();
    final (name, group) = await (_myName(), _db.from('accountability_groups').select('name, created_by').eq('id', groupId).single()).wait;
    await _notify(
      group['created_by'] as String,
      'join_request',
      'New Join Request',
      '$name wants to join "${group['name']}"',
      '/accountability',
      req['id'] as String,
    );
  });

  @override
  Future<void> cancelJoinRequest(String requestId) =>
      _run(() => _db.from('group_join_requests').delete().eq('id', requestId).eq('requester_id', _uid));

  @override
  Future<void> acceptInvitation(String invitationId) => _run(() async {
    final inv = await _db.from('group_invitations').select('invited_by, accountability_groups(name)').eq('id', invitationId).single();
    await _db.rpc('accept_group_invitation', params: {'invitation_id': invitationId});
    final groupName = (inv['accountability_groups'] as Map?)?['name'] ?? 'your group';
    await _notify(
      inv['invited_by'] as String,
      'invitation_accepted',
      'Invitation Accepted',
      '${await _myName()} accepted your invitation to join "$groupName"',
      '/accountability',
      invitationId,
    );
  });

  @override
  Future<void> declineInvitation(String invitationId) => _run(() async {
    await _db
        .from('group_invitations')
        .update({'status': 'declined', 'responded_at': DateTime.now().toUtc().toIso8601String()})
        .eq('id', invitationId)
        .eq('invited_user_id', _uid);
    final inv = await _db.from('group_invitations').select('invited_by, accountability_groups(name)').eq('id', invitationId).single();
    await _db.from('notifications').update({'is_read': true}).eq('reference_id', invitationId).eq('user_id', _uid);
    final groupName = (inv['accountability_groups'] as Map?)?['name'] ?? 'your group';
    await _notify(
      inv['invited_by'] as String,
      'invitation_declined',
      'Invitation Declined',
      '${await _myName()} declined your invitation to join "$groupName"',
      '/directory',
      invitationId,
    );
  });

  @override
  Future<void> approveJoinRequest(String requestId) => _run(() async {
    await _db.rpc('approve_join_request', params: {'request_id': requestId});
    final req = await _db.from('group_join_requests').select('requester_id, accountability_groups(name)').eq('id', requestId).single();
    final groupName = (req['accountability_groups'] as Map?)?['name'] ?? 'the group';
    await _notify(
      req['requester_id'] as String,
      'join_request_approved',
      'Join Request Approved',
      'Your request to join "$groupName" has been approved!',
      '/accountability',
      requestId,
    );
  });

  @override
  Future<void> rejectJoinRequest(String requestId) => _run(() async {
    final req = await _db
        .from('group_join_requests')
        .select('requester_id, group_id, accountability_groups(name)')
        .eq('id', requestId)
        .single();
    await _db
        .from('group_join_requests')
        .update({'status': 'rejected', 'responded_at': DateTime.now().toUtc().toIso8601String()})
        .eq('id', requestId)
        .eq('group_id', req['group_id'] as String);
    final groupName = (req['accountability_groups'] as Map?)?['name'] ?? 'a group';
    await _notify(
      req['requester_id'] as String,
      'join_request_rejected',
      'Join Request Declined',
      'Your request to join "$groupName" was not approved at this time.',
      '/accountability/discover',
      requestId,
    );
  });

  @override
  Future<void> addCommitment(String groupId, String text, DateTime due) => _run(
    () => _db.from('group_commitments').insert({
      'group_id': groupId,
      'user_id': _uid,
      'commitment_text': text.trim(),
      'status': 'active',
      'due_date': due.toUtc().toIso8601String(),
    }),
  );

  @override
  Future<void> setCommitmentStatus(String commitmentId, CommitmentStatus status) =>
      _change({'op': 'commitment_status', 'commitment': commitmentId, 'status': status.name});

  @override
  Future<void> deleteCommitment(String commitmentId) =>
      _run(() => _db.from('group_commitments').delete().eq('id', commitmentId).eq('user_id', _uid));

  @override
  Future<void> saveReflection(String groupId, String notes, String? hardQuestion) => _change({
    'op': 'reflection',
    'group': groupId,
    'notes': notes.trim(),
    'hard': hardQuestion?.trim(),
    // The web keys a day's reflection on the UTC date; match it so both apps edit the same row.
    'date': DateTime.now().toUtc().toIso8601String().substring(0, 10),
  });

  // Me

  @override
  Future<List<AppNotification>> notifications() => _read(
    _k('notifications'),
    () => _db.from('notifications').select().eq('user_id', _uid).order('created_at', ascending: false).limit(50),
    (raw) => [for (final r in _rows(raw)) AppNotification.fromRow(r)],
  );

  @override
  Future<void> markNotificationRead(String id) => _change({'op': 'notification_read', 'notification': id});

  @override
  Future<void> markAllNotificationsRead() =>
      _run(() => _db.from('notifications').update({'is_read': true}).eq('user_id', _uid).eq('is_read', false));

  @override
  Future<List<Resource>> resources() => _read(
    _k('resources'),
    () => _db
        .from('resources')
        .select('*, user_profiles(full_name, avatar_url)')
        .eq('is_active', true)
        .eq('is_hidden', false)
        .order('created_at', ascending: false),
    (raw) => [
      for (final r in _rows(raw))
        Resource(
          id: r['id'] as String,
          title: r['title'] as String,
          description: r['description'] as String?,
          category: r['category'] as String,
          url: (r['external_url'] as String?) ?? (r['file_url'] as String?),
          author: _authorFromJoin(r['user_id'] as String, r['user_profiles']),
          createdAt: DateTime.parse(r['created_at'] as String).toLocal(),
        ),
    ],
  );

  // Changes that can wait for a connection

  /// Sends [change] now, or, offline, queues it and applies it to the saved rows so the app
  /// shows it straight away. Anything already queued goes first, to keep the order.
  Future<void> _change(Map<String, Object?> change) async {
    await _outbox.load(_uid);
    change = {...change, 'at': DateTime.now().toUtc().toIso8601String()};
    if (_outbox.isEmpty && !_offline) {
      try {
        return await _run(() => _send(change));
      } on BackendException catch (e) {
        if (!e.offline) rethrow;
      }
    }
    await _outbox.add(change);
    await _applyLocally(change);
    _emit();
    if (!_offline) unawaited(sync());
  }

  Future<void> _send(Map<String, Object?> c) async {
    final uid = _uid, at = c['at'] as String;
    switch (c['op']) {
      case 'day_complete':
        if (c['complete'] == true) {
          // completed_at is when it was read, not when it synced, so the streak stays right.
          await _db.from('user_progress').upsert({
            'user_id': uid,
            'day_id': c['day'],
            'is_completed': true,
            'completed_at': at,
          }, onConflict: 'user_id,day_id');
        } else {
          await _db.from('user_progress').delete().eq('user_id', uid).eq('day_id', c['day'] as String);
        }
      case 'praying':
        if (c['praying'] == true) {
          await _db
              .from('post_reactions')
              .upsert(
                {'post_id': c['post'], 'user_id': uid, 'emoji': prayingEmoji},
                onConflict: 'post_id,user_id,emoji',
                ignoreDuplicates: true,
              );
        } else {
          await _db.from('post_reactions').delete().eq('post_id', c['post'] as String).eq('user_id', uid).eq('emoji', prayingEmoji);
        }
      case 'day_comment':
        await _db.from('day_comments').insert({'day_id': c['day'], 'user_id': uid, 'content': c['content']});
      case 'post_comment':
        await _db.from('post_comments').insert({'post_id': c['post'], 'user_id': uid, 'content': c['content']});
      case 'commitment_status':
        await _db
            .from('group_commitments')
            .update({'status': c['status'], 'completed_at': c['status'] == CommitmentStatus.completed.name ? at : null})
            .eq('id', c['commitment'] as String)
            .eq('user_id', uid);
      case 'reflection':
        final existing = await _db
            .from('debrief_sessions')
            .select('id')
            .eq('group_id', c['group'] as String)
            .eq('facilitator_id', uid)
            .eq('session_date', c['date'] as String)
            .maybeSingle();
        final fields = {'reflection_notes': c['notes'], 'hard_question_response': c['hard']};
        if (existing != null) {
          await _db.from('debrief_sessions').update(fields).eq('id', existing['id'] as String);
        } else {
          await _db.from('debrief_sessions').insert({...fields, 'group_id': c['group'], 'facilitator_id': uid, 'session_date': c['date']});
        }
      case 'notification_read':
        await _db.from('notifications').update({'is_read': true}).eq('id', c['notification'] as String).eq('user_id', uid);
    }
  }

  /// Edits the saved document under [key] in place, or does nothing if there isn't one.
  Future<void> _patch(String key, void Function(dynamic raw) edit) async {
    final raw = await _store.get(key);
    if (raw == null) return;
    edit(raw);
    await _store.put(key, raw);
  }

  Future<Map<String, Object?>> _meAsAuthor() async {
    final p = await _store.get(_k('profile')) as Map?;
    return {'user_id': _uid, 'full_name': p?['full_name'], 'avatar_url': p?['avatar_url']};
  }

  Future<void> _addPendingComment(String key, Map<String, Object?> c) async {
    final raw = (await _store.get(key) as Map?) ?? {'rows': [], 'authors': []};
    (raw['rows'] as List).add({'id': 'pending-${c['at']}', 'user_id': _uid, 'content': c['content'], 'created_at': c['at']});
    (raw['authors'] as List).add(await _meAsAuthor());
    await _store.put(key, raw);
  }

  Future<void> _applyLocally(Map<String, Object?> c) async {
    final uid = _uid;
    switch (c['op']) {
      case 'day_complete':
        for (final key in await _store.keys(_k('planDays/'))) {
          await _patch(key, (raw) {
            if (!(raw['days'] as List).any((d) => d['id'] == c['day'])) return;
            final progress = raw['progress'] as List..removeWhere((p) => p['day_id'] == c['day']);
            if (c['complete'] == true) progress.add({'day_id': c['day'], 'is_completed': true, 'completed_at': c['at']});
          });
        }
      case 'praying':
        await _patch(_k('posts'), (raw) {
          for (final post in raw as List) {
            if (post['id'] != c['post']) continue;
            final reactions = (post['post_reactions'] as List? ?? [])
              ..removeWhere((r) => r['user_id'] == uid && r['emoji'] == prayingEmoji);
            if (c['praying'] == true) reactions.add({'user_id': uid, 'emoji': prayingEmoji});
            post['post_reactions'] = reactions;
          }
        });
      case 'day_comment':
        await _addPendingComment(_k('dayComments/${c['day']}'), c);
      case 'post_comment':
        await _addPendingComment(_k('postComments/${c['post']}'), c);
        await _patch(_k('posts'), (raw) {
          for (final post in raw as List) {
            if (post['id'] != c['post']) continue;
            final counts = post['post_comments'] as List? ?? const [];
            final n = counts.isEmpty ? 0 : (counts.first as Map)['count'] as int? ?? 0;
            post['post_comments'] = [
              {'count': n + 1},
            ];
          }
        });
      case 'commitment_status':
        for (final key in await _store.keys(_k('group/'))) {
          await _patch(key, (raw) {
            for (final row in raw['commitments'] as List) {
              if (row['id'] != c['commitment']) continue;
              row['status'] = c['status'];
              row['completed_at'] = c['status'] == CommitmentStatus.completed.name ? c['at'] : null;
            }
          });
        }
      case 'reflection':
        final me = await _meAsAuthor();
        await _patch(_k('group/${c['group']}'), (raw) {
          (raw['reflections'] as List)
            ..removeWhere((r) => r['facilitator_id'] == uid && r['session_date'] == c['date'])
            ..insert(0, {
              'id': 'pending-${c['at']}',
              'facilitator_id': uid,
              'reflection_notes': c['notes'],
              'hard_question_response': c['hard'],
              'session_date': c['date'],
            });
          (raw['authors'] as List).add(me);
        });
      case 'notification_read':
        await _patch(_k('notifications'), (raw) {
          for (final n in raw as List) {
            if (n['id'] == c['notification']) n['is_read'] = true;
          }
        });
    }
  }

  @override
  Future<void> sync() async {
    final uid = userId;
    if (_syncing || uid == null) return;
    _syncing = true;
    try {
      await _outbox.load(uid);
      if (_outbox.isEmpty) {
        // Nothing to send; just see whether the server answers.
        if (_offline) await _run(() => _db.from('reading_plans').select('id').limit(1));
      } else {
        await _outbox.flush((c) => _run(() => _send(c)), (e) => e is BackendException && e.offline);
      }
    } on BackendException {
      // Still offline; the probe tries again.
    } finally {
      _syncing = false;
      _emit();
    }
  }
}
