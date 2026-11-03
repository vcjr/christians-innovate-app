import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../app/providers.dart';
import '../../app/reader_settings.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../domain/progress.dart';
import '../../domain/scripture.dart';
import '../../widgets/common.dart';
import '../../widgets/reader_chrome.dart';
import '../../widgets/scripture.dart';

/// One day of a reading plan: devotional, scripture, mark as read, and the day's discussion.
class DayScreen extends ConsumerWidget {
  const DayScreen({super.key, required this.dayId, required this.planId});
  final String dayId;
  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final palette = ref.watch(readerSettingsProvider).palette(MediaQuery.platformBrightnessOf(context));
    final days = ref.watch(planDaysProvider(planId));
    final plan = ref.watch(plansProvider).value?.where((p) => p.id == planId).firstOrNull;
    final dayNumber = days.value?.where((d) => d.id == dayId).firstOrNull?.dayNumber;

    return Theme(
      data: buildTheme(palette.dark ? Brightness.dark : Brightness.light),
      child: Builder(
        builder: (context) {
          return Scaffold(
            backgroundColor: palette.background,
            body: ReadingProgress(
              color: palette.verseNumber,
              child: CustomScrollView(
                slivers: [
                  // Slides away as you read down and back as soon as you scroll up.
                  SliverAppBar(
                    floating: true,
                    snap: true,
                    backgroundColor: palette.background,
                    foregroundColor: palette.text,
                    scrolledUnderElevation: 0,
                    title: Text(dayNumber == null ? '' : 'Day $dayNumber'),
                    actions: [
                      ReaderActions(color: palette.text),
                      const SizedBox(width: Tokens.space2),
                    ],
                  ),
                  SliverToBoxAdapter(
                    child: AsyncBody<List<PlanDay>>(
                      value: days,
                      onRetry: () => ref.invalidate(planDaysProvider(planId)),
                      loading: const SkeletonLines(padding: EdgeInsets.all(Tokens.space6)),
                      data: (days) {
                        final i = days.indexWhere((d) => d.id == dayId);
                        if (i < 0) return const EmptyState(icon: Icons.search_off_rounded, title: 'This day isn’t in your plan');
                        return _DayBody(
                          day: days[i],
                          planTitle: plan?.title,
                          previous: i > 0 ? days[i - 1] : null,
                          next: i < days.length - 1 ? days[i + 1] : null,
                          total: days.length,
                          palette: palette,
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _DayBody extends ConsumerWidget {
  const _DayBody({
    required this.day,
    required this.planTitle,
    required this.previous,
    required this.next,
    required this.total,
    required this.palette,
  });
  final PlanDay day;
  final String? planTitle;
  final PlanDay? previous;
  final PlanDay? next;
  final int total;
  final ReaderPalette palette;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final translation = ref.watch(translationProvider);
    final verses = ref.watch(readingProvider((reference: day.reference, translation: translation)));
    final muted = palette.text.withValues(alpha: 0.6);
    final multiPassage = parsePassages(day.reference).length > 1;

    return Padding(
      padding: const EdgeInsets.fromLTRB(Tokens.space6, Tokens.space2, Tokens.space6, Tokens.space8 * 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            [if (planTitle != null) planTitle!.toUpperCase(), 'DAY ${day.dayNumber} OF $total'].join(' · '),
            style: context.text.labelSmall?.copyWith(color: muted),
          ),
          const SizedBox(height: Tokens.space2),
          HeroText(
            day.reference,
            tag: dayTitleHeroTag(day.id),
            style: context.displayText(size: 34, color: palette.text),
          ),
          if (day.dateAssigned != null) ...[
            const SizedBox(height: Tokens.space1),
            Text(DateFormat('EEEE, MMMM d').format(day.dateAssigned!), style: context.text.bodySmall?.copyWith(color: muted)),
          ],
          if (day.devotional?.trim().isNotEmpty ?? false) ...[
            const SizedBox(height: Tokens.space5),
            Container(
              padding: const EdgeInsets.all(Tokens.space4),
              decoration: BoxDecoration(
                color: palette.verseNumber.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(Tokens.radiusM),
                border: Border(left: BorderSide(color: palette.verseNumber, width: 3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('DEVOTIONAL', style: context.text.labelSmall?.copyWith(color: palette.verseNumber)),
                  const SizedBox(height: Tokens.space2),
                  MarkdownBody(
                    data: day.devotional!,
                    styleSheet: MarkdownStyleSheet.fromTheme(context.theme).copyWith(
                      p: context.text.bodyLarge?.copyWith(color: palette.text, height: 1.6),
                      listBullet: context.text.bodyLarge?.copyWith(color: palette.text),
                      strong: TextStyle(fontWeight: FontWeight.w700, color: palette.text),
                      h1: context.text.titleLarge?.copyWith(color: palette.text),
                      h2: context.text.titleMedium?.copyWith(color: palette.text),
                      h3: context.text.titleSmall?.copyWith(color: palette.text),
                      blockquote: TextStyle(fontFamily: Tokens.serif, fontStyle: FontStyle.italic, color: palette.text),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: Tokens.space6),
          AsyncBody<List<Verse>>(
            value: verses,
            onRetry: () => ref.invalidate(readingProvider),
            loading: const SkeletonLines(lines: 14),
            data: (v) => v.isEmpty
                ? EmptyState(
                    icon: Icons.menu_book_outlined,
                    title: 'This passage isn’t available in $translation',
                    message: 'Try another translation with the button at the top.',
                  )
                : ScriptureView(verses: v, palette: palette, showFirstHeading: multiPassage || v.first.chapter != v.last.chapter),
          ),
          const SizedBox(height: Tokens.space8),
          _MarkRead(day: day, palette: palette),
          AnimatedSize(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
            alignment: Alignment.topCenter,
            child: day.completed && next != null
                ? Padding(
                    padding: const EdgeInsets.only(top: Tokens.space4),
                    child: FadeSlideIn(
                      child: _UpNext(day: next!, palette: palette),
                    ),
                  )
                : const SizedBox(width: double.infinity),
          ),
          const SizedBox(height: Tokens.space4),
          Row(
            children: [
              if (previous != null)
                Expanded(
                  child: _DayNav(label: 'Day ${previous!.dayNumber}', icon: Icons.arrow_back_rounded, day: previous!, color: palette.text),
                )
              else
                const Spacer(),
              const SizedBox(width: Tokens.space3),
              if (next != null)
                Expanded(
                  child: _DayNav(
                    label: 'Day ${next!.dayNumber}',
                    icon: Icons.arrow_forward_rounded,
                    day: next!,
                    color: palette.text,
                    trailing: true,
                  ),
                )
              else
                const Spacer(),
            ],
          ),
          const SizedBox(height: Tokens.space8),
          _Discussion(dayId: day.id, palette: palette),
        ],
      ),
    );
  }
}

/// Shared by the Today card and the day screen so the reference flies between them.
String dayTitleHeroTag(String dayId) => 'day-title-$dayId';

String _readLabel(DateTime at) {
  final now = DateTime.now();
  if (at.year == now.year && at.month == now.month && at.day == now.day) return 'Read today';
  return 'Read on ${DateFormat('EEE, MMM d').format(at)}';
}

class _MarkRead extends ConsumerStatefulWidget {
  const _MarkRead({required this.day, required this.palette});
  final PlanDay day;
  final ReaderPalette palette;

  @override
  ConsumerState<_MarkRead> createState() => _MarkReadState();
}

class _MarkReadState extends ConsumerState<_MarkRead> {
  bool _busy = false;
  int _bursts = 0;
  bool _milestone = false;

  Future<void> _set(bool complete) async {
    setState(() => _busy = true);
    final ok = await runAction(context, () => ref.read(backendProvider).setDayComplete(widget.day.id, complete));
    if (ok) {
      ref.invalidate(planDaysProvider(widget.day.planId));
      await ref.read(planDaysProvider(widget.day.planId).future);
    }
    if (!mounted) return;
    setState(() => _busy = false);
    if (!ok || !complete) return;
    final streak = ref.read(streakProvider);
    setState(() {
      _bursts++;
      _milestone = isStreakMilestone(streak);
    });
    if (_milestone) {
      HapticFeedback.heavyImpact();
      showToast(context, '$streak days in a row. Keep going!');
    }
  }

  @override
  Widget build(BuildContext context) {
    final done = widget.day.completed;
    final success = context.ci.success;
    final streak = ref.watch(streakProvider);
    return Stack(
      clipBehavior: Clip.none,
      children: [
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 280),
          switchInCurve: Curves.easeOutBack,
          transitionBuilder: (child, a) => FadeTransition(
            opacity: a,
            child: ScaleTransition(scale: Tween(begin: 0.92, end: 1.0).animate(a), child: child),
          ),
          layoutBuilder: (current, previous) => Stack(alignment: Alignment.center, children: [...previous, ?current]),
          child: done
              ? Container(
                  key: const ValueKey('done'),
                  padding: const EdgeInsets.fromLTRB(Tokens.space4, Tokens.space2, Tokens.space2, Tokens.space2),
                  decoration: BoxDecoration(color: success.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle_rounded, color: success),
                      const SizedBox(width: Tokens.space2),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_readLabel(widget.day.completedAt!), style: context.text.titleSmall?.copyWith(color: success)),
                            if (streak > 0)
                              Row(
                                children: [
                                  Icon(Icons.local_fire_department_rounded, size: 14, color: context.ci.accent),
                                  const SizedBox(width: 2),
                                  AnimatedCount(streak, style: context.text.labelMedium?.copyWith(color: widget.palette.text)),
                                  Text(
                                    '-day streak',
                                    style: context.text.labelMedium?.copyWith(color: widget.palette.text.withValues(alpha: 0.7)),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: _busy ? null : () => _set(false),
                        style: TextButton.styleFrom(foregroundColor: widget.palette.text.withValues(alpha: 0.7)),
                        child: const Text('Undo'),
                      ),
                    ],
                  ),
                )
              : HoldToConfirm(
                  key: const Key('mark-read'),
                  label: 'Hold to mark as read',
                  semanticLabel: 'Mark as read',
                  busy: _busy,
                  onConfirmed: () => _set(true),
                ),
        ),
        if (_bursts > 0)
          Positioned.fill(
            child: CelebrationBurst(key: ValueKey(_bursts), big: _milestone),
          ),
      ],
    );
  }
}

/// After a day is read: the next day, one tap away.
class _UpNext extends StatelessWidget {
  const _UpNext({required this.day, required this.palette});
  final PlanDay day;
  final ReaderPalette palette;

  @override
  Widget build(BuildContext context) {
    final accent = palette.verseNumber;
    return Material(
      color: accent.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(Tokens.radiusM),
      child: InkWell(
        key: const Key('up-next'),
        borderRadius: BorderRadius.circular(Tokens.radiusM),
        onTap: () => context.pushReplacement('/day/${day.id}?plan=${day.planId}'),
        child: Padding(
          padding: const EdgeInsets.all(Tokens.space4),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('UP NEXT · DAY ${day.dayNumber}', style: context.text.labelSmall?.copyWith(color: accent)),
                    const SizedBox(height: Tokens.space1),
                    Text(day.reference, style: context.displayText(size: 22, color: palette.text)),
                    if (day.dateAssigned != null)
                      Text(
                        DateFormat('EEEE, MMMM d').format(day.dateAssigned!),
                        style: context.text.bodySmall?.copyWith(color: palette.text.withValues(alpha: 0.6)),
                      ),
                  ],
                ),
              ),
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: accent, shape: BoxShape.circle),
                child: Icon(Icons.arrow_forward_rounded, color: palette.background),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DayNav extends StatelessWidget {
  const _DayNav({required this.label, required this.icon, required this.day, required this.color, this.trailing = false});
  final String label;
  final IconData icon;
  final PlanDay day;
  final Color color;
  final bool trailing;

  @override
  Widget build(BuildContext context) {
    final children = [
      Icon(icon, size: 18),
      const SizedBox(width: Tokens.space2),
      Flexible(
        child: Column(
          crossAxisAlignment: trailing ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(label, style: context.text.labelMedium?.copyWith(color: color)),
            Text(
              day.reference,
              style: context.text.bodySmall?.copyWith(color: color.withValues(alpha: 0.6)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    ];
    return OutlinedButton(
      onPressed: () => context.pushReplacement('/day/${day.id}?plan=${day.planId}'),
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(color: color.withValues(alpha: 0.2)),
        padding: const EdgeInsets.symmetric(horizontal: Tokens.space4, vertical: Tokens.space3),
        minimumSize: const Size(0, 60),
      ),
      child: Row(
        mainAxisAlignment: trailing ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: trailing ? children.reversed.toList() : children,
      ),
    );
  }
}

class _Discussion extends ConsumerWidget {
  const _Discussion({required this.dayId, required this.palette});
  final String dayId;
  final ReaderPalette palette;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final comments = ref.watch(dayCommentsProvider(dayId));
    final me = ref.watch(userIdProvider).value;
    final count = comments.value?.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          count == null || count == 0 ? 'Discussion' : 'Discussion · $count',
          style: context.text.titleLarge?.copyWith(color: palette.text),
        ),
        const SizedBox(height: Tokens.space1),
        Text('What stood out to you today?', style: context.text.bodyMedium?.copyWith(color: palette.text.withValues(alpha: 0.6))),
        const SizedBox(height: Tokens.space4),
        Composer(
          hint: 'Share a thought',
          onSend: (text) async {
            final ok = await runAction(context, () => ref.read(backendProvider).addDayComment(dayId, text));
            if (ok) ref.invalidate(dayCommentsProvider(dayId));
            return ok;
          },
        ),
        const SizedBox(height: Tokens.space4),
        AsyncBody<List<Comment>>(
          value: comments,
          onRetry: () => ref.invalidate(dayCommentsProvider(dayId)),
          data: (list) => Column(
            children: [
              for (final c in list.reversed)
                CommentTile(
                  comment: c,
                  textColor: palette.text,
                  onDelete: c.author.userId != me
                      ? null
                      : () async {
                          if (!await confirm(context, title: 'Delete this comment?', action: 'Delete', destructive: true)) return;
                          if (!context.mounted) return;
                          final ok = await runAction(context, () => ref.read(backendProvider).deleteDayComment(c.id));
                          if (ok) ref.invalidate(dayCommentsProvider(dayId));
                        },
                ),
            ],
          ),
        ),
      ],
    );
  }
}
