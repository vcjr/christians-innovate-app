/// Scripture references and text, ported from the web app's utils/bible-api.ts and
/// utils/bible-text-parser.ts so both apps read the same passage for the same plan day.
library;

/// The translations imported into `bible_verses` (scripts/import-bible-translations.ts).
const translations = <String, String>{
  'KJV': 'King James Version',
  'NKJV': 'New King James Version',
  'ESV': 'English Standard Version',
  'NIV': 'New International Version',
  'NLT': 'New Living Translation',
  'NASB': 'New American Standard Bible',
  'MSG': 'The Message',
};

class BibleBook {
  const BibleBook(this.name, this.chapters, {required this.newTestament});
  final String name;
  final int chapters;
  final bool newTestament;
}

/// The 66 books with their chapter counts, named as the import script stores them.
const bibleBooks = <BibleBook>[
  BibleBook('Genesis', 50, newTestament: false),
  BibleBook('Exodus', 40, newTestament: false),
  BibleBook('Leviticus', 27, newTestament: false),
  BibleBook('Numbers', 36, newTestament: false),
  BibleBook('Deuteronomy', 34, newTestament: false),
  BibleBook('Joshua', 24, newTestament: false),
  BibleBook('Judges', 21, newTestament: false),
  BibleBook('Ruth', 4, newTestament: false),
  BibleBook('1 Samuel', 31, newTestament: false),
  BibleBook('2 Samuel', 24, newTestament: false),
  BibleBook('1 Kings', 22, newTestament: false),
  BibleBook('2 Kings', 25, newTestament: false),
  BibleBook('1 Chronicles', 29, newTestament: false),
  BibleBook('2 Chronicles', 36, newTestament: false),
  BibleBook('Ezra', 10, newTestament: false),
  BibleBook('Nehemiah', 13, newTestament: false),
  BibleBook('Esther', 10, newTestament: false),
  BibleBook('Job', 42, newTestament: false),
  BibleBook('Psalms', 150, newTestament: false),
  BibleBook('Proverbs', 31, newTestament: false),
  BibleBook('Ecclesiastes', 12, newTestament: false),
  BibleBook('Song of Solomon', 8, newTestament: false),
  BibleBook('Isaiah', 66, newTestament: false),
  BibleBook('Jeremiah', 52, newTestament: false),
  BibleBook('Lamentations', 5, newTestament: false),
  BibleBook('Ezekiel', 48, newTestament: false),
  BibleBook('Daniel', 12, newTestament: false),
  BibleBook('Hosea', 14, newTestament: false),
  BibleBook('Joel', 3, newTestament: false),
  BibleBook('Amos', 9, newTestament: false),
  BibleBook('Obadiah', 1, newTestament: false),
  BibleBook('Jonah', 4, newTestament: false),
  BibleBook('Micah', 7, newTestament: false),
  BibleBook('Nahum', 3, newTestament: false),
  BibleBook('Habakkuk', 3, newTestament: false),
  BibleBook('Zephaniah', 3, newTestament: false),
  BibleBook('Haggai', 2, newTestament: false),
  BibleBook('Zechariah', 14, newTestament: false),
  BibleBook('Malachi', 4, newTestament: false),
  BibleBook('Matthew', 28, newTestament: true),
  BibleBook('Mark', 16, newTestament: true),
  BibleBook('Luke', 24, newTestament: true),
  BibleBook('John', 21, newTestament: true),
  BibleBook('Acts', 28, newTestament: true),
  BibleBook('Romans', 16, newTestament: true),
  BibleBook('1 Corinthians', 16, newTestament: true),
  BibleBook('2 Corinthians', 13, newTestament: true),
  BibleBook('Galatians', 6, newTestament: true),
  BibleBook('Ephesians', 6, newTestament: true),
  BibleBook('Philippians', 4, newTestament: true),
  BibleBook('Colossians', 4, newTestament: true),
  BibleBook('1 Thessalonians', 5, newTestament: true),
  BibleBook('2 Thessalonians', 3, newTestament: true),
  BibleBook('1 Timothy', 6, newTestament: true),
  BibleBook('2 Timothy', 4, newTestament: true),
  BibleBook('Titus', 3, newTestament: true),
  BibleBook('Philemon', 1, newTestament: true),
  BibleBook('Hebrews', 13, newTestament: true),
  BibleBook('James', 5, newTestament: true),
  BibleBook('1 Peter', 5, newTestament: true),
  BibleBook('2 Peter', 3, newTestament: true),
  BibleBook('1 John', 5, newTestament: true),
  BibleBook('2 John', 1, newTestament: true),
  BibleBook('3 John', 1, newTestament: true),
  BibleBook('Jude', 1, newTestament: true),
  BibleBook('Revelation', 22, newTestament: true),
];

BibleBook? bookNamed(String name) {
  for (final b in bibleBooks) {
    if (b.name == name) return b;
  }
  return null;
}

/// One parsed reference: a verse, a verse range, a chapter, or a chapter range.
class Passage {
  const Passage({required this.book, required this.chapter, this.chapterEnd, this.verseStart, this.verseEnd});

  final String book;
  final int chapter;
  final int? chapterEnd;
  final int? verseStart;
  final int? verseEnd;

  @override
  bool operator ==(Object other) =>
      other is Passage &&
      other.book == book &&
      other.chapter == chapter &&
      other.chapterEnd == chapterEnd &&
      other.verseStart == verseStart &&
      other.verseEnd == verseEnd;

  @override
  int get hashCode => Object.hash(book, chapter, chapterEnd, verseStart, verseEnd);

  @override
  String toString() {
    if (chapterEnd != null) return '$book $chapter-$chapterEnd';
    if (verseStart == null) return '$book $chapter';
    return verseEnd == null ? '$book $chapter:$verseStart' : '$book $chapter:$verseStart-$verseEnd';
  }
}

const _bookExpansions = <String, String>{
  'Gen': 'Genesis',
  'Ex': 'Exodus',
  'Exod': 'Exodus',
  'Lev': 'Leviticus',
  'Num': 'Numbers',
  'Deut': 'Deuteronomy',
  'Deu': 'Deuteronomy',
  'Josh': 'Joshua',
  'Jos': 'Joshua',
  'Judg': 'Judges',
  'Jdg': 'Judges',
  'Sam': 'Samuel',
  '1 Sam': '1 Samuel',
  '2 Sam': '2 Samuel',
  '1 Kgs': '1 Kings',
  '2 Kgs': '2 Kings',
  '1 Chr': '1 Chronicles',
  '2 Chr': '2 Chronicles',
  'Neh': 'Nehemiah',
  'Est': 'Esther',
  'Esth': 'Esther',
  'Ps': 'Psalms',
  'Psalm': 'Psalms',
  'Prov': 'Proverbs',
  'Pro': 'Proverbs',
  'Eccl': 'Ecclesiastes',
  'Ecc': 'Ecclesiastes',
  'Song': 'Song of Solomon',
  'SOS': 'Song of Solomon',
  'Isa': 'Isaiah',
  'Jer': 'Jeremiah',
  'Lam': 'Lamentations',
  'Ezek': 'Ezekiel',
  'Eze': 'Ezekiel',
  'Dan': 'Daniel',
  'Hos': 'Hosea',
  'Obad': 'Obadiah',
  'Mic': 'Micah',
  'Nah': 'Nahum',
  'Hab': 'Habakkuk',
  'Zeph': 'Zephaniah',
  'Zep': 'Zephaniah',
  'Hag': 'Haggai',
  'Zech': 'Zechariah',
  'Zec': 'Zechariah',
  'Mal': 'Malachi',
  'Matt': 'Matthew',
  'Mat': 'Matthew',
  'Rom': 'Romans',
  '1 Cor': '1 Corinthians',
  '2 Cor': '2 Corinthians',
  'Gal': 'Galatians',
  'Eph': 'Ephesians',
  'Phil': 'Philippians',
  'Php': 'Philippians',
  'Col': 'Colossians',
  '1 Thess': '1 Thessalonians',
  '2 Thess': '2 Thessalonians',
  '1 Thes': '1 Thessalonians',
  '2 Thes': '2 Thessalonians',
  '1 Tim': '1 Timothy',
  '2 Tim': '2 Timothy',
  'Phlm': 'Philemon',
  'Phm': 'Philemon',
  'Heb': 'Hebrews',
  'Jas': 'James',
  '1 Pet': '1 Peter',
  '2 Pet': '2 Peter',
  '1 Jn': '1 John',
  '2 Jn': '2 John',
  '3 Jn': '3 John',
  'Rev': 'Revelation',
  'Apoc': 'Revelation',
};

const _singleChapterBooks = {'Obadiah', 'Philemon', '2 John', '3 John', 'Jude'};

String _normalizeBook(String raw) {
  final trimmed = raw.trim();
  return _bookExpansions[trimmed] ?? trimmed;
}

final _verseRef = RegExp(r'^([A-Za-z0-9\s]+)\s+(\d+):(\d+)(?:-(\d+))?$');
final _chapterRange = RegExp(r'^([A-Za-z0-9\s]+)\s+(\d+)\s*-\s*(\d+)$');
final _chapterOnly = RegExp(r'^([A-Za-z0-9\s]+)\s+(\d+)$');
final _bookOnly = RegExp(r'^([A-Za-z0-9\s]+)$');
final _compound = RegExp(r'(\d+)\s*&\s*(\d+)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)');

/// Parses one reference such as "John 3:16", "Genesis 1-4", "Psalm 8" or "Jude".
Passage? parseReference(String reference) {
  final ref = reference.replaceAll(RegExp('[–—−]'), '-').trim();
  var m = _verseRef.firstMatch(ref);
  if (m != null) {
    return Passage(
      book: _normalizeBook(m[1]!),
      chapter: int.parse(m[2]!),
      verseStart: int.parse(m[3]!),
      verseEnd: m[4] == null ? null : int.parse(m[4]!),
    );
  }
  m = _chapterRange.firstMatch(ref);
  if (m != null) {
    return Passage(book: _normalizeBook(m[1]!), chapter: int.parse(m[2]!), chapterEnd: int.parse(m[3]!));
  }
  m = _chapterOnly.firstMatch(ref);
  if (m != null) return Passage(book: _normalizeBook(m[1]!), chapter: int.parse(m[2]!));
  m = _bookOnly.firstMatch(ref);
  if (m != null) {
    final book = _normalizeBook(m[1]!);
    if (_singleChapterBooks.contains(book)) return Passage(book: book, chapter: 1);
  }
  return null;
}

/// Splits a plan day's reference ("Psalm 8, Proverbs 1", "2 & 3 John") into passages.
/// Parts that do not parse are skipped, as on the web.
List<Passage> parsePassages(String reference) {
  final expanded = reference.replaceAllMapped(_compound, (m) => '${m[1]} ${m[3]}, ${m[2]} ${m[3]}');
  return [
    for (final part in expanded.split(','))
      if (part.trim().isNotEmpty) ?parseReference(part),
  ];
}

class Verse {
  const Verse({required this.book, required this.chapter, required this.number, required this.text});
  final String book;
  final int chapter;
  final int number;
  final String text;
}

final _strongs = RegExp(r'<S>\d+</S>');
final _sup = RegExp(r'<sup>.*?</sup>');
final _anyTag = RegExp(r'</?[^>]+(>|$)');
final _tagsButBasic = RegExp(r'</?(?!br|i|b)[^>]+(>|$)');
final _gluedNumber = RegExp(r'([a-zA-Z])(\d{2,5})');
final _looseNumber = RegExp(r'\b\d{2,5}\b');
final _hebrewNote = RegExp(r'\s+[a-zA-Z\s]+:\s+(Heb\.|or,|that is,)[^.]*\.');
final _footnoteMark = RegExp(r'\[\d+\]');

/// Cleans raw verse text for display, translation by translation, as the web does.
String cleanVerseText(String text, String translation) {
  var t = text;
  switch (translation) {
    case 'KJV':
    case 'NKJV':
      t = t
          .replaceAll(_strongs, '')
          .replaceAll(_sup, '')
          .replaceAll(_anyTag, '')
          .replaceAllMapped(_gluedNumber, (m) => '${m[1]} ')
          .replaceAll(_looseNumber, '')
          .replaceAll(_hebrewNote, '');
    case 'ESV':
    case 'NIV':
      t = t.replaceAll(_footnoteMark, '').replaceAll(_sup, '').replaceAll(_tagsButBasic, '');
    case 'NLT':
      t = t.replaceAll('*', '').replaceAll(_sup, '').replaceAll(_tagsButBasic, '');
    case 'NASB':
    case 'MSG':
      t = t.replaceAll(_sup, '').replaceAll(_tagsButBasic, '');
    default:
      t = t.replaceAll(_strongs, '').replaceAll(_footnoteMark, '').replaceAll(_sup, '').replaceAll(_anyTag, '');
  }
  // The display has no rich text, so drop the basic tags the non-KJV branches keep.
  t = t.replaceAll(RegExp(r'<br\s*/?>'), ' ').replaceAll(RegExp(r'</?[ib]>'), '');
  return t.replaceAll(RegExp(r'\s+'), ' ').trim();
}
