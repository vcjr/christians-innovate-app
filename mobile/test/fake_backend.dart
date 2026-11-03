import 'dart:async';
import 'dart:typed_data';

import 'package:ci_mobile/data/backend.dart';
import 'package:ci_mobile/domain/models.dart';
import 'package:ci_mobile/domain/scripture.dart';

/// An in-memory [Backend] with one member, one plan and a small prayer wall.
class FakeBackend implements Backend {
  FakeBackend({bool signedIn = true, this.onboarded = true}) : _userId = signedIn ? 'me' : null;

  String? _userId;
  bool onboarded;
  final _users = StreamController<String?>.broadcast();
  final calls = <String>[];

  final plan = const ReadingPlan(id: 'plan', title: 'Bible in a Year', isDefault: true, dayCount: 3);
  late final days = <PlanDay>[
    PlanDay(id: 'd1', planId: 'plan', dayNumber: 1, reference: 'Genesis 1', completedAt: DateTime.now().subtract(const Duration(days: 1))),
    const PlanDay(id: 'd2', planId: 'plan', dayNumber: 2, reference: 'Genesis 2, Psalm 2', devotional: 'Rest is part of the work.'),
    const PlanDay(id: 'd3', planId: 'plan', dayNumber: 3, reference: 'Genesis 3'),
  ];
  final commentsByDay = <String, List<Comment>>{};
  late var wall = <PrayerPost>[
    PrayerPost(
      id: 'p1',
      author: const Author(userId: 'maya', name: 'Maya Chen'),
      type: PostType.prayer,
      title: 'Clinic permit',
      content: 'Please pray with us.',
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      prayingCount: 2,
    ),
  ];

  @override
  String? get userId => _userId;
  @override
  Stream<String?> get userChanges => _users.stream;

  @override
  Future<void> signIn(String email, String password) async {
    calls.add('signIn $email');
    if (password != 'right-password') throw const BackendException('That email and password don’t match.');
    _userId = 'me';
    _users.add('me');
  }

  @override
  Future<bool> signUp(SignUpDetails details) async {
    calls.add('signUp ${details.email} bibleYear=${details.bibleYear}');
    return true;
  }

  @override
  Future<void> sendPasswordReset(String email) async => calls.add('reset $email');

  @override
  Future<void> signOut() async {
    _userId = null;
    _users.add(null);
  }

  @override
  Future<Profile> myProfile() async => Profile(
    userId: 'me',
    fullName: 'Jordan Ellis',
    email: 'jordan@example.com',
    hasCompletedOnboarding: onboarded,
    skills: const ['Design'],
  );

  @override
  Future<void> updateProfile(Map<String, Object?> fields) async {
    calls.add('updateProfile ${fields.keys.join(',')}');
    if (fields['has_completed_onboarding'] == true) onboarded = true;
  }

  @override
  Future<String> uploadAvatar(Uint8List bytes, String extension) async => 'https://example.com/a.$extension';

  @override
  Future<List<ReadingPlan>> plans() async => [plan];
  @override
  Future<List<String>> subscribedPlanIds() async => ['plan'];
  @override
  Future<void> subscribe(String planId) async => calls.add('subscribe $planId');
  @override
  Future<void> unsubscribe(String planId) async => calls.add('unsubscribe $planId');
  @override
  Future<List<PlanDay>> planDays(String planId) async => List.of(days);

  @override
  Future<void> setDayComplete(String dayId, bool complete) async {
    calls.add('setDayComplete $dayId $complete');
    final i = days.indexWhere((d) => d.id == dayId);
    days[i] = days[i].withCompletedAt(complete ? DateTime.now() : null);
  }

  @override
  Future<List<Comment>> dayComments(String dayId) async => List.of(commentsByDay[dayId] ?? const []);

  @override
  Future<void> addDayComment(String dayId, String content) async {
    (commentsByDay[dayId] ??= []).add(
      Comment(
        id: 'c',
        author: const Author(userId: 'me', name: 'Jordan Ellis'),
        content: content,
        createdAt: DateTime.now(),
      ),
    );
  }

  @override
  Future<void> deleteDayComment(String commentId) async {}

  @override
  Future<List<Verse>> passage(Passage p, String translation) async => [
    Verse(book: p.book, chapter: p.chapter, number: 1, text: 'First verse of ${p.book} ${p.chapter}.'),
    Verse(book: p.book, chapter: p.chapter, number: 2, text: 'Second verse.'),
  ];

  @override
  Future<List<PrayerPost>> posts() async => List.of(wall);
  @override
  Future<void> createPost(PostType type, String title, String content) async => calls.add('createPost ${type.name} $title');
  @override
  Future<void> setPostActive(String postId, bool active) async {}
  @override
  Future<void> deletePost(String postId) async {}

  @override
  Future<void> setPraying(String postId, bool praying) async {
    calls.add('setPraying $postId $praying');
  }

  @override
  Future<List<Comment>> postComments(String postId) async => const [];
  @override
  Future<void> addPostComment(String postId, String content) async {}
  @override
  Future<List<Profile>> members() async => const [
    Profile(userId: 'maya', fullName: 'Maya Chen', skills: ['Engineering']),
  ];

  @override
  Future<List<GroupSummary>> myGroups() async => const [];
  @override
  Future<List<Invitation>> invitations() async => const [];
  @override
  Future<List<GroupSummary>> discoverGroups() async => const [];
  @override
  Future<GroupDetail> group(String groupId) => throw UnimplementedError();
  @override
  Future<String> createGroup(String name, String objective) async => 'g';
  @override
  Future<void> requestToJoin(String groupId, String? message) async {}
  @override
  Future<void> cancelJoinRequest(String requestId) async {}
  @override
  Future<void> acceptInvitation(String invitationId) async {}
  @override
  Future<void> declineInvitation(String invitationId) async {}
  @override
  Future<void> approveJoinRequest(String requestId) async {}
  @override
  Future<void> rejectJoinRequest(String requestId) async {}
  @override
  Future<void> addCommitment(String groupId, String text, DateTime due) async {}
  @override
  Future<void> setCommitmentStatus(String commitmentId, CommitmentStatus status) async {}
  @override
  Future<void> deleteCommitment(String commitmentId) async {}
  @override
  Future<void> saveReflection(String groupId, String notes, String? hardQuestion) async {}
  @override
  Future<List<AppNotification>> notifications() async => const [];
  @override
  Future<void> markNotificationRead(String id) async {}
  @override
  Future<void> markAllNotificationsRead() async {}
  @override
  Future<List<Resource>> resources() async => const [];

  Meeting? meeting;

  @override
  Future<Meeting?> nextMeeting() async => meeting;
  @override
  Future<void> recordAttendance(String meetingId) async => calls.add('attend $meetingId');

  var _syncState = const SyncState();
  final _syncStates = StreamController<SyncState>.broadcast();
  final downloaded = <String>{};

  void setSyncState(SyncState s) {
    _syncState = s;
    _syncStates.add(s);
  }

  @override
  SyncState get syncState => _syncState;
  @override
  Stream<SyncState> get syncStates => _syncStates.stream;
  @override
  Future<void> sync() async => calls.add('sync');
  @override
  Future<Set<String>> downloadedTranslations() async => {...downloaded};
  @override
  Future<void> downloadTranslation(String translation, {void Function(double progress)? onProgress}) async {
    calls.add('download $translation');
    onProgress?.call(1);
    downloaded.add(translation);
  }

  @override
  Future<void> removeTranslation(String translation) async => downloaded.remove(translation);
  @override
  Future<int> downloadedSize() async => downloaded.length * 7000000;
}
