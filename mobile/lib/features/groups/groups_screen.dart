import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../widgets/common.dart';

/// Accountability groups: invitations waiting on you, then your groups.
class GroupsScreen extends ConsumerWidget {
  const GroupsScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(invitationsProvider);
    ref.invalidate(myGroupsProvider);
    await ref.read(myGroupsProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groups = ref.watch(myGroupsProvider);
    final invitations = ref.watch(invitationsProvider).value ?? const [];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Groups'),
        actions: [
          IconButton(
            tooltip: 'Find a group',
            onPressed: () => context.push('/groups/discover'),
            icon: const Icon(Icons.travel_explore_rounded),
          ),
          const SizedBox(width: Tokens.space2),
        ],
      ),
      body: GlobeRefresh(
        onRefresh: () => _refresh(ref),
        child: AsyncBody<List<GroupSummary>>(
          value: groups,
          onRetry: () => _refresh(ref),
          data: (groups) => ListView(
            padding: const EdgeInsets.fromLTRB(Tokens.space4, Tokens.space2, Tokens.space4, Tokens.space8),
            children: [
              if (invitations.isNotEmpty) ...[
                const SectionLabel('Invitations'),
                for (final inv in invitations)
                  Padding(
                    padding: const EdgeInsets.only(bottom: Tokens.space3),
                    child: _InvitationCard(invitation: inv),
                  ),
              ],
              if (groups.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: Tokens.space6),
                  child: EmptyState(
                    icon: Icons.handshake_outlined,
                    title: 'Grow with a group',
                    message: 'Set weekly commitments, reflect together, and keep each other on track.',
                    action: Column(
                      children: [
                        FilledButton(onPressed: () => context.push('/groups/discover'), child: const Text('Find a group')),
                        const SizedBox(height: Tokens.space2),
                        TextButton(onPressed: () => context.push('/groups/new'), child: const Text('Start your own')),
                      ],
                    ),
                  ),
                )
              else ...[
                const SectionLabel('Your groups'),
                for (final g in groups)
                  Padding(
                    padding: const EdgeInsets.only(bottom: Tokens.space3),
                    child: GroupCard(group: g),
                  ),
                const SizedBox(height: Tokens.space2),
                OutlinedButton.icon(
                  onPressed: () => context.push('/groups/new'),
                  icon: const Icon(Icons.add_rounded),
                  label: const Text('Start a group'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class GroupCard extends StatelessWidget {
  const GroupCard({super.key, required this.group, this.trailing});
  final GroupSummary group;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final g = group;
    return Panel(
      onTap: trailing == null ? () => context.push('/group/${g.id}') : null,
      padding: const EdgeInsets.all(Tokens.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: context.colors.primaryContainer, borderRadius: BorderRadius.circular(Tokens.radiusS)),
                child: Text(
                  g.name.isEmpty ? '?' : g.name.substring(0, 1).toUpperCase(),
                  style: context.displayText(size: 22, color: context.colors.onPrimaryContainer),
                ),
              ),
              const SizedBox(width: Tokens.space3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(g.name, style: context.text.titleMedium),
                    const SizedBox(height: 2),
                    Text(g.objective, style: context.text.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              if (trailing == null) Icon(Icons.chevron_right_rounded, color: context.ci.muted),
            ],
          ),
          const SizedBox(height: Tokens.space3),
          Row(
            children: [
              Expanded(
                child: AvatarStack(names: g.previewNames, avatars: g.previewAvatars, total: g.memberCount, size: 26),
              ),
              ?trailing,
            ],
          ),
        ],
      ),
    );
  }
}

class _InvitationCard extends ConsumerStatefulWidget {
  const _InvitationCard({required this.invitation});
  final Invitation invitation;
  @override
  ConsumerState<_InvitationCard> createState() => _InvitationCardState();
}

class _InvitationCardState extends ConsumerState<_InvitationCard> {
  bool _busy = false;

  Future<void> _answer(bool accept) async {
    setState(() => _busy = true);
    final backend = ref.read(backendProvider);
    final inv = widget.invitation;
    final ok = await runAction(
      context,
      () => accept ? backend.acceptInvitation(inv.id) : backend.declineInvitation(inv.id),
      done: accept ? 'Welcome to ${inv.groupName}' : 'Invitation declined',
    );
    if (ok) {
      ref.invalidate(invitationsProvider);
      ref.invalidate(myGroupsProvider);
      ref.invalidate(notificationsProvider);
    }
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final inv = widget.invitation;
    return Container(
      padding: const EdgeInsets.all(Tokens.space4),
      decoration: BoxDecoration(color: context.colors.secondaryContainer, borderRadius: BorderRadius.circular(Tokens.radiusM)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Avatar(name: inv.invitedBy.displayName, url: inv.invitedBy.avatarUrl, size: 36),
              const SizedBox(width: Tokens.space3),
              Expanded(
                child: Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: inv.invitedBy.displayName,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const TextSpan(text: ' invited you to join '),
                      TextSpan(
                        text: inv.groupName,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  style: context.text.bodyMedium?.copyWith(color: context.colors.onSecondaryContainer),
                ),
              ),
            ],
          ),
          const SizedBox(height: Tokens.space3),
          Row(
            children: [
              Expanded(
                child: FilledButton(onPressed: _busy ? null : () => _answer(true), child: const Text('Join group')),
              ),
              const SizedBox(width: Tokens.space2),
              TextButton(onPressed: _busy ? null : () => _answer(false), child: const Text('Decline')),
            ],
          ),
        ],
      ),
    );
  }
}

class DiscoverGroupsScreen extends ConsumerWidget {
  const DiscoverGroupsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groups = ref.watch(discoverGroupsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Find a group')),
      body: AsyncBody<List<GroupSummary>>(
        value: groups,
        onRetry: () => ref.invalidate(discoverGroupsProvider),
        data: (groups) => groups.isEmpty
            ? EmptyState(
                icon: Icons.groups_outlined,
                title: 'No other groups yet',
                message: 'Start one and invite people from the member directory on the web.',
                action: FilledButton(onPressed: () => context.push('/groups/new'), child: const Text('Start a group')),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(Tokens.space4),
                itemCount: groups.length,
                separatorBuilder: (_, _) => const SizedBox(height: Tokens.space3),
                itemBuilder: (_, i) => GroupCard(
                  group: groups[i],
                  trailing: _JoinButton(group: groups[i]),
                ),
              ),
      ),
    );
  }
}

class _JoinButton extends ConsumerStatefulWidget {
  const _JoinButton({required this.group});
  final GroupSummary group;
  @override
  ConsumerState<_JoinButton> createState() => _JoinButtonState();
}

class _JoinButtonState extends ConsumerState<_JoinButton> {
  bool _busy = false;

  Future<void> _request() async {
    final message = await showDialog<String>(
      context: context,
      builder: (_) => _RequestDialog(groupName: widget.group.name),
    );
    if (message == null || !mounted) return;
    setState(() => _busy = true);
    final ok = await runAction(
      context,
      () => ref.read(backendProvider).requestToJoin(widget.group.id, message),
      done: 'Request sent to the group leader',
    );
    if (ok) ref.invalidate(discoverGroupsProvider);
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _cancel() async {
    setState(() => _busy = true);
    final ok = await runAction(
      context,
      () => ref.read(backendProvider).cancelJoinRequest(widget.group.myRequestId!),
      done: 'Request withdrawn',
    );
    if (ok) ref.invalidate(discoverGroupsProvider);
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final style = FilledButton.styleFrom(
      minimumSize: const Size(0, 38),
      padding: const EdgeInsets.symmetric(horizontal: Tokens.space4),
    );
    if (widget.group.requestPending) {
      return OutlinedButton(
        onPressed: _busy ? null : _cancel,
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 38),
          padding: const EdgeInsets.symmetric(horizontal: Tokens.space4),
        ),
        child: const Text('Requested'),
      );
    }
    return FilledButton(onPressed: _busy ? null : _request, style: style, child: const Text('Ask to join'));
  }
}

class _RequestDialog extends StatefulWidget {
  const _RequestDialog({required this.groupName});
  final String groupName;
  @override
  State<_RequestDialog> createState() => _RequestDialogState();
}

class _RequestDialogState extends State<_RequestDialog> {
  final _c = TextEditingController();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Join ${widget.groupName}'),
      content: TextField(
        controller: _c,
        minLines: 2,
        maxLines: 4,
        textCapitalization: TextCapitalization.sentences,
        decoration: const InputDecoration(hintText: 'Say hello to the group leader (optional)'),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        TextButton(onPressed: () => Navigator.pop(context, _c.text), child: const Text('Send request')),
      ],
    );
  }
}

class CreateGroupScreen extends ConsumerStatefulWidget {
  const CreateGroupScreen({super.key});
  @override
  ConsumerState<CreateGroupScreen> createState() => _CreateGroupScreenState();
}

class _CreateGroupScreenState extends ConsumerState<CreateGroupScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _objective = TextEditingController(text: 'Establish a Green Light Project');
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _objective.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    String? id;
    final ok = await runAction(context, () async => id = await ref.read(backendProvider).createGroup(_name.text, _objective.text));
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) {
      ref.invalidate(myGroupsProvider);
      context.pushReplacement('/group/$id');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Start a group')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(Tokens.space5),
          children: [
            Text(
              'Gather a few people who’ll help each other follow through.',
              style: context.text.bodyLarge?.copyWith(color: context.ci.muted),
            ),
            const SizedBox(height: Tokens.space5),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Group name'),
              textCapitalization: TextCapitalization.words,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Name your group' : null,
            ),
            const SizedBox(height: Tokens.space3),
            TextFormField(
              controller: _objective,
              decoration: const InputDecoration(labelText: 'What are you working toward?', alignLabelWithHint: true),
              minLines: 2,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Add a goal for the group' : null,
            ),
            const SizedBox(height: Tokens.space6),
            FilledButton(onPressed: _busy ? null : _create, child: const Text('Create group')),
          ],
        ),
      ),
    );
  }
}
