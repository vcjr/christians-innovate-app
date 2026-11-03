import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers.dart';
import 'theme.dart';

enum ReaderTheme {
  auto('Auto'),
  paper('Paper'),
  sepia('Sepia'),
  night('Night');

  const ReaderTheme(this.label);
  final String label;
}

/// Colors for the page behind scripture.
class ReaderPalette {
  const ReaderPalette({
    required this.background,
    required this.text,
    required this.verseNumber,
    required this.highlight,
    required this.dark,
  });
  final Color background;
  final Color text;
  final Color verseNumber;
  final Color highlight;
  final bool dark;

  static const paper = ReaderPalette(
    background: Color(0xFFFCFAF5),
    text: Color(0xFF1E1D1A),
    verseNumber: Tokens.blue,
    highlight: Color(0x33E2A43A),
    dark: false,
  );
  static const sepia = ReaderPalette(
    background: Color(0xFFF4EAD7),
    text: Color(0xFF3A2D1F),
    verseNumber: Color(0xFF9A5B1E),
    highlight: Color(0x40C98A2E),
    dark: false,
  );
  static const night = ReaderPalette(
    background: Tokens.night,
    text: Color(0xFFD9DCE2),
    verseNumber: Tokens.blueNight,
    highlight: Color(0x40F0BE62),
    dark: true,
  );
}

@immutable
class ReaderSettings {
  const ReaderSettings({this.fontSize = 19, this.serif = true, this.theme = ReaderTheme.auto, this.lineHeight = 1.75});

  final double fontSize;
  final bool serif;
  final ReaderTheme theme;
  final double lineHeight;

  ReaderPalette palette(Brightness platform) => switch (theme) {
    ReaderTheme.paper => ReaderPalette.paper,
    ReaderTheme.sepia => ReaderPalette.sepia,
    ReaderTheme.night => ReaderPalette.night,
    ReaderTheme.auto => platform == Brightness.dark ? ReaderPalette.night : ReaderPalette.paper,
  };

  ReaderSettings copyWith({double? fontSize, bool? serif, ReaderTheme? theme, double? lineHeight}) => ReaderSettings(
    fontSize: fontSize ?? this.fontSize,
    serif: serif ?? this.serif,
    theme: theme ?? this.theme,
    lineHeight: lineHeight ?? this.lineHeight,
  );
}

/// Reader preferences are per device, like a Kindle's.
class ReaderSettingsNotifier extends Notifier<ReaderSettings> {
  static const _size = 'reader.fontSize', _serif = 'reader.serif', _theme = 'reader.theme', _line = 'reader.lineHeight';

  @override
  ReaderSettings build() {
    final p = ref.watch(preferencesProvider);
    return ReaderSettings(
      fontSize: p.getDouble(_size) ?? 19,
      serif: p.getBool(_serif) ?? true,
      theme: ReaderTheme.values.asNameMap()[p.getString(_theme)] ?? ReaderTheme.auto,
      lineHeight: p.getDouble(_line) ?? 1.75,
    );
  }

  void update(ReaderSettings next) {
    state = next;
    final p = ref.read(preferencesProvider);
    p.setDouble(_size, next.fontSize);
    p.setBool(_serif, next.serif);
    p.setString(_theme, next.theme.name);
    p.setDouble(_line, next.lineHeight);
  }
}

/// Where the Bible tab was left, so it reopens there.
class BiblePlace {
  const BiblePlace(this.book, this.chapter);
  final String book;
  final int chapter;
}

final biblePlaceProvider = NotifierProvider<BiblePlaceNotifier, BiblePlace>(BiblePlaceNotifier.new);

class BiblePlaceNotifier extends Notifier<BiblePlace> {
  @override
  BiblePlace build() {
    final p = ref.watch(preferencesProvider);
    return BiblePlace(p.getString('bible.book') ?? 'John', p.getInt('bible.chapter') ?? 1);
  }

  void go(String book, int chapter) {
    state = BiblePlace(book, chapter);
    ref.read(preferencesProvider)
      ..setString('bible.book', book)
      ..setInt('bible.chapter', chapter);
  }
}
