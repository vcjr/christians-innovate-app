import 'models.dart';

DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);

/// The day to put on Today: the one pinned to today's date if there is one, otherwise
/// the first day not yet read, otherwise the last day of the plan.
PlanDay? todaysReading(List<PlanDay> days, DateTime now) {
  if (days.isEmpty) return null;
  final today = _day(now);
  for (final d in days) {
    final a = d.dateAssigned;
    if (a != null && a.year == today.year && a.month == today.month && a.day == today.day) return d;
  }
  for (final d in days) {
    if (!d.completed) return d;
  }
  return days.last;
}

/// Consecutive calendar days, ending today or yesterday, with at least one reading marked done.
int readingStreak(Iterable<DateTime> completedAt, DateTime now) {
  final days = {for (final c in completedAt) _day(c)};
  var cursor = _day(now);
  // By calendar date, not 24 hours: across a daylight-saving change those differ.
  if (!days.contains(cursor)) cursor = DateTime(cursor.year, cursor.month, cursor.day - 1);
  var streak = 0;
  while (days.contains(cursor)) {
    streak++;
    cursor = DateTime(cursor.year, cursor.month, cursor.day - 1);
  }
  return streak;
}

/// The seven days of the week that contains [now], Sunday first.
List<DateTime> weekOf(DateTime now) {
  final start = DateTime(now.year, now.month, now.day - now.weekday % 7);
  return [for (var i = 0; i < 7; i++) DateTime(start.year, start.month, start.day + i)];
}

/// The calendar days (at midnight) on which at least one reading was marked done.
Set<DateTime> readingDays(Iterable<DateTime> completedAt) => {for (final c in completedAt) _day(c)};

/// Streak lengths worth a bigger celebration.
bool isStreakMilestone(int days) => const {3, 7, 14, 21, 30, 50, 100, 200, 365}.contains(days) || (days > 365 && days % 100 == 0);

/// The default commitment deadline, as on the web: the end of this coming Sunday
/// (the end of today when today is Sunday).
DateTime defaultCommitmentDue(DateTime now) {
  final daysUntilSunday = (DateTime.sunday - now.weekday) % 7;
  return DateTime(now.year, now.month, now.day + daysUntilSunday, 23, 59, 59, 999);
}

String greetingFor(DateTime now, String? firstName) {
  final h = now.hour;
  final part = h < 5 ? 'Peace to you' : (h < 12 ? 'Good morning' : (h < 17 ? 'Good afternoon' : 'Good evening'));
  final name = firstName?.trim();
  return name == null || name.isEmpty ? part : '$part, $name';
}

/// "Just now", "5m", "3h", "2d", then a short date.
String timeAgo(DateTime then, DateTime now) {
  final d = now.difference(then);
  if (d.inMinutes < 1) return 'Just now';
  if (d.inHours < 1) return '${d.inMinutes}m';
  if (d.inDays < 1) return '${d.inHours}h';
  if (d.inDays < 7) return '${d.inDays}d';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final s = '${months[then.month - 1]} ${then.day}';
  return then.year == now.year ? s : '$s, ${then.year}';
}

/// Up to two initials for an avatar placeholder.
String initialsOf(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
  if (parts.isEmpty) return '?';
  if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
  return (parts.first.substring(0, 1) + parts.last.substring(0, 1)).toUpperCase();
}
