import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app/theme.dart';
import '../data/backend.dart';
import '../domain/models.dart';
import '../domain/progress.dart';
import 'loading.dart';

export 'loading.dart';
export 'motion.dart';

/// A round photo, or initials on a tint picked from the name so a list doesn't look uniform.
class Avatar extends StatelessWidget {
  const Avatar({super.key, required this.name, this.url, this.size = 40});
  final String name;
  final String? url;
  final double size;

  static const _tints = [Color(0xFF1E63C6), Color(0xFF2F8F5B), Color(0xFF9A5B1E), Color(0xFF7B4FB8), Color(0xFFB8435A), Color(0xFF1F8A8A)];

  @override
  Widget build(BuildContext context) {
    final tint = _tints[name.codeUnits.fold(0, (a, b) => a + b) % _tints.length];
    final fallback = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(shape: BoxShape.circle, color: tint.withValues(alpha: 0.14)),
      child: Text(
        initialsOf(name),
        style: TextStyle(fontFamily: Tokens.sans, fontWeight: FontWeight.w700, fontSize: size * 0.36, color: tint),
      ),
    );
    if (url == null || url!.isEmpty) return fallback;
    return ClipOval(
      child: Image.network(url!, width: size, height: size, fit: BoxFit.cover, errorBuilder: (_, _, _) => fallback),
    );
  }
}

/// Overlapping avatars plus a count, for groups.
class AvatarStack extends StatelessWidget {
  const AvatarStack({super.key, required this.names, required this.avatars, required this.total, this.size = 28});
  final List<String> names;
  final List<String?> avatars;
  final int total;
  final double size;

  @override
  Widget build(BuildContext context) {
    final shown = names.take(4).toList();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: shown.isEmpty ? 0 : size + (shown.length - 1) * size * 0.62,
          height: size,
          child: Stack(
            children: [
              for (var i = 0; i < shown.length; i++)
                Positioned(
                  left: i * size * 0.62,
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: context.colors.surface, width: 2),
                    ),
                    child: Avatar(name: shown[i], url: i < avatars.length ? avatars[i] : null, size: size - 4),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(width: Tokens.space2),
        Text('$total ${total == 1 ? 'member' : 'members'}', style: context.text.bodySmall),
      ],
    );
  }
}

/// Loading, error and data states for an [AsyncValue], with the same look everywhere.
/// While loading it shows [loading], placeholder cards unless given a shape that fits the content.
class AsyncBody<T> extends StatelessWidget {
  const AsyncBody({super.key, required this.value, required this.data, this.onRetry, this.loading});
  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final VoidCallback? onRetry;
  final Widget? loading;

  @override
  Widget build(BuildContext context) {
    if (value.hasValue) return data(value.requireValue);
    if (value.hasError) {
      return EmptyState(
        icon: Icons.cloud_off_rounded,
        title: 'Couldn’t load this',
        message: value.error is BackendException ? value.error.toString() : 'Check your connection and try again.',
        action: onRetry == null ? null : OutlinedButton(onPressed: onRetry, child: const Text('Try again')),
      );
    }
    return loading ?? const SkeletonCards();
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, this.message, this.action});
  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Tokens.space8, vertical: Tokens.space8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(color: context.colors.primaryContainer, shape: BoxShape.circle),
              child: Icon(icon, size: 30, color: context.colors.onPrimaryContainer),
            ),
            const SizedBox(height: Tokens.space4),
            Text(title, style: context.text.titleMedium, textAlign: TextAlign.center),
            if (message != null) ...[
              const SizedBox(height: Tokens.space2),
              Text(
                message!,
                style: context.text.bodyMedium?.copyWith(color: context.ci.muted),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[const SizedBox(height: Tokens.space5), action!],
          ],
        ),
      ),
    );
  }
}

/// Small uppercase label above a group of content, with an optional action on the right.
class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key, this.action, this.onAction});
  final String text;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(Tokens.space1, Tokens.space6, 0, Tokens.space2),
      child: Row(
        children: [
          Expanded(child: Text(text.toUpperCase(), style: context.text.labelSmall)),
          if (action != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(visualDensity: VisualDensity.compact, textStyle: context.text.labelMedium),
              child: Text(action!),
            ),
        ],
      ),
    );
  }
}

class Pill extends StatelessWidget {
  const Pill(this.label, {super.key, this.color, this.icon});
  final String label;
  final Color? color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = color ?? context.colors.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 13, color: c), const SizedBox(width: 4)],
          Text(label, style: context.text.labelMedium?.copyWith(color: c, fontSize: 12)),
        ],
      ),
    );
  }
}

/// A white rounded panel with a hairline border. Tappable panels sink a little while pressed.
class Panel extends StatefulWidget {
  const Panel({super.key, required this.child, this.padding = const EdgeInsets.all(Tokens.space4), this.onTap});
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  State<Panel> createState() => _PanelState();
}

class _PanelState extends State<Panel> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _pressed ? 0.98 : 1,
      duration: const Duration(milliseconds: 140),
      curve: Curves.easeOutCubic,
      child: Card(
        child: InkWell(
          onTap: widget.onTap,
          onHighlightChanged: widget.onTap == null ? null : (v) => setState(() => _pressed = v),
          child: Padding(padding: widget.padding, child: widget.child),
        ),
      ),
    );
  }
}

void showToast(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

/// Runs a write, shows its error if it fails, and returns whether it worked.
Future<bool> runAction(BuildContext context, Future<void> Function() action, {String? done}) async {
  try {
    await action();
    if (done != null && context.mounted) showToast(context, done);
    return true;
  } on BackendException catch (e) {
    if (context.mounted) showToast(context, e.message);
  } catch (_) {
    if (context.mounted) showToast(context, 'Something went wrong. Try again.');
  }
  return false;
}

Future<bool> confirm(
  BuildContext context, {
  required String title,
  String? message,
  required String action,
  bool destructive = false,
}) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (c) => AlertDialog(
      title: Text(title),
      content: message == null ? null : Text(message),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
        TextButton(
          onPressed: () => Navigator.pop(c, true),
          style: destructive ? TextButton.styleFrom(foregroundColor: Tokens.danger) : null,
          child: Text(action),
        ),
      ],
    ),
  );
  return ok ?? false;
}

/// A text box with a send button, for comments.
class Composer extends StatefulWidget {
  const Composer({super.key, required this.hint, required this.onSend});
  final String hint;
  final Future<bool> Function(String text) onSend;

  @override
  State<Composer> createState() => _ComposerState();
}

class _ComposerState extends State<Composer> {
  final _c = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _c.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    final ok = await widget.onSend(text);
    if (!mounted) return;
    setState(() => _sending = false);
    if (ok) _c.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: TextField(
            controller: _c,
            minLines: 1,
            maxLines: 5,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(hintText: widget.hint),
            onSubmitted: (_) => _send(),
          ),
        ),
        const SizedBox(width: Tokens.space2),
        IconButton.filled(
          tooltip: 'Send',
          onPressed: _sending ? null : _send,
          icon: _sending
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.arrow_upward_rounded),
        ),
      ],
    );
  }
}

/// A comment with its author, time, and a menu for the author.
class CommentTile extends StatelessWidget {
  const CommentTile({super.key, required this.comment, this.textColor, this.onDelete});
  final Comment comment;
  final Color? textColor;
  final VoidCallback? onDelete;

  /// Written offline and not sent yet (the backend gives these a `pending-` id).
  bool get _pending => comment.id.startsWith('pending-');

  @override
  Widget build(BuildContext context) {
    final color = textColor ?? context.colors.onSurface;
    final onDelete = _pending ? null : this.onDelete;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Tokens.space3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Avatar(name: comment.author.displayName, url: comment.author.avatarUrl, size: 34),
          const SizedBox(width: Tokens.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        comment.author.displayName,
                        style: context.text.titleSmall?.copyWith(color: color),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: Tokens.space2),
                    if (_pending) ...[
                      Icon(Icons.schedule_rounded, size: 13, color: color.withValues(alpha: 0.55)),
                      const SizedBox(width: 3),
                    ],
                    Text(
                      _pending ? 'Waiting to send' : timeAgo(comment.createdAt, DateTime.now()),
                      style: context.text.bodySmall?.copyWith(color: color.withValues(alpha: 0.55)),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(comment.content, style: context.text.bodyMedium?.copyWith(color: color)),
              ],
            ),
          ),
          if (onDelete != null)
            IconButton(
              tooltip: 'Delete',
              visualDensity: VisualDensity.compact,
              onPressed: onDelete,
              icon: Icon(Icons.more_horiz_rounded, color: color.withValues(alpha: 0.5), size: 20),
            ),
        ],
      ),
    );
  }
}
