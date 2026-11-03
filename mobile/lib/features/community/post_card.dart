import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../domain/models.dart';
import '../../domain/progress.dart';
import '../../widgets/common.dart';

Color postTypeColor(BuildContext context, PostType t) => switch (t) {
  PostType.prayer => context.colors.primary,
  PostType.launch => const Color(0xFFB7791F),
  PostType.win => context.ci.success,
};

IconData postTypeIcon(PostType t) => switch (t) {
  PostType.prayer => Icons.volunteer_activism_rounded,
  PostType.launch => Icons.rocket_launch_rounded,
  PostType.win => Icons.emoji_events_rounded,
};

/// A prayer request, launch or win, with "Praying" and comments.
class PostCard extends ConsumerStatefulWidget {
  const PostCard({super.key, required this.post, this.compact = false});
  final PrayerPost post;
  final bool compact;

  @override
  ConsumerState<PostCard> createState() => _PostCardState();
}

class _PostCardState extends ConsumerState<PostCard> {
  late PrayerPost _post = widget.post;

  @override
  void didUpdateWidget(PostCard old) {
    super.didUpdateWidget(old);
    if (old.post != widget.post) _post = widget.post;
  }

  Future<void> _pray() async {
    final before = _post;
    final on = !before.iAmPraying;
    if (on) HapticFeedback.lightImpact();
    setState(() => _post = before.copyWith(iAmPraying: on, prayingCount: before.prayingCount + (on ? 1 : -1)));
    final ok = await runAction(context, () => ref.read(backendProvider).setPraying(before.id, on));
    if (!ok && mounted) setState(() => _post = before);
  }

  Future<void> _menu() async {
    final p = _post;
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (c) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(p.isActive ? Icons.check_circle_outline_rounded : Icons.replay_rounded),
              title: Text(p.isActive ? (p.type == PostType.prayer ? 'Mark as answered' : 'Close this post') : 'Show on the wall again'),
              subtitle: Text(p.isActive ? 'It comes off the wall but stays in your posts.' : 'Others will see it again.'),
              onTap: () => Navigator.pop(c, 'toggle'),
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline_rounded, color: Tokens.danger),
              title: const Text('Delete', style: TextStyle(color: Tokens.danger)),
              onTap: () => Navigator.pop(c, 'delete'),
            ),
          ],
        ),
      ),
    );
    if (!mounted || choice == null) return;
    final backend = ref.read(backendProvider);
    if (choice == 'delete' && !await confirm(context, title: 'Delete this post?', action: 'Delete', destructive: true)) return;
    if (!mounted) return;
    final ok = await runAction(context, () => choice == 'delete' ? backend.deletePost(p.id) : backend.setPostActive(p.id, !p.isActive));
    if (ok) ref.invalidate(postsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final p = _post;
    final mine = p.author.userId == ref.watch(userIdProvider).value;
    final color = postTypeColor(context, p.type);
    return Panel(
      padding: const EdgeInsets.fromLTRB(Tokens.space4, Tokens.space4, Tokens.space2, Tokens.space2),
      onTap: widget.compact ? () => showPostComments(context, p) : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Avatar(name: p.author.displayName, url: p.author.avatarUrl, size: 36),
              const SizedBox(width: Tokens.space3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(mine ? 'You' : p.author.displayName, style: context.text.titleSmall, overflow: TextOverflow.ellipsis),
                    Text(timeAgo(p.createdAt, DateTime.now()), style: context.text.bodySmall),
                  ],
                ),
              ),
              Pill(p.type.label, color: color, icon: postTypeIcon(p.type)),
              if (mine)
                IconButton(tooltip: 'Post options', onPressed: _menu, icon: const Icon(Icons.more_vert_rounded, size: 20))
              else
                const SizedBox(width: Tokens.space2),
            ],
          ),
          const SizedBox(height: Tokens.space3),
          Padding(
            padding: const EdgeInsets.only(right: Tokens.space2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!p.isActive) ...[
                  Pill(p.type == PostType.prayer ? 'Answered' : 'Closed', color: context.ci.muted),
                  const SizedBox(height: Tokens.space2),
                ],
                Text(p.title, style: context.text.titleMedium),
                const SizedBox(height: Tokens.space1),
                Text(
                  p.content,
                  style: context.text.bodyMedium?.copyWith(color: context.colors.onSurface.withValues(alpha: 0.85)),
                  maxLines: widget.compact ? 3 : null,
                  overflow: widget.compact ? TextOverflow.ellipsis : null,
                ),
              ],
            ),
          ),
          const SizedBox(height: Tokens.space2),
          Wrap(
            spacing: Tokens.space1,
            children: [
              TextButton.icon(
                key: Key('pray-${p.id}'),
                onPressed: _pray,
                style: TextButton.styleFrom(
                  foregroundColor: p.iAmPraying ? context.colors.primary : context.ci.muted,
                  backgroundColor: p.iAmPraying ? context.colors.primaryContainer : null,
                  visualDensity: VisualDensity.compact,
                  textStyle: context.text.labelMedium,
                ),
                // The hands pop when you start praying; the count rolls to its new value.
                icon: TweenAnimationBuilder<double>(
                  key: ValueKey(p.iAmPraying),
                  tween: Tween(begin: p.iAmPraying ? 0.5 : 1, end: 1),
                  duration: const Duration(milliseconds: 600),
                  curve: Curves.elasticOut,
                  builder: (_, s, child) => Transform.scale(scale: s, child: child),
                  child: Icon(p.iAmPraying ? Icons.volunteer_activism : Icons.volunteer_activism_outlined, size: 18),
                ),
                label: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  transitionBuilder: (child, a) => FadeTransition(
                    opacity: a,
                    child: SlideTransition(
                      position: Tween(begin: const Offset(0, 0.4), end: Offset.zero).animate(a),
                      child: child,
                    ),
                  ),
                  child: Text(
                    p.prayingCount == 0 ? 'Pray' : (p.iAmPraying ? 'Praying · ${p.prayingCount}' : 'Pray · ${p.prayingCount}'),
                    key: ValueKey('${p.iAmPraying}${p.prayingCount}'),
                  ),
                ),
              ),
              TextButton.icon(
                onPressed: () => showPostComments(context, p),
                style: TextButton.styleFrom(
                  foregroundColor: context.ci.muted,
                  visualDensity: VisualDensity.compact,
                  textStyle: context.text.labelMedium,
                ),
                icon: const Icon(Icons.chat_bubble_outline_rounded, size: 17),
                label: Text(p.commentCount == 0 ? 'Encourage' : '${p.commentCount}'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

Future<void> showPostComments(BuildContext context, PrayerPost post) => showModalBottomSheet(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  builder: (_) => _CommentsSheet(post: post),
);

class _CommentsSheet extends ConsumerWidget {
  const _CommentsSheet({required this.post});
  final PrayerPost post;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final comments = ref.watch(postCommentsProvider(post.id));
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.85),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(Tokens.space5, 0, Tokens.space5, Tokens.space2),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Pill(post.type.label, color: postTypeColor(context, post.type), icon: postTypeIcon(post.type)),
                  const SizedBox(height: Tokens.space2),
                  Text(post.title, style: context.text.titleLarge),
                  const SizedBox(height: Tokens.space1),
                  Text(post.content, style: context.text.bodyMedium),
                ],
              ),
            ),
            const Divider(),
            Flexible(
              child: AsyncBody<List<Comment>>(
                value: comments,
                onRetry: () => ref.invalidate(postCommentsProvider(post.id)),
                data: (list) => list.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.all(Tokens.space6),
                        child: Text('No words of encouragement yet. Be the first.', textAlign: TextAlign.center),
                      )
                    : ListView(
                        shrinkWrap: true,
                        padding: const EdgeInsets.symmetric(horizontal: Tokens.space5),
                        children: [for (final c in list) CommentTile(comment: c)],
                      ),
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(Tokens.space4, Tokens.space2, Tokens.space4, Tokens.space3),
                child: Composer(
                  hint: 'Write something encouraging',
                  onSend: (text) async {
                    final ok = await runAction(context, () => ref.read(backendProvider).addPostComment(post.id, text));
                    if (ok) {
                      ref.invalidate(postCommentsProvider(post.id));
                      ref.invalidate(postsProvider);
                    }
                    return ok;
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
