import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../widgets/common.dart';
import 'post_card.dart';

/// The prayer wall and the member directory.
class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key, this.showMembers = false});
  final bool showMembers;

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> with SingleTickerProviderStateMixin {
  late final _tabs = TabController(length: 2, vsync: this, initialIndex: widget.showMembers ? 1 : 0)..addListener(() => setState(() {}));

  @override
  void didUpdateWidget(CommunityScreen old) {
    super.didUpdateWidget(old);
    if (widget.showMembers != old.showMembers) _tabs.index = widget.showMembers ? 1 : 0;
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community'),
        bottom: TabBar(
          controller: _tabs,
          tabAlignment: TabAlignment.start,
          isScrollable: true,
          dividerColor: context.ci.line,
          labelStyle: context.text.titleSmall,
          unselectedLabelColor: context.ci.muted,
          tabs: const [
            Tab(text: 'Prayer wall'),
            Tab(text: 'Members'),
          ],
        ),
      ),
      floatingActionButton: _tabs.index == 0
          ? FloatingActionButton.extended(
              onPressed: () => showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                useSafeArea: true,
                builder: (_) => const _ComposeSheet(),
              ),
              icon: const Icon(Icons.edit_rounded),
              label: const Text('Share'),
            )
          : null,
      body: TabBarView(controller: _tabs, children: const [_PrayerWall(), _Members()]),
    );
  }
}

class _PrayerWall extends ConsumerStatefulWidget {
  const _PrayerWall();
  @override
  ConsumerState<_PrayerWall> createState() => _PrayerWallState();
}

class _PrayerWallState extends ConsumerState<_PrayerWall> {
  PostType? _filter;

  @override
  Widget build(BuildContext context) {
    final posts = ref.watch(postsProvider);
    return GlobeRefresh(
      onRefresh: () => ref.refresh(postsProvider.future),
      child: AsyncBody<List<PrayerPost>>(
        value: posts,
        onRetry: () => ref.invalidate(postsProvider),
        data: (all) {
          final shown = [
            for (final p in all)
              if (_filter == null || p.type == _filter) p,
          ];
          return ListView(
            padding: const EdgeInsets.fromLTRB(Tokens.space4, Tokens.space3, Tokens.space4, 96),
            children: [
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (final t in <PostType?>[null, ...PostType.values])
                      Padding(
                        padding: const EdgeInsets.only(right: Tokens.space2),
                        child: ChoiceChip(
                          label: Text(t == null ? 'All' : '${t.label}s'),
                          selected: _filter == t,
                          labelStyle: context.text.labelMedium?.copyWith(color: _filter == t ? context.colors.surface : null),
                          onSelected: (_) => setState(() => _filter = t),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: Tokens.space3),
              if (shown.isEmpty)
                EmptyState(
                  icon: Icons.volunteer_activism_outlined,
                  title: _filter == null ? 'Nothing on the wall yet' : 'No ${_filter!.label.toLowerCase()}s yet',
                  message: 'Share a prayer request, something you’re launching, or a win.',
                )
              else
                for (final p in shown)
                  Padding(
                    padding: const EdgeInsets.only(bottom: Tokens.space3),
                    child: PostCard(post: p),
                  ),
            ],
          );
        },
      ),
    );
  }
}

class _ComposeSheet extends ConsumerStatefulWidget {
  const _ComposeSheet();
  @override
  ConsumerState<_ComposeSheet> createState() => _ComposeSheetState();
}

class _ComposeSheetState extends ConsumerState<_ComposeSheet> {
  final _form = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _content = TextEditingController();
  PostType _type = PostType.prayer;
  bool _busy = false;

  @override
  void dispose() {
    _title.dispose();
    _content.dispose();
    super.dispose();
  }

  Future<void> _post() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    final ok = await runAction(
      context,
      () => ref.read(backendProvider).createPost(_type, _title.text, _content.text),
      done: 'Posted to the wall',
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) {
      ref.invalidate(postsProvider);
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(Tokens.space5, 0, Tokens.space5, MediaQuery.viewInsetsOf(context).bottom + Tokens.space5),
      child: Form(
        key: _form,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Share with the community', style: context.text.titleLarge),
            const SizedBox(height: Tokens.space4),
            SegmentedButton<PostType>(
              segments: [
                for (final t in PostType.values) ButtonSegment(value: t, label: Text(t.label), icon: Icon(postTypeIcon(t), size: 16)),
              ],
              selected: {_type},
              showSelectedIcon: false,
              onSelectionChanged: (v) => setState(() => _type = v.first),
            ),
            const SizedBox(height: Tokens.space2),
            Text(_type.prompt, style: context.text.bodySmall),
            const SizedBox(height: Tokens.space4),
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Title'),
              textCapitalization: TextCapitalization.sentences,
              maxLength: 120,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Add a title' : null,
            ),
            const SizedBox(height: Tokens.space2),
            TextFormField(
              controller: _content,
              decoration: const InputDecoration(labelText: 'Details', alignLabelWithHint: true),
              textCapitalization: TextCapitalization.sentences,
              minLines: 4,
              maxLines: 8,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Add a few details' : null,
            ),
            const SizedBox(height: Tokens.space5),
            FilledButton(onPressed: _busy ? null : _post, child: Text('Post ${_type.label.toLowerCase()}')),
          ],
        ),
      ),
    );
  }
}

class _Members extends ConsumerStatefulWidget {
  const _Members();
  @override
  ConsumerState<_Members> createState() => _MembersState();
}

class _MembersState extends ConsumerState<_Members> {
  String _query = '';
  bool _business = false, _accountability = false;

  bool _matches(Profile p) {
    if (_business && !p.lookingForBusinessPartner) return false;
    if (_accountability && !p.lookingForAccountabilityPartner) return false;
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return true;
    return p.displayName.toLowerCase().contains(q) ||
        p.skills.any((s) => s.toLowerCase().contains(q)) ||
        p.interests.any((s) => s.toLowerCase().contains(q));
  }

  @override
  Widget build(BuildContext context) {
    final members = ref.watch(membersProvider);
    return AsyncBody<List<Profile>>(
      value: members,
      onRetry: () => ref.invalidate(membersProvider),
      data: (all) {
        final shown = all.where(_matches).toList();
        return ListView(
          padding: const EdgeInsets.fromLTRB(Tokens.space4, Tokens.space3, Tokens.space4, Tokens.space8),
          children: [
            TextField(
              decoration: const InputDecoration(hintText: 'Search by name, skill or interest', prefixIcon: Icon(Icons.search_rounded)),
              onChanged: (v) => setState(() => _query = v),
            ),
            const SizedBox(height: Tokens.space3),
            Wrap(
              spacing: Tokens.space2,
              children: [
                FilterChip(
                  label: const Text('Business partner'),
                  selected: _business,
                  labelStyle: context.text.labelMedium?.copyWith(color: _business ? context.colors.surface : null),
                  onSelected: (v) => setState(() => _business = v),
                ),
                FilterChip(
                  label: const Text('Accountability partner'),
                  selected: _accountability,
                  labelStyle: context.text.labelMedium?.copyWith(color: _accountability ? context.colors.surface : null),
                  onSelected: (v) => setState(() => _accountability = v),
                ),
              ],
            ),
            const SizedBox(height: Tokens.space3),
            if (shown.isEmpty)
              const EmptyState(icon: Icons.person_search_rounded, title: 'No one matches', message: 'Try a different search or filter.')
            else
              Card(
                child: Column(
                  children: [
                    for (var i = 0; i < shown.length; i++) ...[if (i > 0) const Divider(indent: 72), _MemberTile(profile: shown[i])],
                  ],
                ),
              ),
          ],
        );
      },
    );
  }
}

class _MemberTile extends StatelessWidget {
  const _MemberTile({required this.profile});
  final Profile profile;

  @override
  Widget build(BuildContext context) {
    final p = profile;
    final subtitle = p.skills.isNotEmpty ? p.skills.take(3).join(' · ') : (p.bio?.split('\n').first ?? '');
    return ListTile(
      leading: Avatar(name: p.displayName, url: p.avatarUrl, size: 44),
      title: Text(p.displayName),
      subtitle: subtitle.isEmpty ? null : Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (p.lookingForBusinessPartner)
            Tooltip(
              message: 'Open to a business partner',
              child: Icon(Icons.work_outline_rounded, size: 18, color: context.ci.muted),
            ),
          if (p.lookingForAccountabilityPartner) ...[
            const SizedBox(width: 6),
            Tooltip(
              message: 'Open to an accountability partner',
              child: Icon(Icons.handshake_outlined, size: 18, color: context.ci.muted),
            ),
          ],
        ],
      ),
      onTap: () => showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (_) => MemberSheet(profile: p),
      ),
    );
  }
}

class MemberSheet extends StatelessWidget {
  const MemberSheet({super.key, required this.profile});
  final Profile profile;

  @override
  Widget build(BuildContext context) {
    final p = profile;
    Widget tags(List<String> items, Color color) => Wrap(
      spacing: Tokens.space2,
      runSpacing: Tokens.space2,
      children: [for (final s in items) Pill(s, color: color)],
    );
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(Tokens.space6, 0, Tokens.space6, Tokens.space8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Avatar(name: p.displayName, url: p.avatarUrl, size: 88),
          ),
          const SizedBox(height: Tokens.space3),
          Center(
            child: Text(p.displayName, style: context.displayText(size: 26), textAlign: TextAlign.center),
          ),
          if (p.lookingForBusinessPartner || p.lookingForAccountabilityPartner) ...[
            const SizedBox(height: Tokens.space3),
            Center(
              child: Wrap(
                spacing: Tokens.space2,
                children: [
                  if (p.lookingForBusinessPartner)
                    Pill('Open to a business partner', color: context.ci.accent, icon: Icons.work_outline_rounded),
                  if (p.lookingForAccountabilityPartner)
                    Pill('Open to accountability', color: context.ci.success, icon: Icons.handshake_outlined),
                ],
              ),
            ),
          ],
          if (p.bio?.trim().isNotEmpty ?? false) ...[const SectionLabel('About'), Text(p.bio!.trim(), style: context.text.bodyLarge)],
          if (p.skills.isNotEmpty) ...[const SectionLabel('Skills'), tags(p.skills, context.colors.primary)],
          if (p.interests.isNotEmpty) ...[const SectionLabel('Interests'), tags(p.interests, context.ci.success)],
          if (p.links.isNotEmpty) ...[
            const SectionLabel('Links'),
            Wrap(
              spacing: Tokens.space2,
              runSpacing: Tokens.space2,
              children: [
                for (final e in p.links.entries)
                  ActionChip(
                    avatar: const Icon(Icons.open_in_new_rounded, size: 16),
                    label: Text(e.key),
                    onPressed: () => launchUrl(
                      Uri.parse(e.value.startsWith('http') ? e.value : 'https://${e.value}'),
                      mode: LaunchMode.externalApplication,
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
