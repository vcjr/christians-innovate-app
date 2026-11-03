import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../domain/progress.dart';
import '../../widgets/common.dart';

/// One group: this week's commitments, reflections, and (for the leader) join requests.
class GroupScreen extends ConsumerWidget {
  const GroupScreen({super.key, required this.groupId});
  final String groupId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final group = ref.watch(groupProvider(groupId));
    final me = ref.watch(userIdProvider).value;
    return Scaffold(
      appBar: AppBar(),
      floatingActionButton: group.hasValue
          ? FloatingActionButton.extended(
              onPressed: () => _addCommitment(context, ref, groupId),
              icon: const Icon(Icons.add_task_rounded),
              label: const Text('Commit'),
            )
          : null,
      body: GlobeRefresh(
        onRefresh: () => ref.refresh(groupProvider(groupId).future),
        child: AsyncBody<GroupDetail>(
          value: group,
          onRetry: () => ref.invalidate(groupProvider(groupId)),
          data: (g) {
            // Open commitments first, soonest due first; finished ones sink to the bottom.
            final mine = g.commitments.where((c) => c.author.userId == me).toList()
              ..sort((a, b) {
                final open = (a.status == CommitmentStatus.active ? 0 : 1) - (b.status == CommitmentStatus.active ? 0 : 1);
                return open != 0 ? open : a.dueDate.compareTo(b.dueDate);
              });
            final others = g.commitments.where((c) => c.author.userId != me && c.status == CommitmentStatus.active).toList();
            final today = DateTime.now().toUtc();
            final myReflection = g.reflections
                .where((r) => r.author.userId == me && r.date.year == today.year && r.date.month == today.month && r.date.day == today.day)
                .firstOrNull;
            return ListView(
              padding: const EdgeInsets.fromLTRB(Tokens.space5, 0, Tokens.space5, 120),
              children: [
                Text(g.summary.name, style: context.displayText(size: 30)),
                const SizedBox(height: Tokens.space2),
                Text(g.summary.objective, style: context.text.bodyLarge?.copyWith(color: context.ci.muted)),
                const SizedBox(height: Tokens.space4),
                Wrap(
                  spacing: Tokens.space4,
                  runSpacing: Tokens.space2,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    AvatarStack(names: g.summary.previewNames, avatars: g.summary.previewAvatars, total: g.summary.memberCount),
                    if (g.rhythmDay != null)
                      Pill(
                        'Meets ${g.rhythmDay}s${g.rhythmTime == null ? '' : ' · ${g.rhythmTime}'}',
                        color: context.ci.muted,
                        icon: Icons.event_repeat_rounded,
                      ),
                  ],
                ),
                if (g.joinRequests.isNotEmpty) ...[
                  const SectionLabel('Asking to join'),
                  for (final r in g.joinRequests) _JoinRequestTile(request: r, groupId: groupId),
                ],
                const SectionLabel('Your commitments'),
                if (mine.isEmpty)
                  Panel(
                    onTap: () => _addCommitment(context, ref, groupId),
                    child: Row(
                      children: [
                        Icon(Icons.flag_outlined, color: context.colors.primary),
                        const SizedBox(width: Tokens.space3),
                        Expanded(child: Text('What will you get done this week?', style: context.text.bodyMedium)),
                        Icon(Icons.add_rounded, color: context.ci.muted),
                      ],
                    ),
                  )
                else
                  Card(
                    child: Column(
                      children: [
                        for (var i = 0; i < mine.length; i++) ...[
                          if (i > 0) const Divider(indent: 56),
                          _MyCommitment(commitment: mine[i], groupId: groupId),
                        ],
                      ],
                    ),
                  ),
                if (others.isNotEmpty) ...[
                  const SectionLabel('The group is working on'),
                  Card(
                    child: Column(
                      children: [
                        for (var i = 0; i < others.length; i++) ...[
                          if (i > 0) const Divider(indent: 64),
                          ListTile(
                            leading: Avatar(name: others[i].author.displayName, url: others[i].author.avatarUrl, size: 36),
                            title: Text(others[i].text),
                            subtitle: Text('${others[i].author.displayName} · due ${DateFormat('EEE, MMM d').format(others[i].dueDate)}'),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
                const SectionLabel('Reflection'),
                _ReflectionCard(groupId: groupId, mine: myReflection),
                for (final r in g.reflections.where((r) => r != myReflection).take(10))
                  Padding(
                    padding: const EdgeInsets.only(top: Tokens.space3),
                    child: Panel(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Avatar(name: r.author.displayName, url: r.author.avatarUrl, size: 28),
                              const SizedBox(width: Tokens.space2),
                              Expanded(child: Text(r.author.displayName, style: context.text.titleSmall)),
                              Text(DateFormat('MMM d').format(r.date), style: context.text.bodySmall),
                            ],
                          ),
                          const SizedBox(height: Tokens.space2),
                          Text(r.notes, style: context.text.bodyMedium),
                          if (r.hardQuestion?.isNotEmpty ?? false) ...[
                            const SizedBox(height: Tokens.space2),
                            Text('Hardest part: ${r.hardQuestion}', style: context.text.bodySmall),
                          ],
                        ],
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

Future<void> _addCommitment(BuildContext context, WidgetRef ref, String groupId) async {
  final added = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => _CommitmentSheet(groupId: groupId),
  );
  if (added == true) ref.invalidate(groupProvider(groupId));
}

class _CommitmentSheet extends ConsumerStatefulWidget {
  const _CommitmentSheet({required this.groupId});
  final String groupId;
  @override
  ConsumerState<_CommitmentSheet> createState() => _CommitmentSheetState();
}

class _CommitmentSheetState extends ConsumerState<_CommitmentSheet> {
  final _text = TextEditingController();
  DateTime _due = defaultCommitmentDue(DateTime.now());
  bool _busy = false;

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_text.text.trim().isEmpty) return;
    setState(() => _busy = true);
    final ok = await runAction(context, () => ref.read(backendProvider).addCommitment(widget.groupId, _text.text, _due));
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(Tokens.space5, 0, Tokens.space5, MediaQuery.viewInsetsOf(context).bottom + Tokens.space5),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('New commitment', style: context.text.titleLarge),
          const SizedBox(height: Tokens.space4),
          TextField(
            controller: _text,
            autofocus: true,
            minLines: 1,
            maxLines: 3,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(hintText: 'e.g. Call three potential customers'),
            onSubmitted: (_) => _save(),
          ),
          const SizedBox(height: Tokens.space3),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.event_rounded),
            title: const Text('Due'),
            trailing: Text(DateFormat('EEE, MMM d').format(_due), style: context.text.titleSmall),
            onTap: () async {
              final now = DateTime.now();
              final d = await showDatePicker(
                context: context,
                initialDate: _due,
                firstDate: now,
                lastDate: now.add(const Duration(days: 365)),
              );
              if (d != null) setState(() => _due = DateTime(d.year, d.month, d.day, 23, 59, 59));
            },
          ),
          const SizedBox(height: Tokens.space4),
          FilledButton(onPressed: _busy ? null : _save, child: const Text('Add commitment')),
        ],
      ),
    );
  }
}

class _MyCommitment extends ConsumerWidget {
  const _MyCommitment({required this.commitment, required this.groupId});
  final Commitment commitment;
  final String groupId;

  Future<void> _set(BuildContext context, WidgetRef ref, CommitmentStatus s) async {
    if (s == CommitmentStatus.completed) HapticFeedback.mediumImpact();
    final ok = await runAction(context, () => ref.read(backendProvider).setCommitmentStatus(commitment.id, s));
    if (ok) ref.invalidate(groupProvider(groupId));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = commitment;
    final done = c.status == CommitmentStatus.completed;
    final sacrificed = c.status == CommitmentStatus.sacrificed;
    final overdue = c.status == CommitmentStatus.active && c.dueDate.isBefore(DateTime.now());
    return ListTile(
      leading: Checkbox(
        value: done,
        shape: const CircleBorder(),
        onChanged: sacrificed ? null : (v) => _set(context, ref, v == true ? CommitmentStatus.completed : CommitmentStatus.active),
      ),
      title: Text(
        c.text,
        style: TextStyle(
          decoration: done || sacrificed ? TextDecoration.lineThrough : null,
          color: done || sacrificed ? context.ci.muted : null,
        ),
      ),
      subtitle: Text(switch (c.status) {
        CommitmentStatus.completed => 'Done ${c.completedAt == null ? '' : DateFormat('EEE, MMM d').format(c.completedAt!)}'.trim(),
        CommitmentStatus.sacrificed => 'Set aside',
        CommitmentStatus.active => '${overdue ? 'Overdue' : 'Due'} ${DateFormat('EEE, MMM d').format(c.dueDate)}',
      }, style: overdue ? context.text.bodySmall?.copyWith(color: Tokens.danger) : null),
      trailing: PopupMenuButton<String>(
        tooltip: 'Commitment options',
        icon: Icon(Icons.more_horiz_rounded, color: context.ci.muted),
        onSelected: (v) async {
          if (v == 'delete') {
            if (!await confirm(context, title: 'Delete this commitment?', action: 'Delete', destructive: true)) return;
            if (!context.mounted) return;
            final ok = await runAction(context, () => ref.read(backendProvider).deleteCommitment(c.id));
            if (ok) ref.invalidate(groupProvider(groupId));
          } else {
            await _set(context, ref, v == 'aside' ? CommitmentStatus.sacrificed : CommitmentStatus.active);
          }
        },
        itemBuilder: (_) => [
          if (c.status == CommitmentStatus.active) const PopupMenuItem(value: 'aside', child: Text('Set aside')),
          if (c.status != CommitmentStatus.active) const PopupMenuItem(value: 'reopen', child: Text('Reopen')),
          const PopupMenuItem(value: 'delete', child: Text('Delete')),
        ],
      ),
    );
  }
}

class _JoinRequestTile extends ConsumerWidget {
  const _JoinRequestTile({required this.request, required this.groupId});
  final JoinRequest request;
  final String groupId;

  Future<void> _answer(BuildContext context, WidgetRef ref, bool approve) async {
    final backend = ref.read(backendProvider);
    final ok = await runAction(
      context,
      () => approve ? backend.approveJoinRequest(request.id) : backend.rejectJoinRequest(request.id),
      done: approve ? '${request.requester.displayName} joined the group' : 'Request declined',
    );
    if (ok) ref.invalidate(groupProvider(groupId));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final r = request;
    return Padding(
      padding: const EdgeInsets.only(bottom: Tokens.space3),
      child: Panel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Avatar(name: r.requester.displayName, url: r.requester.avatarUrl, size: 36),
                const SizedBox(width: Tokens.space3),
                Expanded(child: Text(r.requester.displayName, style: context.text.titleSmall)),
                Text(timeAgo(r.createdAt, DateTime.now()), style: context.text.bodySmall),
              ],
            ),
            if (r.message?.isNotEmpty ?? false) ...[
              const SizedBox(height: Tokens.space2),
              Text('“${r.message}”', style: context.text.bodyMedium),
            ],
            const SizedBox(height: Tokens.space3),
            Row(
              children: [
                Expanded(
                  child: FilledButton(onPressed: () => _answer(context, ref, true), child: const Text('Approve')),
                ),
                const SizedBox(width: Tokens.space2),
                TextButton(onPressed: () => _answer(context, ref, false), child: const Text('Decline')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ReflectionCard extends ConsumerWidget {
  const _ReflectionCard({required this.groupId, required this.mine});
  final String groupId;
  final Reflection? mine;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> edit() async {
      final saved = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (_) => _ReflectionSheet(groupId: groupId, existing: mine),
      );
      if (saved == true) ref.invalidate(groupProvider(groupId));
    }

    if (mine == null) {
      return Panel(
        onTap: edit,
        child: Row(
          children: [
            Icon(Icons.edit_note_rounded, color: context.colors.primary, size: 28),
            const SizedBox(width: Tokens.space3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Reflect on today', style: context.text.titleSmall),
                  Text('What went well, and what was hard? Your group will see it.', style: context.text.bodySmall),
                ],
              ),
            ),
          ],
        ),
      );
    }
    return Panel(
      onTap: edit,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('YOUR REFLECTION TODAY', style: context.text.labelSmall),
              const Spacer(),
              Icon(Icons.edit_outlined, size: 18, color: context.ci.muted),
            ],
          ),
          const SizedBox(height: Tokens.space2),
          Text(mine!.notes, style: context.text.bodyMedium),
          if (mine!.hardQuestion?.isNotEmpty ?? false) ...[
            const SizedBox(height: Tokens.space2),
            Text('Hardest part: ${mine!.hardQuestion}', style: context.text.bodySmall),
          ],
        ],
      ),
    );
  }
}

class _ReflectionSheet extends ConsumerStatefulWidget {
  const _ReflectionSheet({required this.groupId, this.existing});
  final String groupId;
  final Reflection? existing;
  @override
  ConsumerState<_ReflectionSheet> createState() => _ReflectionSheetState();
}

class _ReflectionSheetState extends ConsumerState<_ReflectionSheet> {
  late final _notes = TextEditingController(text: widget.existing?.notes);
  late final _hard = TextEditingController(text: widget.existing?.hardQuestion);
  bool _busy = false;

  @override
  void dispose() {
    _notes.dispose();
    _hard.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_notes.text.trim().isEmpty) return;
    setState(() => _busy = true);
    final ok = await runAction(
      context,
      () => ref.read(backendProvider).saveReflection(widget.groupId, _notes.text, _hard.text),
      done: 'Reflection saved',
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(Tokens.space5, 0, Tokens.space5, MediaQuery.viewInsetsOf(context).bottom + Tokens.space5),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Today’s reflection', style: context.text.titleLarge),
          const SizedBox(height: Tokens.space4),
          TextField(
            controller: _notes,
            autofocus: true,
            minLines: 3,
            maxLines: 6,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(labelText: 'How did it go?', alignLabelWithHint: true),
          ),
          const SizedBox(height: Tokens.space3),
          TextField(
            controller: _hard,
            minLines: 1,
            maxLines: 3,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(labelText: 'What was hardest? (optional)'),
          ),
          const SizedBox(height: Tokens.space5),
          FilledButton(onPressed: _busy ? null : _save, child: const Text('Save reflection')),
        ],
      ),
    );
  }
}
