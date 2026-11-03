import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/backend.dart';
import '../domain/models.dart';
import '../domain/progress.dart';
import '../domain/scripture.dart';
import 'reader_settings.dart';

/// Overridden in main() and in tests.
final backendProvider = Provider<Backend>((ref) => throw UnimplementedError('backendProvider is set in main()'));
final preferencesProvider = Provider<SharedPreferences>((ref) => throw UnimplementedError('preferencesProvider is set in main()'));

/// The signed-in member's id, or null. Everything member-specific rebuilds when it changes.
final userIdProvider = StreamProvider<String?>((ref) async* {
  final backend = ref.watch(backendProvider);
  yield backend.userId;
  yield* backend.userChanges.distinct();
});

final profileProvider = FutureProvider<Profile>((ref) async {
  ref.watch(userIdProvider);
  return ref.watch(backendProvider).myProfile();
});

final readerSettingsProvider = NotifierProvider<ReaderSettingsNotifier, ReaderSettings>(ReaderSettingsNotifier.new);

/// The translation to read in: the member's choice on their profile, shared with the web.
final translationProvider = Provider<String>((ref) {
  final t = ref.watch(profileProvider).value?.preferredTranslation;
  return translations.containsKey(t) ? t! : 'KJV';
});

// Plans

final plansProvider = FutureProvider<List<ReadingPlan>>((ref) async {
  ref.watch(userIdProvider);
  return ref.watch(backendProvider).plans();
});

final subscribedPlanIdsProvider = FutureProvider<List<String>>((ref) async {
  ref.watch(userIdProvider);
  return ref.watch(backendProvider).subscribedPlanIds();
});

/// The plan Today follows: the first one subscribed to, as on the web's dashboard.
final activePlanProvider = FutureProvider<ReadingPlan?>((ref) async {
  final ids = await ref.watch(subscribedPlanIdsProvider.future);
  if (ids.isEmpty) return null;
  final plans = await ref.watch(plansProvider.future);
  for (final p in plans) {
    if (p.id == ids.first) return p;
  }
  return null;
});

final planDaysProvider = FutureProvider.family<List<PlanDay>, String>((ref, planId) async {
  ref.watch(userIdProvider);
  return ref.watch(backendProvider).planDays(planId);
});

final dayCommentsProvider = FutureProvider.autoDispose.family<List<Comment>, String>(
  (ref, dayId) => ref.watch(backendProvider).dayComments(dayId),
);

/// Verses for a plan day's whole reference (which may list several passages).
final readingProvider = FutureProvider.autoDispose.family<List<Verse>, ({String reference, String translation})>((ref, key) async {
  final backend = ref.watch(backendProvider);
  final parts = await Future.wait([for (final p in parsePassages(key.reference)) backend.passage(p, key.translation)]);
  return [for (final part in parts) ...part];
});

final chapterProvider = FutureProvider.autoDispose.family<List<Verse>, ({String book, int chapter, String translation})>(
  (ref, key) => ref.watch(backendProvider).passage(Passage(book: key.book, chapter: key.chapter), key.translation),
);

/// Whether the Bible reader has tucked the tab bar away while you scroll down.
final chromeHiddenProvider = NotifierProvider<ChromeHidden, bool>(ChromeHidden.new);

class ChromeHidden extends Notifier<bool> {
  @override
  bool build() => false;

  void set(bool hidden) {
    if (state != hidden) state = hidden;
  }
}

/// Days in a row with a reading marked done.
final streakProvider = Provider<int>((ref) {
  final plan = ref.watch(activePlanProvider).value;
  if (plan == null) return 0;
  final days = ref.watch(planDaysProvider(plan.id)).value ?? const [];
  return readingStreak([for (final d in days) ?d.completedAt], DateTime.now());
});

// Community

final postsProvider = FutureProvider<List<PrayerPost>>((ref) async {
  ref.watch(userIdProvider);
  return ref.watch(backendProvider).posts();
});

final postCommentsProvider = FutureProvider.autoDispose.family<List<Comment>, String>(
  (ref, postId) => ref.watch(backendProvider).postComments(postId),
);

final membersProvider = FutureProvider<List<Profile>>((ref) async {
  ref.watch(userIdProvider);
  return ref.watch(backendProvider).members();
});

// Groups

final myGroupsProvider = FutureProvider<List<GroupSummary>>((ref) async {
  ref.watch(userIdProvider);
  return ref.watch(backendProvider).myGroups();
});

final invitationsProvider = FutureProvider<List<Invitation>>((ref) async {
  ref.watch(userIdProvider);
  return ref.watch(backendProvider).invitations();
});

final discoverGroupsProvider = FutureProvider.autoDispose<List<GroupSummary>>((ref) => ref.watch(backendProvider).discoverGroups());

final groupProvider = FutureProvider.autoDispose.family<GroupDetail, String>((ref, id) => ref.watch(backendProvider).group(id));

// Me

final notificationsProvider = FutureProvider<List<AppNotification>>((ref) async {
  ref.watch(userIdProvider);
  return ref.watch(backendProvider).notifications();
});

final unreadCountProvider = Provider<int>((ref) => (ref.watch(notificationsProvider).value ?? const []).where((n) => !n.isRead).length);

final resourcesProvider = FutureProvider.autoDispose<List<Resource>>((ref) => ref.watch(backendProvider).resources());

// Offline

final syncStateProvider = StreamProvider<SyncState>((ref) async* {
  final backend = ref.watch(backendProvider);
  yield backend.syncState;
  yield* backend.syncStates;
});

/// Reloads everything the member sees, after reconnecting or after queued changes are sent.
void refreshAfterSync(WidgetRef ref) {
  ref
    ..invalidate(profileProvider)
    ..invalidate(subscribedPlanIdsProvider)
    ..invalidate(planDaysProvider)
    ..invalidate(dayCommentsProvider)
    ..invalidate(postsProvider)
    ..invalidate(postCommentsProvider)
    ..invalidate(membersProvider)
    ..invalidate(myGroupsProvider)
    ..invalidate(invitationsProvider)
    ..invalidate(groupProvider)
    ..invalidate(notificationsProvider)
    ..invalidate(resourcesProvider);
}

final downloadedTranslationsProvider = FutureProvider<Set<String>>((ref) => ref.watch(backendProvider).downloadedTranslations());

final downloadedSizeProvider = FutureProvider<int>((ref) {
  ref.watch(downloadedTranslationsProvider);
  return ref.watch(backendProvider).downloadedSize();
});

/// How many plan days ahead to keep on the device.
const readAheadDays = 7;

/// Fetches the coming week's readings so they're saved on the device before they're needed.
final upcomingReadingsProvider = FutureProvider<void>((ref) async {
  final plan = await ref.watch(activePlanProvider.future);
  if (plan == null) return;
  final days = await ref.watch(planDaysProvider(plan.id).future);
  final translation = ref.watch(translationProvider);
  final today = todaysReading(days, DateTime.now());
  final start = today == null ? 0 : days.indexWhere((d) => d.id == today.id);
  final backend = ref.read(backendProvider);
  for (final d in days.skip(start).take(readAheadDays)) {
    for (final p in parsePassages(d.reference)) {
      try {
        await backend.passage(p, translation);
      } on BackendException {
        return; // Offline; it tries again next time Today loads.
      }
    }
  }
});
