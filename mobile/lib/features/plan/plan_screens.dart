import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../domain/progress.dart';
import '../../widgets/common.dart';

/// The active plan: progress, and every day with its read state.
class PlanScreen extends ConsumerWidget {
  const PlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plan = ref.watch(activePlanProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reading plan'),
        actions: [
          TextButton(onPressed: () => context.push('/plans'), child: const Text('All plans')),
          const SizedBox(width: Tokens.space2),
        ],
      ),
      body: AsyncBody<ReadingPlan?>(
        value: plan,
        onRetry: () => ref.invalidate(subscribedPlanIdsProvider),
        data: (p) => p == null
            ? EmptyState(
                icon: Icons.auto_stories_outlined,
                title: 'You’re not following a plan',
                action: FilledButton(onPressed: () => context.push('/plans'), child: const Text('Browse plans')),
              )
            : _PlanDays(plan: p),
      ),
    );
  }
}

class _PlanDays extends ConsumerWidget {
  const _PlanDays({required this.plan});
  final ReadingPlan plan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncBody<List<PlanDay>>(
      value: ref.watch(planDaysProvider(plan.id)),
      onRetry: () => ref.invalidate(planDaysProvider(plan.id)),
      data: (days) {
        final done = days.where((d) => d.completed).length;
        final today = todaysReading(days, DateTime.now());
        return CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(Tokens.space5, Tokens.space2, Tokens.space5, Tokens.space4),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(plan.title, style: context.displayText(size: 30)),
                    if (plan.description?.isNotEmpty ?? false) ...[
                      const SizedBox(height: Tokens.space2),
                      Text(plan.description!, style: context.text.bodyMedium?.copyWith(color: context.ci.muted)),
                    ],
                    const SizedBox(height: Tokens.space5),
                    Row(
                      children: [
                        SizedBox(
                          width: 64,
                          height: 64,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              CircularProgressIndicator(
                                value: days.isEmpty ? 0 : done / days.length,
                                strokeWidth: 6,
                                strokeCap: StrokeCap.round,
                              ),
                              Center(
                                child: Text(
                                  days.isEmpty ? '0%' : '${(done * 100 / days.length).round()}%',
                                  style: context.text.labelMedium,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: Tokens.space4),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('$done of ${days.length} days read', style: context.text.titleMedium),
                              Text('${ref.watch(streakProvider)}-day streak', style: context.text.bodySmall),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            SliverList.separated(
              itemCount: days.length,
              separatorBuilder: (_, _) => const Divider(indent: 72),
              itemBuilder: (context, i) {
                final d = days[i];
                final isToday = d.id == today?.id;
                return ListTile(
                  onTap: () => context.push('/day/${d.id}?plan=${plan.id}'),
                  tileColor: isToday ? context.colors.primaryContainer.withValues(alpha: 0.5) : null,
                  leading: _DayBadge(number: d.dayNumber, done: d.completed),
                  title: Text(d.reference),
                  subtitle: Text(
                    [if (isToday) 'Today', if (d.dateAssigned != null) DateFormat('EEE, MMM d').format(d.dateAssigned!)].join(' · '),
                  ),
                  trailing: Icon(Icons.chevron_right_rounded, color: context.ci.muted),
                );
              },
            ),
            const SliverToBoxAdapter(child: SizedBox(height: Tokens.space8)),
          ],
        );
      },
    );
  }
}

class _DayBadge extends StatelessWidget {
  const _DayBadge({required this.number, required this.done});
  final int number;
  final bool done;

  @override
  Widget build(BuildContext context) {
    final success = context.ci.success;
    return Container(
      width: 40,
      height: 40,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: done ? success : Colors.transparent,
        border: done ? null : Border.all(color: context.colors.outline, width: 1.5),
      ),
      child: done
          ? const Icon(Icons.check_rounded, color: Colors.white, size: 20)
          : Text('$number', style: context.text.labelMedium?.copyWith(color: context.ci.muted)),
    );
  }
}

/// Every plan, to start one or switch.
class PlansScreen extends ConsumerWidget {
  const PlansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plans = ref.watch(plansProvider);
    final following = ref.watch(subscribedPlanIdsProvider).value ?? const [];
    return Scaffold(
      appBar: AppBar(title: const Text('Reading plans')),
      body: AsyncBody<List<ReadingPlan>>(
        value: plans,
        onRetry: () => ref.invalidate(plansProvider),
        data: (plans) => plans.isEmpty
            ? const EmptyState(icon: Icons.auto_stories_outlined, title: 'No plans yet', message: 'New reading plans will show up here.')
            : ListView.separated(
                padding: const EdgeInsets.all(Tokens.space5),
                itemCount: plans.length,
                separatorBuilder: (_, _) => const SizedBox(height: Tokens.space3),
                itemBuilder: (context, i) => _PlanCard(plan: plans[i], following: following.contains(plans[i].id)),
              ),
      ),
    );
  }
}

class _PlanCard extends ConsumerStatefulWidget {
  const _PlanCard({required this.plan, required this.following});
  final ReadingPlan plan;
  final bool following;

  @override
  ConsumerState<_PlanCard> createState() => _PlanCardState();
}

class _PlanCardState extends ConsumerState<_PlanCard> {
  bool _busy = false;

  /// Today follows one plan, so starting a plan stops following the others.
  Future<void> _toggle() async {
    final backend = ref.read(backendProvider);
    final others = (ref.read(subscribedPlanIdsProvider).value ?? const []).where((id) => id != widget.plan.id).toList();
    final proceed = widget.following
        ? await confirm(
            context,
            title: 'Stop following this plan?',
            message: 'Your progress is kept if you come back to it.',
            action: 'Stop following',
          )
        : others.isEmpty ||
              await confirm(
                context,
                title: 'Switch to this plan?',
                message: 'You’ll stop following your current plan. Your progress there is kept.',
                action: 'Switch',
              );
    if (!proceed || !mounted) return;
    setState(() => _busy = true);
    final ok = await runAction(context, () async {
      if (widget.following) return backend.unsubscribe(widget.plan.id);
      // Start the new plan before stopping the old ones, so a failure never leaves no plan at all.
      await backend.subscribe(widget.plan.id);
      for (final id in others) {
        await backend.unsubscribe(id);
      }
    }, done: widget.following ? 'You’ve stopped following ${widget.plan.title}' : 'You’re following ${widget.plan.title}');
    // Refresh even after a failure: part of the switch may have gone through.
    ref.invalidate(subscribedPlanIdsProvider);
    if (mounted) setState(() => _busy = false);
    if (ok && !widget.following && mounted) context.go('/today');
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.plan;
    return Panel(
      padding: const EdgeInsets.all(Tokens.space5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (p.isDefault) Pill('Community plan', color: context.ci.accent, icon: Icons.star_rounded),
              if (p.isDefault && p.dayCount != null) const SizedBox(width: Tokens.space2),
              if (p.dayCount != null) Pill('${p.dayCount} days', color: context.ci.muted),
            ],
          ),
          if (p.isDefault || p.dayCount != null) const SizedBox(height: Tokens.space3),
          Text(p.title, style: context.displayText(size: 22)),
          if (p.description?.isNotEmpty ?? false) ...[
            const SizedBox(height: Tokens.space2),
            Text(p.description!, style: context.text.bodyMedium?.copyWith(color: context.ci.muted)),
          ],
          const SizedBox(height: Tokens.space4),
          widget.following
              ? OutlinedButton.icon(
                  onPressed: _busy ? null : _toggle,
                  icon: const Icon(Icons.check_rounded, size: 18),
                  label: const Text('Following'),
                )
              : FilledButton(onPressed: _busy ? null : _toggle, child: const Text('Start this plan')),
        ],
      ),
    );
  }
}
