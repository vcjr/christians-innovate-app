import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app/providers.dart';
import '../../app/router.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../domain/progress.dart';
import '../../domain/scripture.dart';
import '../../widgets/common.dart';
import '../../widgets/scripture.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  IconData _icon(String type) => switch (type) {
    'group_invitation' || 'invitation_accepted' || 'invitation_declined' => Icons.group_add_outlined,
    'join_request' || 'join_request_approved' || 'join_request_rejected' => Icons.how_to_reg_outlined,
    'member_left' || 'member_removed' || 'ownership_transferred' => Icons.groups_outlined,
    'rhythm_updated' => Icons.event_repeat_rounded,
    _ => Icons.campaign_outlined,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(notificationsProvider);
    final unread = ref.watch(unreadCountProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unread > 0)
            TextButton(
              onPressed: () async {
                final ok = await runAction(context, () => ref.read(backendProvider).markAllNotificationsRead());
                if (ok) ref.invalidate(notificationsProvider);
              },
              child: const Text('Mark all read'),
            ),
          const SizedBox(width: Tokens.space2),
        ],
      ),
      body: GlobeRefresh(
        onRefresh: () => ref.refresh(notificationsProvider.future),
        child: AsyncBody<List<AppNotification>>(
          value: items,
          onRetry: () => ref.invalidate(notificationsProvider),
          data: (list) => list.isEmpty
              ? ListView(
                  children: const [
                    SizedBox(height: 80),
                    EmptyState(
                      icon: Icons.notifications_none_rounded,
                      title: 'You’re all caught up',
                      message: 'Group invitations and updates show up here.',
                    ),
                  ],
                )
              : ListView.separated(
                  itemCount: list.length,
                  separatorBuilder: (_, _) => const Divider(indent: 72),
                  itemBuilder: (context, i) {
                    final n = list[i];
                    return ListTile(
                      tileColor: n.isRead ? null : context.colors.primaryContainer.withValues(alpha: 0.35),
                      leading: CircleAvatar(
                        backgroundColor: context.colors.primaryContainer,
                        foregroundColor: context.colors.onPrimaryContainer,
                        child: Icon(_icon(n.type), size: 20),
                      ),
                      title: Text(n.title),
                      subtitle: Text([if (n.message != null) n.message!, timeAgo(n.createdAt, DateTime.now())].join('\n')),
                      isThreeLine: n.message != null,
                      onTap: () async {
                        if (!n.isRead) {
                          await ref.read(backendProvider).markNotificationRead(n.id).catchError((_) {});
                          ref.invalidate(notificationsProvider);
                        }
                        if (context.mounted) context.go(appPathForWebLink(n.link));
                      },
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class ResourcesScreen extends ConsumerStatefulWidget {
  const ResourcesScreen({super.key});
  @override
  ConsumerState<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends ConsumerState<ResourcesScreen> {
  String? _category;

  @override
  Widget build(BuildContext context) {
    final items = ref.watch(resourcesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Resources')),
      body: AsyncBody<List<Resource>>(
        value: items,
        onRetry: () => ref.invalidate(resourcesProvider),
        data: (all) {
          if (all.isEmpty) {
            return const EmptyState(
              icon: Icons.folder_open_rounded,
              title: 'No resources yet',
              message: 'Guides, templates and talks shared by members will be here.',
            );
          }
          final categories = {for (final r in all) r.category}.toList()..sort();
          final shown = [
            for (final r in all)
              if (_category == null || r.category == _category) r,
          ];
          return ListView(
            padding: const EdgeInsets.all(Tokens.space4),
            children: [
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (final c in <String?>[null, ...categories])
                      Padding(
                        padding: const EdgeInsets.only(right: Tokens.space2),
                        child: ChoiceChip(
                          label: Text(c ?? 'All'),
                          selected: _category == c,
                          labelStyle: context.text.labelMedium?.copyWith(color: _category == c ? context.colors.surface : null),
                          onSelected: (_) => setState(() => _category = c),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: Tokens.space3),
              for (final r in shown)
                Padding(
                  padding: const EdgeInsets.only(bottom: Tokens.space3),
                  child: Panel(
                    onTap: r.url == null ? null : () => launchUrl(Uri.parse(r.url!), mode: LaunchMode.externalApplication),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: context.colors.secondaryContainer,
                            borderRadius: BorderRadius.circular(Tokens.radiusS),
                          ),
                          child: Icon(Icons.description_outlined, color: context.colors.onSecondaryContainer),
                        ),
                        const SizedBox(width: Tokens.space3),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(r.title, style: context.text.titleSmall),
                              if (r.description?.isNotEmpty ?? false) ...[
                                const SizedBox(height: 2),
                                Text(r.description!, style: context.text.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                              ],
                              const SizedBox(height: Tokens.space2),
                              Text('${r.category} · ${r.author.displayName}', style: context.text.labelSmall),
                            ],
                          ),
                        ),
                        if (r.url != null) Icon(Icons.open_in_new_rounded, size: 18, color: context.ci.muted),
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  Future<void> _set(BuildContext context, WidgetRef ref, String column, bool value) async {
    final ok = await runAction(context, () => ref.read(backendProvider).updateProfile({column: value}));
    if (ok) ref.invalidate(profileProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final translation = ref.watch(translationProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: AsyncBody<Profile>(
        value: profile,
        onRetry: () => ref.invalidate(profileProvider),
        data: (p) => ListView(
          padding: const EdgeInsets.fromLTRB(Tokens.space4, 0, Tokens.space4, Tokens.space8),
          children: [
            const SectionLabel('Reading'),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.translate_rounded),
                    title: const Text('Translation'),
                    subtitle: Text(translations[translation] ?? translation),
                    trailing: Icon(Icons.chevron_right_rounded, color: context.ci.muted),
                    onTap: () => showTranslationPicker(context, ref),
                  ),
                  const Divider(indent: 56),
                  ListTile(
                    leading: const Icon(Icons.text_fields_rounded),
                    title: const Text('Text and page'),
                    subtitle: const Text('Size, typeface, colors'),
                    trailing: Icon(Icons.chevron_right_rounded, color: context.ci.muted),
                    onTap: () => showReaderSettings(context),
                  ),
                ],
              ),
            ),
            const SectionLabel('Offline Bible'),
            const _OfflineBible(),
            const SectionLabel('Email'),
            Card(
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Email notifications'),
                    subtitle: const Text('Turn off to stop all email from Christians Innovate'),
                    value: p.emailNotifications,
                    onChanged: (v) => _set(context, ref, 'email_notifications_enabled', v),
                  ),
                  const Divider(indent: 16),
                  SwitchListTile(
                    title: const Text('Daily reading reminder'),
                    value: p.dailyReminder && p.emailNotifications,
                    onChanged: p.emailNotifications ? (v) => _set(context, ref, 'daily_reminder_enabled', v) : null,
                  ),
                  const Divider(indent: 16),
                  SwitchListTile(
                    title: const Text('Meeting reminders'),
                    value: p.meetingReminder && p.emailNotifications,
                    onChanged: p.emailNotifications ? (v) => _set(context, ref, 'meeting_reminder_enabled', v) : null,
                  ),
                  const Divider(indent: 16),
                  SwitchListTile(
                    title: const Text('Weekly digest'),
                    value: p.weeklyDigest && p.emailNotifications,
                    onChanged: p.emailNotifications ? (v) => _set(context, ref, 'weekly_digest_enabled', v) : null,
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(Tokens.space3),
              child: Text('These are the same settings as on the website.', style: context.text.bodySmall),
            ),
          ],
        ),
      ),
    );
  }
}

/// Download whole translations so every chapter reads without a connection.
class _OfflineBible extends ConsumerWidget {
  const _OfflineBible();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloaded = ref.watch(downloadedTranslationsProvider).value ?? const <String>{};
    final size = ref.watch(downloadedSizeProvider).value ?? 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          child: Column(
            children: [
              for (final (i, e) in translations.entries.indexed) ...[
                if (i > 0) const Divider(indent: 16),
                _TranslationDownload(code: e.key, name: e.value, downloaded: downloaded.contains(e.key)),
              ],
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(Tokens.space3),
          child: Text(
            [
              if (size > 0) 'Using ${(size / 1e6).toStringAsFixed(0)} MB.',
              'Your plan’s next $readAheadDays days are saved automatically.',
            ].join(' '),
            style: context.text.bodySmall,
          ),
        ),
      ],
    );
  }
}

class _TranslationDownload extends ConsumerStatefulWidget {
  const _TranslationDownload({required this.code, required this.name, required this.downloaded});
  final String code;
  final String name;
  final bool downloaded;

  @override
  ConsumerState<_TranslationDownload> createState() => _TranslationDownloadState();
}

class _TranslationDownloadState extends ConsumerState<_TranslationDownload> {
  /// Set while downloading.
  double? _progress;

  Future<void> _download() async {
    setState(() => _progress = 0);
    final ok = await runAction(
      context,
      () => ref.read(backendProvider).downloadTranslation(widget.code, onProgress: (p) => mounted ? setState(() => _progress = p) : null),
      done: '${widget.code} is saved for reading offline',
    );
    if (ok) ref.invalidate(downloadedTranslationsProvider);
    if (mounted) setState(() => _progress = null);
  }

  Future<void> _remove() async {
    final yes = await confirm(
      context,
      title: 'Remove ${widget.code} from this device?',
      message: 'You can download it again any time.',
      action: 'Remove',
      destructive: true,
    );
    if (!yes || !mounted) return;
    await ref.read(backendProvider).removeTranslation(widget.code);
    ref.invalidate(downloadedTranslationsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final p = _progress;
    return ListTile(
      leading: SizedBox(
        width: 48,
        child: Text(widget.code, style: context.text.titleSmall?.copyWith(color: context.colors.primary)),
      ),
      title: Text(widget.name),
      subtitle: Text(
        p != null
            ? 'Downloading… ${(p * 100).round()}%'
            : widget.downloaded
            ? 'On this device'
            : 'Not downloaded',
      ),
      trailing: p != null
          ? SizedBox.square(dimension: 28, child: CircularProgressIndicator(value: p == 0 ? null : p, strokeWidth: 3))
          : widget.downloaded
          ? IconButton(
              key: Key('remove-${widget.code}'),
              tooltip: 'Remove from device',
              onPressed: _remove,
              icon: Icon(Icons.download_done_rounded, color: context.ci.success),
            )
          : IconButton(
              key: Key('download-${widget.code}'),
              tooltip: 'Download for offline',
              onPressed: _download,
              icon: const Icon(Icons.download_rounded),
            ),
    );
  }
}
