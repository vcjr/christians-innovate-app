import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../app/providers.dart';
import '../app/theme.dart';
import 'common.dart';

/// Chips you can add to and remove, for skills and interests.
class TagEditor extends StatefulWidget {
  const TagEditor({super.key, required this.tags, required this.onChanged, required this.hint, this.suggestions = const []});
  final List<String> tags;
  final ValueChanged<List<String>> onChanged;
  final String hint;
  final List<String> suggestions;

  @override
  State<TagEditor> createState() => _TagEditorState();
}

class _TagEditorState extends State<TagEditor> {
  final _c = TextEditingController();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  void _add(String raw) {
    final tag = raw.trim();
    _c.clear();
    if (tag.isEmpty || widget.tags.any((t) => t.toLowerCase() == tag.toLowerCase())) return;
    widget.onChanged([...widget.tags, tag]);
  }

  @override
  Widget build(BuildContext context) {
    final unused = widget.suggestions.where((s) => !widget.tags.contains(s)).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _c,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(
            hintText: widget.hint,
            suffixIcon: IconButton(tooltip: 'Add', icon: const Icon(Icons.add_rounded), onPressed: () => _add(_c.text)),
          ),
          onSubmitted: _add,
        ),
        if (widget.tags.isNotEmpty) ...[
          const SizedBox(height: Tokens.space3),
          Wrap(
            spacing: Tokens.space2,
            runSpacing: Tokens.space2,
            children: [
              for (final t in widget.tags)
                InputChip(
                  label: Text(t),
                  onDeleted: () => widget.onChanged([...widget.tags]..remove(t)),
                  deleteIcon: const Icon(Icons.close_rounded, size: 16),
                ),
            ],
          ),
        ],
        if (unused.isNotEmpty) ...[
          const SizedBox(height: Tokens.space3),
          Text('Suggestions', style: context.text.labelSmall),
          const SizedBox(height: Tokens.space2),
          Wrap(
            spacing: Tokens.space2,
            runSpacing: Tokens.space2,
            children: [
              for (final s in unused) ActionChip(avatar: const Icon(Icons.add_rounded, size: 16), label: Text(s), onPressed: () => _add(s)),
            ],
          ),
        ],
      ],
    );
  }
}

/// A tappable avatar that uploads a new photo to the avatars bucket and reports its URL.
class PhotoPicker extends ConsumerStatefulWidget {
  const PhotoPicker({super.key, required this.name, required this.url, required this.onUploaded, this.size = 112});
  final String name;
  final String? url;
  final ValueChanged<String> onUploaded;
  final double size;

  @override
  ConsumerState<PhotoPicker> createState() => _PhotoPickerState();
}

class _PhotoPickerState extends ConsumerState<PhotoPicker> {
  bool _busy = false;

  Future<void> _pick() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 800, imageQuality: 85, requestFullMetadata: false);
    if (file == null || !mounted) return;
    setState(() => _busy = true);
    final ext = file.name.contains('.') ? file.name.split('.').last.toLowerCase() : 'jpg';
    String? url;
    final ok = await runAction(context, () async => url = await ref.read(backendProvider).uploadAvatar(await file.readAsBytes(), ext));
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) widget.onUploaded(url!);
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: GestureDetector(
        onTap: _busy ? null : _pick,
        child: Stack(
          children: [
            Avatar(name: widget.name, url: widget.url, size: widget.size),
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: context.colors.onSurface,
                  shape: BoxShape.circle,
                  border: Border.all(color: context.colors.surface, width: 3),
                ),
                child: _busy
                    ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: context.colors.surface))
                    : Icon(Icons.photo_camera_rounded, size: 16, color: context.colors.surface),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Adds https:// to a bare address like "example.com"; null when blank.
String? normalizeUrl(String raw) {
  final v = raw.trim();
  if (v.isEmpty) return null;
  return v.startsWith('http://') || v.startsWith('https://') ? v : 'https://$v';
}

String? urlError(String? raw) {
  final v = normalizeUrl(raw ?? '');
  if (v == null) return null;
  final uri = Uri.tryParse(v);
  return uri == null || !uri.hasAuthority || !uri.host.contains('.') ? 'Enter a full web address' : null;
}
