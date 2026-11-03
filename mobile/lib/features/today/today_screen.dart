import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../domain/progress.dart';
import '../../widgets/common.dart';
import '../community/post_card.dart';
import '../plan/day_screen.dart' show dayTitleHeroTag;

class TodayScreen extends ConsumerWidget {
  const TodayScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(subscribedPlanIdsProvider);
    ref.invalidate(planDaysProvider);
    ref.invalidate(postsProvider);
    ref.invalidate(myGroupsProvider);
    ref.invalidate(notificationsProvider);
    await ref.read(activePlanProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final now = DateTime.now();
    final profile = ref.watch(profileProvider).value;
    final plan = ref.watch(activePlanProvider);
    final unread = ref.watch(unreadCountProvider);
    // Keeps the coming week's readings on the device, for reading offline.
    ref.watch(upcomingReadingsProvider);
    final planId = plan.value?.id;
    final days = planId == null ? null : ref.watch(planDaysProvider(planId)).value;
    final progress = days == null || days.isEmpty ? null : days.where((d) => d.completed).length / days.length;
    final avatar = Avatar(name: profile?.displayName ?? '', url: profile?.avatarUrl, size: progress == null ? 34 : 30);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: GlobeRefresh(
          onRefresh: () => _refresh(ref),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(Tokens.space5, Tokens.space3, Tokens.space5, Tokens.space8),
            children: [
              Row(
                children: [
                  Expanded(child: Text(DateFormat('EEEE, MMMM d').format(now).toUpperCase(), style: context.text.labelSmall)),
                  IconButton(
                    tooltip: 'Notifications',
                    onPressed: () => context.push('/notifications'),
                    icon: Badge(isLabelVisible: unread > 0, label: Text('$unread'), child: const Icon(Icons.notifications_none_rounded)),
                  ),
                  // The ring around your photo is how far through the plan you are.
                  GestureDetector(
                    onTap: () => context.go('/me'),
                    child: progress == null ? avatar : ProgressRing(value: progress, size: 40, color: context.ci.accent, child: avatar),
                  ),
                ],
              ),
              const SizedBox(height: Tokens.space2),
              FadeSlideIn(child: Text(greetingFor(now, profile?.firstName), style: context.displayText(size: 30))),
              const SizedBox(height: Tokens.space5),
              FadeSlideIn(
                index: 1,
                child: AsyncBody<ReadingPlan?>(
                  value: plan,
                  onRetry: () => _refresh(ref),
                  loading: const _TodaySkeleton(),
                  data: (p) => p == null ? const _NoPlanCard() : _PlanSection(plan: p),
                ),
              ),
              const FadeSlideIn(index: 2, child: _PrayerPreview()),
              const FadeSlideIn(index: 3, child: _GroupPreview()),
            ],
          ),
        ),
      ),
    );
  }
}

class _NoPlanCard extends StatelessWidget {
  const _NoPlanCard();

  @override
  Widget build(BuildContext context) {
    return _HeroCard(
      eyebrow: 'GET STARTED',
      title: 'Choose a reading plan',
      body: 'A few minutes in Scripture each day, read alongside the whole community.',
      action: FilledButton(
        onPressed: () => context.push('/plans'),
        style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Tokens.blueDeep),
        child: const Text('Browse plans'),
      ),
    );
  }
}

class _PlanSection extends ConsumerWidget {
  const _PlanSection({required this.plan});
  final ReadingPlan plan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final days = ref.watch(planDaysProvider(plan.id));
    return AsyncBody<List<PlanDay>>(
      value: days,
      onRetry: () => ref.invalidate(planDaysProvider(plan.id)),
      loading: const _TodaySkeleton(),
      data: (days) {
        final today = todaysReading(days, DateTime.now());
        if (today == null) {
          return _HeroCard(
            eyebrow: plan.title.toUpperCase(),
            title: 'No readings yet',
            body: 'This plan’s days haven’t been added yet. Check back soon.',
          );
        }
        final done = days.where((d) => d.completed).length;
        final streak = ref.watch(streakProvider);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _TodayCard(plan: plan, day: today),
            const SizedBox(height: Tokens.space3),
            _WeekStrip(
              streak: streak,
              read: readingDays([for (final d in days) ?d.completedAt]),
              done: done,
              total: days.length,
              onTap: () => context.push('/plan'),
            ),
          ],
        );
      },
    );
  }
}

/// Placeholder in the shape of the Today card and week strip.
class _TodaySkeleton extends StatelessWidget {
  const _TodaySkeleton();

  @override
  Widget build(BuildContext context) {
    return const Shimmer(
      child: Column(
        children: [
          SkeletonBox(height: 250, radius: Tokens.radiusL),
          SizedBox(height: Tokens.space3),
          SkeletonBox(height: 120, radius: Tokens.radiusM),
        ],
      ),
    );
  }
}

/// The streak, this week as seven days, and how far through the plan you are.
class _WeekStrip extends StatelessWidget {
  const _WeekStrip({required this.streak, required this.read, required this.done, required this.total, required this.onTap});
  final int streak;
  final Set<DateTime> read;
  final int done;
  final int total;
  final VoidCallback onTap;

  static const _letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return Panel(
      onTap: onTap,
      padding: const EdgeInsets.fromLTRB(Tokens.space4, Tokens.space4, Tokens.space4, Tokens.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Icon(Icons.local_fire_department_rounded, color: context.ci.accent, size: 26),
              const SizedBox(width: Tokens.space1),
              AnimatedCount(streak, style: context.text.headlineSmall),
              const SizedBox(width: Tokens.space2),
              Expanded(child: Text('day streak', style: context.text.bodySmall)),
              Icon(Icons.chevron_right_rounded, color: context.ci.muted, size: 20),
            ],
          ),
          const SizedBox(height: Tokens.space3),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              for (final d in weekOf(now))
                _DayDot(letter: _letters[d.weekday % 7], read: read.contains(d), today: d == today, future: d.isAfter(today)),
            ],
          ),
          const SizedBox(height: Tokens.space3),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(end: total == 0 ? 0 : done / total),
                    duration: const Duration(milliseconds: 900),
                    curve: Curves.easeOutCubic,
                    builder: (_, v, _) => LinearProgressIndicator(value: v, minHeight: 4),
                  ),
                ),
              ),
              const SizedBox(width: Tokens.space3),
              Text('$done/$total', style: context.text.labelMedium),
              Text(' days read', style: context.text.bodySmall),
            ],
          ),
        ],
      ),
    );
  }
}

class _DayDot extends StatefulWidget {
  const _DayDot({required this.letter, required this.read, required this.today, required this.future});
  final String letter;
  final bool read;
  final bool today;
  final bool future;

  @override
  State<_DayDot> createState() => _DayDotState();
}

class _DayDotState extends State<_DayDot> with SingleTickerProviderStateMixin {
  late final _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));

  @override
  void initState() {
    super.initState();
    _syncPulse();
  }

  @override
  void didUpdateWidget(_DayDot old) {
    super.didUpdateWidget(old);
    _syncPulse();
  }

  /// Today's dot breathes a few times until it's read, then settles.
  void _syncPulse() {
    if (widget.today && !widget.read) {
      if (!_pulse.isAnimating) _pulse.repeat(reverse: true, count: 6);
    } else {
      _pulse.value = 0;
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final accent = context.ci.accent;
    final primary = context.colors.primary;
    return Column(
      children: [
        Text(widget.letter, style: context.text.labelSmall?.copyWith(color: widget.today ? context.colors.onSurface : null)),
        const SizedBox(height: Tokens.space2),
        AnimatedBuilder(
          animation: _pulse,
          builder: (_, child) => Transform.scale(scale: 1 + 0.08 * Curves.easeInOut.transform(_pulse.value), child: child),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOutBack,
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.read ? accent : (widget.future ? Colors.transparent : context.ci.sunken),
              border: widget.read ? null : Border.all(color: widget.today ? primary : context.ci.line, width: widget.today ? 2 : 1),
            ),
            child: widget.read ? const Icon(Icons.check_rounded, size: 18, color: Colors.white) : null,
          ),
        ),
      ],
    );
  }
}

class _TodayCard extends ConsumerWidget {
  const _TodayCard({required this.plan, required this.day});
  final ReadingPlan plan;
  final PlanDay day;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final verses = ref.watch(readingProvider((reference: day.reference, translation: ref.watch(translationProvider)))).value;
    final preview = verses == null || verses.isEmpty ? null : verses.first.text;
    return _HeroCard(
      eyebrow: 'DAY ${day.dayNumber} · ${plan.title.toUpperCase()}',
      title: day.reference,
      titleHeroTag: dayTitleHeroTag(day.id),
      body: preview == null ? null : '“$preview”',
      serifBody: true,
      onTap: () => context.push('/day/${day.id}?plan=${plan.id}'),
      action: day.completed
          ? Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Color(0xFF8FE3B4), size: 22),
                const SizedBox(width: Tokens.space2),
                Expanded(
                  child: Text('Done for today', style: context.text.titleSmall?.copyWith(color: Colors.white)),
                ),
                TextButton(
                  onPressed: () => context.push('/day/${day.id}?plan=${plan.id}'),
                  style: TextButton.styleFrom(foregroundColor: Colors.white),
                  child: const Text('Read again'),
                ),
              ],
            )
          : FilledButton.icon(
              key: const Key('start-reading'),
              onPressed: () => context.push('/day/${day.id}?plan=${plan.id}'),
              style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Tokens.blueDeep),
              icon: const Icon(Icons.play_arrow_rounded),
              label: const Text('Start reading'),
            ),
    );
  }
}

class _HeroCard extends StatefulWidget {
  const _HeroCard({
    required this.eyebrow,
    required this.title,
    this.titleHeroTag,
    this.body,
    this.action,
    this.onTap,
    this.serifBody = false,
  });
  final String eyebrow;
  final String title;
  final Object? titleHeroTag;
  final String? body;
  final Widget? action;
  final VoidCallback? onTap;
  final bool serifBody;

  @override
  State<_HeroCard> createState() => _HeroCardState();
}

class _HeroCardState extends State<_HeroCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final on = context.ci.onHero;
    final w = widget;
    final titleStyle = context.displayText(size: 30, color: on);
    return AnimatedScale(
      scale: _pressed ? 0.985 : 1,
      duration: const Duration(milliseconds: 160),
      curve: Curves.easeOutCubic,
      child: Material(
        color: context.ci.hero,
        borderRadius: BorderRadius.circular(Tokens.radiusL),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: w.onTap,
          onHighlightChanged: w.onTap == null ? null : (v) => setState(() => _pressed = v),
          child: Stack(
            children: [
              Positioned(
                right: -40,
                top: -30,
                child: Opacity(
                  opacity: 0.12,
                  child: Image.asset('assets/images/globe.png', width: 200, color: Colors.white, colorBlendMode: BlendMode.srcIn),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(Tokens.space5),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      w.eyebrow,
                      style: context.text.labelSmall?.copyWith(color: on.withValues(alpha: 0.7)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: Tokens.space3),
                    if (w.titleHeroTag != null)
                      HeroText(w.title, tag: w.titleHeroTag!, style: titleStyle)
                    else
                      Text(w.title, style: titleStyle),
                    if (w.body != null) ...[
                      const SizedBox(height: Tokens.space3),
                      Text(
                        w.body!,
                        maxLines: 4,
                        overflow: TextOverflow.ellipsis,
                        style: w.serifBody
                            ? TextStyle(
                                fontFamily: Tokens.serif,
                                fontStyle: FontStyle.italic,
                                fontSize: 16,
                                height: 1.55,
                                color: on.withValues(alpha: 0.88),
                              )
                            : context.text.bodyMedium?.copyWith(color: on.withValues(alpha: 0.85)),
                      ),
                    ],
                    if (w.action != null) ...[const SizedBox(height: Tokens.space5), w.action!],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PrayerPreview extends ConsumerWidget {
  const _PrayerPreview();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(userIdProvider).value;
    final posts = (ref.watch(postsProvider).value ?? const []).where((p) => p.author.userId != me).take(2).toList();
    if (posts.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionLabel('Pray with the community', action: 'See all', onAction: () => context.go('/community')),
        for (final p in posts)
          Padding(
            padding: const EdgeInsets.only(bottom: Tokens.space3),
            child: PostCard(post: p, compact: true),
          ),
      ],
    );
  }
}

class _GroupPreview extends ConsumerWidget {
  const _GroupPreview();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groups = ref.watch(myGroupsProvider).value;
    if (groups == null) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionLabel('Accountability'),
        if (groups.isEmpty)
          Panel(
            onTap: () => context.push('/groups/discover'),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(color: context.colors.secondaryContainer, borderRadius: BorderRadius.circular(Tokens.radiusS)),
                  child: Icon(Icons.handshake_outlined, color: context.colors.onSecondaryContainer),
                ),
                const SizedBox(width: Tokens.space3),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Find a group', style: context.text.titleSmall),
                      Text('Set weekly commitments with people who’ll ask how it went.', style: context.text.bodySmall),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, color: context.ci.muted),
              ],
            ),
          )
        else
          for (final g in groups.take(2))
            Padding(
              padding: const EdgeInsets.only(bottom: Tokens.space3),
              child: Panel(
                onTap: () => context.push('/group/${g.id}'),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(g.name, style: context.text.titleSmall),
                          const SizedBox(height: 2),
                          Text(g.objective, style: context.text.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: Tokens.space2),
                          AvatarStack(names: g.previewNames, avatars: g.previewAvatars, total: g.memberCount, size: 24),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded, color: context.ci.muted),
                  ],
                ),
              ),
            ),
      ],
    );
  }
}
