import 'dart:typed_data';

import '../domain/models.dart';
import '../domain/scripture.dart';

/// Everything the app reads and writes. [SupabaseBackend] talks to the shared database;
/// tests use a fake.
abstract interface class Backend {
  // Auth
  String? get userId;
  Stream<String?> get userChanges;
  Future<void> signIn(String email, String password);

  /// Returns true when the account still needs its email confirmed.
  Future<bool> signUp(SignUpDetails details);
  Future<void> sendPasswordReset(String email);
  Future<void> signOut();

  // Profile
  Future<Profile> myProfile();
  Future<void> updateProfile(Map<String, Object?> fields);
  Future<String> uploadAvatar(Uint8List bytes, String extension);

  // Plans
  Future<List<ReadingPlan>> plans();
  Future<List<String>> subscribedPlanIds();
  Future<void> subscribe(String planId);
  Future<void> unsubscribe(String planId);

  /// Every day of a plan in order, with the signed-in member's progress.
  Future<List<PlanDay>> planDays(String planId);
  Future<void> setDayComplete(String dayId, bool complete);
  Future<List<Comment>> dayComments(String dayId);
  Future<void> addDayComment(String dayId, String content);
  Future<void> deleteDayComment(String commentId);

  // Scripture
  Future<List<Verse>> passage(Passage passage, String translation);

  // Community
  Future<List<PrayerPost>> posts();
  Future<void> createPost(PostType type, String title, String content);
  Future<void> setPostActive(String postId, bool active);
  Future<void> deletePost(String postId);
  Future<void> setPraying(String postId, bool praying);
  Future<List<Comment>> postComments(String postId);
  Future<void> addPostComment(String postId, String content);
  Future<List<Profile>> members();

  // Groups
  Future<List<GroupSummary>> myGroups();
  Future<List<Invitation>> invitations();
  Future<List<GroupSummary>> discoverGroups();
  Future<GroupDetail> group(String groupId);
  Future<String> createGroup(String name, String objective);
  Future<void> requestToJoin(String groupId, String? message);
  Future<void> cancelJoinRequest(String requestId);
  Future<void> acceptInvitation(String invitationId);
  Future<void> declineInvitation(String invitationId);
  Future<void> approveJoinRequest(String requestId);
  Future<void> rejectJoinRequest(String requestId);
  Future<void> addCommitment(String groupId, String text, DateTime due);
  Future<void> setCommitmentStatus(String commitmentId, CommitmentStatus status);
  Future<void> deleteCommitment(String commitmentId);
  Future<void> saveReflection(String groupId, String notes, String? hardQuestion);

  // Me
  Future<List<AppNotification>> notifications();
  Future<void> markNotificationRead(String id);
  Future<void> markAllNotificationsRead();
  Future<List<Resource>> resources();

  // Offline

  /// Whether the server is reachable and how many changes are waiting to be sent.
  SyncState get syncState;
  Stream<SyncState> get syncStates;

  /// Checks the connection and sends any changes made while offline.
  Future<void> sync();

  /// Translations saved whole on this device, so every chapter reads offline.
  Future<Set<String>> downloadedTranslations();
  Future<void> downloadTranslation(String translation, {void Function(double progress)? onProgress});
  Future<void> removeTranslation(String translation);

  /// Bytes the saved translations take up.
  Future<int> downloadedSize();
}

class SyncState {
  const SyncState({this.offline = false, this.pending = 0});
  final bool offline;

  /// Changes made offline that haven't reached the server yet.
  final int pending;

  @override
  bool operator ==(Object other) => other is SyncState && other.offline == offline && other.pending == pending;
  @override
  int get hashCode => Object.hash(offline, pending);
}

/// A failure worth showing to the member, in plain words.
class BackendException implements Exception {
  const BackendException(this.message, {this.offline = false});
  final String message;

  /// The server couldn't be reached, as opposed to refusing the request.
  final bool offline;

  static const unreachable = BackendException('You’re offline. This needs a connection.', offline: true);

  @override
  String toString() => message;
}
