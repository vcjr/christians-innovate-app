/// Rows from the shared Supabase database, shaped for the app.
library;

DateTime _date(Object? v) => DateTime.parse(v as String).toLocal();
DateTime? _dateOrNull(Object? v) => v == null ? null : DateTime.parse(v as String).toLocal();
List<String> _strings(Object? v) => [
  for (final s in (v as List?) ?? const [])
    if (s != null) s as String,
];

class Profile {
  const Profile({
    required this.userId,
    this.fullName,
    this.email,
    this.avatarUrl,
    this.bio,
    this.skills = const [],
    this.interests = const [],
    this.lookingForBusinessPartner = false,
    this.lookingForAccountabilityPartner = false,
    this.linkedinUrl,
    this.facebookUrl,
    this.twitterUrl,
    this.websiteUrl,
    this.preferredTranslation = 'KJV',
    this.hasCompletedOnboarding = false,
    this.emailNotifications = true,
    this.dailyReminder = true,
    this.meetingReminder = true,
    this.weeklyDigest = true,
  });

  final String userId;
  final String? fullName;
  final String? email;
  final String? avatarUrl;
  final String? bio;
  final List<String> skills;
  final List<String> interests;
  final bool lookingForBusinessPartner;
  final bool lookingForAccountabilityPartner;
  final String? linkedinUrl;
  final String? facebookUrl;
  final String? twitterUrl;
  final String? websiteUrl;
  final String preferredTranslation;
  final bool hasCompletedOnboarding;
  final bool emailNotifications;
  final bool dailyReminder;
  final bool meetingReminder;
  final bool weeklyDigest;

  String get displayName => (fullName?.trim().isNotEmpty ?? false) ? fullName!.trim() : 'Member';
  String get firstName => displayName.split(' ').first;

  Map<String, String> get links => {
    if (websiteUrl?.isNotEmpty ?? false) 'Website': websiteUrl!,
    if (linkedinUrl?.isNotEmpty ?? false) 'LinkedIn': linkedinUrl!,
    if (twitterUrl?.isNotEmpty ?? false) 'X': twitterUrl!,
    if (facebookUrl?.isNotEmpty ?? false) 'Facebook': facebookUrl!,
  };

  factory Profile.fromRow(Map<String, dynamic> r) => Profile(
    userId: r['user_id'] as String,
    fullName: r['full_name'] as String?,
    email: r['email'] as String?,
    avatarUrl: r['avatar_url'] as String?,
    bio: r['bio'] as String?,
    skills: _strings(r['skills']),
    interests: _strings(r['interests']),
    lookingForBusinessPartner: r['looking_for_business_partner'] as bool? ?? false,
    lookingForAccountabilityPartner: r['looking_for_accountability_partner'] as bool? ?? false,
    linkedinUrl: r['linkedin_url'] as String?,
    facebookUrl: r['facebook_url'] as String?,
    twitterUrl: r['twitter_url'] as String?,
    websiteUrl: r['website_url'] as String?,
    preferredTranslation: r['preferred_translation'] as String? ?? 'KJV',
    hasCompletedOnboarding: r['has_completed_onboarding'] as bool? ?? false,
    emailNotifications: r['email_notifications_enabled'] as bool? ?? true,
    dailyReminder: r['daily_reminder_enabled'] as bool? ?? true,
    meetingReminder: r['meeting_reminder_enabled'] as bool? ?? true,
    weeklyDigest: r['weekly_digest_enabled'] as bool? ?? true,
  );
}

/// Name and photo of whoever wrote a post or comment.
class Author {
  const Author({required this.userId, this.name, this.avatarUrl});
  final String userId;
  final String? name;
  final String? avatarUrl;
  String get displayName => (name?.trim().isNotEmpty ?? false) ? name!.trim() : 'Member';
}

class ReadingPlan {
  const ReadingPlan({required this.id, required this.title, this.description, this.isDefault = false, this.dayCount});
  final String id;
  final String title;
  final String? description;
  final bool isDefault;
  final int? dayCount;

  factory ReadingPlan.fromRow(Map<String, dynamic> r) {
    final days = r['plan_days'];
    return ReadingPlan(
      id: r['id'] as String,
      title: r['title'] as String,
      description: r['description'] as String?,
      isDefault: r['is_default'] as bool? ?? false,
      dayCount: days is List && days.isNotEmpty ? (days.first as Map)['count'] as int? : null,
    );
  }
}

class PlanDay {
  const PlanDay({
    required this.id,
    required this.planId,
    required this.dayNumber,
    required this.reference,
    this.devotional,
    this.dateAssigned,
    this.completedAt,
  });

  final String id;
  final String planId;
  final int dayNumber;
  final String reference;
  final String? devotional;

  /// The calendar date an admin pinned this day to, if any (a plain date, no time zone).
  final DateTime? dateAssigned;
  final DateTime? completedAt;

  bool get completed => completedAt != null;

  PlanDay withCompletedAt(DateTime? at) => PlanDay(
    id: id,
    planId: planId,
    dayNumber: dayNumber,
    reference: reference,
    devotional: devotional,
    dateAssigned: dateAssigned,
    completedAt: at,
  );

  factory PlanDay.fromRow(Map<String, dynamic> r, {DateTime? completedAt}) {
    final assigned = r['date_assigned'] as String?;
    return PlanDay(
      id: r['id'] as String,
      planId: r['plan_id'] as String,
      dayNumber: r['day_number'] as int,
      reference: r['scripture_reference'] as String,
      devotional: r['content_markdown'] as String?,
      dateAssigned: assigned == null ? null : DateTime.parse(assigned),
      completedAt: completedAt,
    );
  }
}

class Comment {
  const Comment({required this.id, required this.author, required this.content, required this.createdAt});
  final String id;
  final Author author;
  final String content;
  final DateTime createdAt;
}

enum PostType {
  prayer('Prayer', 'Ask the community to pray with you'),
  launch('Launch', 'Share something you are starting'),
  win('Win', 'Celebrate what God has done');

  const PostType(this.label, this.prompt);
  final String label;
  final String prompt;

  static PostType parse(String v) => PostType.values.firstWhere((t) => t.name == v, orElse: () => PostType.prayer);
}

class PrayerPost {
  const PrayerPost({
    required this.id,
    required this.author,
    required this.type,
    required this.title,
    required this.content,
    required this.createdAt,
    this.isActive = true,
    this.prayingCount = 0,
    this.iAmPraying = false,
    this.commentCount = 0,
  });

  final String id;
  final Author author;
  final PostType type;
  final String title;
  final String content;
  final DateTime createdAt;
  final bool isActive;
  final int prayingCount;
  final bool iAmPraying;
  final int commentCount;

  PrayerPost copyWith({int? prayingCount, bool? iAmPraying, int? commentCount}) => PrayerPost(
    id: id,
    author: author,
    type: type,
    title: title,
    content: content,
    createdAt: createdAt,
    isActive: isActive,
    prayingCount: prayingCount ?? this.prayingCount,
    iAmPraying: iAmPraying ?? this.iAmPraying,
    commentCount: commentCount ?? this.commentCount,
  );
}

class GroupSummary {
  const GroupSummary({
    required this.id,
    required this.name,
    required this.objective,
    required this.createdBy,
    this.memberCount = 0,
    this.previewNames = const [],
    this.previewAvatars = const [],
    this.myRequestId,
    this.myRequestStatus,
  });

  final String id;
  final String name;
  final String objective;
  final String createdBy;
  final int memberCount;
  final List<String> previewNames;
  final List<String?> previewAvatars;

  /// For Discover: the signed-in member's join request, if any.
  final String? myRequestId;
  final String? myRequestStatus;

  bool get requestPending => myRequestStatus == 'pending';
}

class Invitation {
  const Invitation({required this.id, required this.groupId, required this.groupName, required this.invitedBy});
  final String id;
  final String groupId;
  final String groupName;
  final Author invitedBy;
}

class JoinRequest {
  const JoinRequest({required this.id, required this.requester, this.message, required this.createdAt});
  final String id;
  final Author requester;
  final String? message;
  final DateTime createdAt;
}

enum CommitmentStatus { active, completed, sacrificed }

class Commitment {
  const Commitment({
    required this.id,
    required this.author,
    required this.text,
    required this.status,
    required this.dueDate,
    this.completedAt,
  });

  final String id;
  final Author author;
  final String text;
  final CommitmentStatus status;
  final DateTime dueDate;
  final DateTime? completedAt;

  factory Commitment.fromRow(Map<String, dynamic> r, Author author) => Commitment(
    id: r['id'] as String,
    author: author,
    text: r['commitment_text'] as String,
    status: CommitmentStatus.values.byName(r['status'] as String),
    dueDate: _date(r['due_date']),
    completedAt: _dateOrNull(r['completed_at']),
  );
}

class Reflection {
  const Reflection({required this.id, required this.author, required this.notes, this.hardQuestion, required this.date});
  final String id;
  final Author author;
  final String notes;
  final String? hardQuestion;
  final DateTime date;
}

class GroupDetail {
  const GroupDetail({
    required this.summary,
    required this.commitments,
    required this.reflections,
    required this.joinRequests,
    this.rhythmDay,
    this.rhythmTime,
  });

  final GroupSummary summary;
  final List<Commitment> commitments;

  /// Most recent first.
  final List<Reflection> reflections;

  /// Pending requests; only the group's owner can see them.
  final List<JoinRequest> joinRequests;
  final String? rhythmDay;
  final String? rhythmTime;
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    this.message,
    this.link,
    this.referenceId,
    required this.isRead,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String? message;
  final String? link;
  final String? referenceId;
  final bool isRead;
  final DateTime createdAt;

  factory AppNotification.fromRow(Map<String, dynamic> r) => AppNotification(
    id: r['id'] as String,
    type: r['type'] as String,
    title: r['title'] as String,
    message: r['message'] as String?,
    link: r['link'] as String?,
    referenceId: r['reference_id'] as String?,
    isRead: r['is_read'] as bool? ?? false,
    createdAt: _date(r['created_at']),
  );
}

/// A community meeting an admin scheduled on the web, with its Zoom link.
class Meeting {
  const Meeting({required this.id, required this.title, this.description, required this.zoomLink, required this.startsAt});

  factory Meeting.fromRow(Map<String, dynamic> r) => Meeting(
    id: r['id'] as String,
    title: r['title'] as String,
    description: r['description'] as String?,
    zoomLink: r['zoom_link'] as String,
    startsAt: _date(r['meeting_date']),
  );

  final String id;
  final String title;
  final String? description;
  final String zoomLink;
  final DateTime startsAt;

  /// Meetings have no end time, so "live" runs from shortly before the start until an hour
  /// and a half after it.
  bool isLive(DateTime now) =>
      !now.isBefore(startsAt.subtract(const Duration(minutes: 15))) && now.isBefore(startsAt.add(const Duration(minutes: 90)));
}

class Resource {
  const Resource({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    this.url,
    required this.author,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String? description;
  final String category;
  final String? url;
  final Author author;
  final DateTime createdAt;
}

/// What a new member fills in on the sign-up form; the database trigger copies it to their profile.
class SignUpDetails {
  const SignUpDetails({
    required this.fullName,
    required this.email,
    required this.password,
    this.ciUpdates = true,
    this.bibleYear = true,
    this.skillShare = false,
    this.referral,
  });

  final String fullName;
  final String email;
  final String password;
  final bool ciUpdates;
  final bool bibleYear;
  final bool skillShare;
  final String? referral;
}
