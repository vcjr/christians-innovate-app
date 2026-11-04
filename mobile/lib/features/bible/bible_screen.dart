import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../app/reader_settings.dart';
import '../../app/theme.dart';
import '../../domain/scripture.dart';
import '../../widgets/common.dart';
import '../../widgets/reader_chrome.dart';
import '../../widgets/scripture.dart';

/// The whole Bible, a chapter at a time, in the member's translation.
class BibleScreen extends ConsumerStatefulWidget {
  const BibleScreen({super.key});

  @override
  ConsumerState<BibleScreen> createState() => _BibleScreenState();
}

class _BibleScreenState extends ConsumerState<BibleScreen> {
  final _scroll = ScrollController();

  /// Which way the last chapter change went, so the new page slides in from that side.
  int _direction = 0;

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _go(String book, int chapter, {int direction = 0}) {
    HapticFeedback.selectionClick();
    setState(() => _direction = direction);
    ref.read(biblePlaceProvider.notifier).go(book, chapter);
    ref.read(chromeHiddenProvider.notifier).set(false);
    if (_scroll.hasClients) _scroll.jumpTo(0);
  }

  void _onScrollDirection(ScrollDirection d) {
    final chrome = ref.read(chromeHiddenProvider.notifier);
    if (d == ScrollDirection.reverse) chrome.set(true);
    if (d == ScrollDirection.forward) chrome.set(false);
  }

  /// The chapter before or after, crossing into the neighbouring book at the edges.
  (String, int)? _step(BiblePlace at, int delta) {
    final i = bibleBooks.indexWhere((b) => b.name == at.book);
    if (i < 0) return null;
    final c = at.chapter + delta;
    if (c >= 1 && c <= bibleBooks[i].chapters) return (at.book, c);
    final j = i + delta;
    if (j < 0 || j >= bibleBooks.length) return null;
    return (bibleBooks[j].name, delta > 0 ? 1 : bibleBooks[j].chapters);
  }

  Future<void> _pick() async {
    final at = ref.read(biblePlaceProvider);
    final picked = await showModalBottomSheet<(String, int)>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => FractionallySizedBox(heightFactor: 0.92, child: _BookPicker(current: at)),
    );
    if (picked != null) _go(picked.$1, picked.$2);
  }

  @override
  Widget build(BuildContext context) {
    final at = ref.watch(biblePlaceProvider);
    final translation = ref.watch(translationProvider);
    final palette = ref.watch(readerSettingsProvider).palette(MediaQuery.platformBrightnessOf(context));
    final verses = ref.watch(chapterProvider((book: at.book, chapter: at.chapter, translation: translation)));
    final prev = _step(at, -1), next = _step(at, 1);
    final hidden = ref.watch(chromeHiddenProvider);
    void goPrev() {
      if (prev != null) _go(prev.$1, prev.$2, direction: -1);
    }

    void goNext() {
      if (next != null) _go(next.$1, next.$2, direction: 1);
    }

    return Theme(
      data: buildTheme(palette.dark ? Brightness.dark : Brightness.light),
      child: Builder(
        builder: (context) {
          return Scaffold(
            backgroundColor: palette.background,
            body: Stack(
              children: [
                // Swipe sideways for the next or previous chapter.
                GestureDetector(
                  onHorizontalDragEnd: (d) {
                    final v = d.primaryVelocity ?? 0;
                    if (v < -350) goNext();
                    if (v > 350) goPrev();
                  },
                  child: ReadingProgress(
                    color: palette.verseNumber,
                    onDirection: _onScrollDirection,
                    child: CustomScrollView(
                      controller: _scroll,
                      slivers: [
                        SliverAppBar(
                          floating: true,
                          snap: true,
                          backgroundColor: palette.background,
                          foregroundColor: palette.text,
                          scrolledUnderElevation: 0,
                          titleSpacing: Tokens.space2,
                          title: TextButton(
                            key: const Key('bible-picker'),
                            onPressed: _pick,
                            style: TextButton.styleFrom(foregroundColor: palette.text, textStyle: context.text.titleLarge),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [Text('${at.book} ${at.chapter}'), const SizedBox(width: 2), const Icon(Icons.expand_more_rounded)],
                            ),
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 280),
                            switchInCurve: Curves.easeOutCubic,
                            transitionBuilder: (child, a) => FadeTransition(
                              opacity: a,
                              child: SlideTransition(
                                position: Tween(begin: Offset(0.08 * _direction, 0), end: Offset.zero).animate(a),
                                child: child,
                              ),
                            ),
                            layoutBuilder: (current, previous) => Stack(alignment: Alignment.topCenter, children: [...previous, ?current]),
                            child: KeyedSubtree(
                              key: ValueKey('${at.book} ${at.chapter} $translation'),
                              child: AsyncBody(
                                value: verses,
                                onRetry: () => ref.invalidate(chapterProvider),
                                loading: const SkeletonLines(lines: 16, padding: EdgeInsets.fromLTRB(Tokens.space6, 90, Tokens.space6, 0)),
                                data: (v) => v.isEmpty
                                    ? EmptyState(
                                        icon: Icons.menu_book_outlined,
                                        title: '${at.book} ${at.chapter} isn’t available in $translation',
                                        message: 'Try another translation.',
                                      )
                                    : Padding(
                                        padding: const EdgeInsets.fromLTRB(Tokens.space6, Tokens.space2, Tokens.space6, 120),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.stretch,
                                          children: [
                                            Text(
                                              at.book.toUpperCase(),
                                              style: context.text.labelSmall?.copyWith(color: palette.text.withValues(alpha: 0.55)),
                                            ),
                                            Text('${at.chapter}', style: context.displayText(size: 56, color: palette.text)),
                                            const SizedBox(height: Tokens.space3),
                                            ScriptureView(verses: v, palette: palette, showFirstHeading: false),
                                            const SizedBox(height: Tokens.space6),
                                            Text(
                                              translations[translation] ?? translation,
                                              style: context.text.bodySmall?.copyWith(color: palette.text.withValues(alpha: 0.5)),
                                            ),
                                          ],
                                        ),
                                      ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Reader controls float over the page and tuck away while you read down.
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: Tokens.space4,
                  child: AnimatedSlide(
                    offset: hidden ? const Offset(0, 2) : Offset.zero,
                    duration: const Duration(milliseconds: 260),
                    curve: Curves.easeOutCubic,
                    child: Center(
                      child: FrostedBar(
                        background: palette.background,
                        border: palette.text.withValues(alpha: 0.08),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              tooltip: 'Previous chapter',
                              onPressed: prev == null ? null : goPrev,
                              color: palette.text,
                              icon: const Icon(Icons.chevron_left_rounded, size: 28),
                            ),
                            ReaderActions(color: palette.text),
                            IconButton(
                              tooltip: 'Next chapter',
                              onPressed: next == null ? null : goNext,
                              color: palette.text,
                              icon: const Icon(Icons.chevron_right_rounded, size: 28),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _BookPicker extends StatefulWidget {
  const _BookPicker({required this.current});
  final BiblePlace current;

  @override
  State<_BookPicker> createState() => _BookPickerState();
}

class _BookPickerState extends State<_BookPicker> {
  late String? _open = widget.current.book;
  late bool _newTestament = bookNamed(widget.current.book)?.newTestament ?? true;

  @override
  Widget build(BuildContext context) {
    final books = bibleBooks.where((b) => b.newTestament == _newTestament).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(Tokens.space5, 0, Tokens.space5, Tokens.space3),
          child: SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: false, label: Text('Old Testament')),
              ButtonSegment(value: true, label: Text('New Testament')),
            ],
            selected: {_newTestament},
            showSelectedIcon: false,
            onSelectionChanged: (v) => setState(() => _newTestament = v.first),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: books.length,
            itemBuilder: (context, i) {
              final b = books[i];
              final open = _open == b.name;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ListTile(
                    title: Text(b.name, style: context.text.bodyLarge?.copyWith(fontWeight: open ? FontWeight.w700 : FontWeight.w500)),
                    trailing: Icon(open ? Icons.expand_less_rounded : Icons.expand_more_rounded),
                    onTap: () => b.chapters == 1 ? Navigator.pop(context, (b.name, 1)) : setState(() => _open = open ? null : b.name),
                  ),
                  if (open && b.chapters > 1)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(Tokens.space4, 0, Tokens.space4, Tokens.space4),
                      child: GridView.count(
                        crossAxisCount: 6,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: Tokens.space2,
                        crossAxisSpacing: Tokens.space2,
                        children: [
                          for (var c = 1; c <= b.chapters; c++)
                            _ChapterCell(
                              chapter: c,
                              current: widget.current.book == b.name && widget.current.chapter == c,
                              onTap: () => Navigator.pop(context, (b.name, c)),
                            ),
                        ],
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ChapterCell extends StatelessWidget {
  const _ChapterCell({required this.chapter, required this.current, required this.onTap});
  final int chapter;
  final bool current;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: current ? context.colors.primary : context.colors.surfaceContainer,
      borderRadius: BorderRadius.circular(Tokens.radiusS),
      child: InkWell(
        borderRadius: BorderRadius.circular(Tokens.radiusS),
        onTap: onTap,
        child: Center(
          child: Text('$chapter', style: context.text.labelLarge?.copyWith(color: current ? context.colors.onPrimary : null)),
        ),
      ),
    );
  }
}
