import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../app/providers.dart';
import '../app/reader_settings.dart';
import '../app/theme.dart';
import '../domain/scripture.dart';
import 'common.dart';

/// Flowing scripture text with small verse numbers, a heading at each new chapter, and
/// tap-to-select verses that can be copied or shared.
class ScriptureView extends ConsumerStatefulWidget {
  const ScriptureView({super.key, required this.verses, required this.palette, this.showFirstHeading = true});
  final List<Verse> verses;
  final ReaderPalette palette;
  final bool showFirstHeading;

  @override
  ConsumerState<ScriptureView> createState() => _ScriptureViewState();
}

class _ScriptureViewState extends ConsumerState<ScriptureView> {
  final _selected = <Verse>{};
  final _recognizers = <TapGestureRecognizer>[];

  @override
  void didUpdateWidget(ScriptureView old) {
    super.didUpdateWidget(old);
    if (old.verses != widget.verses) _selected.clear();
  }

  @override
  void dispose() {
    for (final r in _recognizers) {
      r.dispose();
    }
    super.dispose();
  }

  void _toggle(Verse v) {
    setState(() => _selected.contains(v) ? _selected.remove(v) : _selected.add(v));
  }

  String _selectionText(String translation) {
    final verses = widget.verses.where(_selected.contains).toList();
    if (verses.isEmpty) return '';
    final first = verses.first, last = verses.last;
    final ref = first.chapter == last.chapter && first.book == last.book
        ? (first.number == last.number
              ? '${first.book} ${first.chapter}:${first.number}'
              : '${first.book} ${first.chapter}:${first.number}-${last.number}')
        : '${first.book} ${first.chapter}:${first.number} – ${last.book} ${last.chapter}:${last.number}';
    return '“${verses.map((v) => v.text).join(' ')}”\n— $ref ($translation)';
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(readerSettingsProvider);
    final translation = ref.watch(translationProvider);
    final p = widget.palette;
    for (final r in _recognizers) {
      r.dispose();
    }
    _recognizers.clear();

    final body = TextStyle(
      fontFamily: settings.serif ? Tokens.serif : Tokens.sans,
      fontSize: settings.fontSize,
      height: settings.lineHeight,
      color: p.text,
    );
    final number = TextStyle(
      fontFamily: Tokens.sans,
      fontSize: settings.fontSize * 0.58,
      fontWeight: FontWeight.w700,
      color: p.verseNumber,
    );

    // One paragraph per chapter, so a heading can sit between them.
    final blocks = <Widget>[];
    var spans = <InlineSpan>[];
    String? book;
    int? chapter;
    void flush() {
      if (spans.isNotEmpty) blocks.add(Text.rich(TextSpan(children: spans), style: body));
      spans = [];
    }

    for (final v in widget.verses) {
      if (v.book != book || v.chapter != chapter) {
        flush();
        if (book != null || widget.showFirstHeading) {
          blocks.add(
            Padding(
              padding: EdgeInsets.only(top: blocks.isEmpty ? 0 : Tokens.space6, bottom: Tokens.space3),
              child: Text(
                '${v.book} ${v.chapter}',
                style: context.displayText(size: settings.fontSize + 5, color: p.text),
              ),
            ),
          );
        }
        book = v.book;
        chapter = v.chapter;
      }
      final r = TapGestureRecognizer()..onTap = () => _toggle(v);
      _recognizers.add(r);
      final selected = _selected.contains(v);
      spans.add(
        TextSpan(
          recognizer: r,
          style: selected
              ? TextStyle(
                  backgroundColor: p.highlight,
                  decoration: TextDecoration.underline,
                  decorationStyle: TextDecorationStyle.dotted,
                  decorationColor: p.verseNumber,
                )
              : null,
          children: [
            WidgetSpan(
              alignment: PlaceholderAlignment.top,
              child: Padding(
                padding: const EdgeInsets.only(right: 3),
                child: Text('${v.number}', style: number),
              ),
            ),
            TextSpan(text: '${v.text} '),
          ],
        ),
      );
    }
    flush();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...blocks,
        AnimatedSize(
          duration: const Duration(milliseconds: 180),
          child: _selected.isEmpty
              ? const SizedBox(width: double.infinity)
              : Padding(
                  padding: const EdgeInsets.only(top: Tokens.space4),
                  child: Wrap(
                    spacing: Tokens.space2,
                    runSpacing: Tokens.space2,
                    children: [
                      ActionChip(
                        avatar: const Icon(Icons.copy_rounded, size: 16),
                        label: const Text('Copy'),
                        onPressed: () async {
                          await Clipboard.setData(ClipboardData(text: _selectionText(translation)));
                          if (!context.mounted) return;
                          setState(_selected.clear);
                          showToast(context, 'Copied');
                        },
                      ),
                      ActionChip(
                        avatar: const Icon(Icons.ios_share_rounded, size: 16),
                        label: const Text('Share'),
                        onPressed: () => SharePlus.instance.share(ShareParams(text: _selectionText(translation))),
                      ),
                      ActionChip(label: const Text('Clear'), onPressed: () => setState(_selected.clear)),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

/// The "Aa" sheet: text size, typeface, page color, line spacing.
Future<void> showReaderSettings(BuildContext context) =>
    showModalBottomSheet(context: context, builder: (_) => const _ReaderSettingsSheet());

class _ReaderSettingsSheet extends ConsumerWidget {
  const _ReaderSettingsSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(readerSettingsProvider);
    final n = ref.read(readerSettingsProvider.notifier);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(Tokens.space5, 0, Tokens.space5, Tokens.space5),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Reading', style: context.text.titleLarge),
            const SizedBox(height: Tokens.space4),
            Row(
              children: [
                Text(
                  'A',
                  style: TextStyle(fontFamily: Tokens.serif, fontSize: 15, color: context.colors.onSurface),
                ),
                Expanded(
                  child: Slider(
                    value: s.fontSize,
                    min: 14,
                    max: 30,
                    divisions: 8,
                    label: '${s.fontSize.round()}',
                    onChanged: (v) => n.update(s.copyWith(fontSize: v)),
                  ),
                ),
                Text(
                  'A',
                  style: TextStyle(fontFamily: Tokens.serif, fontSize: 26, color: context.colors.onSurface),
                ),
              ],
            ),
            const SizedBox(height: Tokens.space2),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(
                  value: true,
                  label: Text('Serif', style: TextStyle(fontFamily: Tokens.serif)),
                ),
                ButtonSegment(value: false, label: Text('Sans')),
              ],
              selected: {s.serif},
              showSelectedIcon: false,
              onSelectionChanged: (v) => n.update(s.copyWith(serif: v.first)),
            ),
            const SizedBox(height: Tokens.space4),
            Row(
              children: [
                for (final t in ReaderTheme.values)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: _ThemeSwatch(
                        theme: t,
                        selected: s.theme == t,
                        onTap: () => n.update(s.copyWith(theme: t)),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: Tokens.space4),
            Row(
              children: [
                Text('Line spacing', style: context.text.bodyMedium),
                const Spacer(),
                SegmentedButton<double>(
                  segments: const [
                    ButtonSegment(value: 1.5, icon: Icon(Icons.density_small_rounded, size: 18)),
                    ButtonSegment(value: 1.75, icon: Icon(Icons.density_medium_rounded, size: 18)),
                    ButtonSegment(value: 2.0, icon: Icon(Icons.density_large_rounded, size: 18)),
                  ],
                  selected: {s.lineHeight},
                  showSelectedIcon: false,
                  onSelectionChanged: (v) => n.update(s.copyWith(lineHeight: v.first)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ThemeSwatch extends StatelessWidget {
  const _ThemeSwatch({required this.theme, required this.selected, required this.onTap});
  final ReaderTheme theme;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final p = theme == ReaderTheme.auto ? null : ReaderSettings(theme: theme).palette(Brightness.light);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Tokens.radiusS),
      child: Container(
        height: 56,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(Tokens.radiusS),
          gradient: p == null
              ? const LinearGradient(colors: [Color(0xFFFCFAF5), Color(0xFFFCFAF5), Tokens.night, Tokens.night], stops: [0, .5, .5, 1])
              : null,
          color: p?.background,
          border: Border.all(color: selected ? context.colors.primary : context.ci.line, width: selected ? 2 : 1),
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: p == null ? BoxDecoration(color: context.colors.surface, borderRadius: BorderRadius.circular(6)) : null,
          child: Text(theme.label, style: context.text.labelMedium?.copyWith(color: p?.text ?? context.colors.onSurface)),
        ),
      ),
    );
  }
}

/// Lets the member pick a translation; saved to their profile so the web uses it too.
Future<void> showTranslationPicker(BuildContext context, WidgetRef ref) async {
  final current = ref.read(translationProvider);
  final picked = await showModalBottomSheet<String>(
    context: context,
    builder: (c) => SafeArea(
      child: ListView(
        shrinkWrap: true,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Tokens.space5, 0, Tokens.space5, Tokens.space2),
            child: Text('Translation', style: c.text.titleLarge),
          ),
          for (final e in translations.entries)
            ListTile(
              leading: SizedBox(
                width: 48,
                child: Text(e.key, style: c.text.titleSmall?.copyWith(color: c.colors.primary)),
              ),
              title: Text(e.value),
              trailing: e.key == current ? Icon(Icons.check_rounded, color: c.colors.primary) : null,
              onTap: () => Navigator.pop(c, e.key),
            ),
        ],
      ),
    ),
  );
  if (picked == null || picked == current || !context.mounted) return;
  final ok = await runAction(context, () => ref.read(backendProvider).updateProfile({'preferred_translation': picked}));
  if (ok) ref.invalidate(profileProvider);
}

/// The translation chip and "Aa" button that sit in a reader's app bar.
class ReaderActions extends ConsumerWidget {
  const ReaderActions({super.key, required this.color});
  final Color color;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(translationProvider);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        TextButton(
          onPressed: () => showTranslationPicker(context, ref),
          style: TextButton.styleFrom(foregroundColor: color, visualDensity: VisualDensity.compact),
          child: Text(t),
        ),
        IconButton(
          tooltip: 'Reading settings',
          onPressed: () => showReaderSettings(context),
          icon: Text(
            'Aa',
            style: TextStyle(fontFamily: Tokens.serif, fontSize: 18, fontWeight: FontWeight.w600, color: color),
          ),
        ),
      ],
    );
  }
}
