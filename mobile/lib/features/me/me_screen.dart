import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../widgets/common.dart';

class MeScreen extends ConsumerWidget {
  const MeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final unread = ref.watch(unreadCountProvider);
    final streak = ref.watch(streakProvider);
    final groups = ref.watch(myGroupsProvider).value?.length;

    return Scaffold(
      body: SafeArea(
        child: AsyncBody<Profile>(
          value: profile,
          onRetry: () => ref.invalidate(profileProvider),
          data: (p) => ListView(
            padding: const EdgeInsets.fromLTRB(Tokens.space5, Tokens.space6, Tokens.space5, Tokens.space8),
            children: [
              Center(
                child: Avatar(name: p.displayName, url: p.avatarUrl, size: 96),
              ),
              const SizedBox(height: Tokens.space3),
              Center(
                child: Text(p.displayName, style: context.displayText(size: 28), textAlign: TextAlign.center),
              ),
              if (p.email != null) Center(child: Text(p.email!, style: context.text.bodySmall)),
              const SizedBox(height: Tokens.space3),
              Center(
                child: OutlinedButton(
                  onPressed: () => context.push('/profile/edit'),
                  style: OutlinedButton.styleFrom(minimumSize: const Size(0, 40)),
                  child: const Text('Edit profile'),
                ),
              ),
              const SizedBox(height: Tokens.space5),
              Row(
                children: [
                  _Count(value: '$streak', label: 'Day streak'),
                  _Count(value: groups == null ? '–' : '$groups', label: groups == 1 ? 'Group' : 'Groups'),
                  _Count(value: '${p.skills.length}', label: p.skills.length == 1 ? 'Skill' : 'Skills'),
                ],
              ),
              const SizedBox(height: Tokens.space5),
              Card(
                child: Column(
                  children: [
                    _Row(
                      icon: Icons.notifications_none_rounded,
                      label: 'Notifications',
                      badge: unread,
                      onTap: () => context.push('/notifications'),
                    ),
                    const Divider(indent: 56),
                    _Row(icon: Icons.auto_stories_outlined, label: 'Reading plan', onTap: () => context.push('/plan')),
                    const Divider(indent: 56),
                    _Row(icon: Icons.folder_open_rounded, label: 'Resources', onTap: () => context.push('/resources')),
                    const Divider(indent: 56),
                    _Row(icon: Icons.tune_rounded, label: 'Settings', onTap: () => context.push('/settings')),
                  ],
                ),
              ),
              const SizedBox(height: Tokens.space6),
              TextButton(
                onPressed: () async {
                  final pending = ref.read(syncStateProvider).value?.pending ?? 0;
                  final ok = await confirm(
                    context,
                    title: 'Sign out?',
                    message: pending == 0
                        ? null
                        : '${pending == 1 ? '1 change you made offline hasn’t' : '$pending changes you made offline haven’t'} '
                              'synced yet. Signing out discards ${pending == 1 ? 'it' : 'them'}.',
                    action: 'Sign out',
                    destructive: pending > 0,
                  );
                  if (!ok) return;
                  if (context.mounted) await runAction(context, () => ref.read(backendProvider).signOut());
                },
                style: TextButton.styleFrom(foregroundColor: Tokens.danger),
                child: const Text('Sign out'),
              ),
              const SizedBox(height: Tokens.space2),
              Center(child: Text('Building for the next 5, 50, and 500 years', style: context.text.bodySmall)),
            ],
          ),
        ),
      ),
    );
  }
}

class _Count extends StatelessWidget {
  const _Count({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      children: [
        Text(value, style: context.text.headlineSmall),
        Text(label, style: context.text.bodySmall),
      ],
    ),
  );
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.label, required this.onTap, this.badge = 0});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int badge;

  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(icon),
    title: Text(label),
    trailing: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (badge > 0) Badge(label: Text('$badge')),
        const SizedBox(width: Tokens.space2),
        Icon(Icons.chevron_right_rounded, color: context.ci.muted),
      ],
    ),
    onTap: onTap,
  );
}
