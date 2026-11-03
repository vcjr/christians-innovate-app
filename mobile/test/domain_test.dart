import 'package:ci_mobile/domain/models.dart';
import 'package:ci_mobile/domain/progress.dart';
import 'package:ci_mobile/domain/scripture.dart';
import 'package:flutter_test/flutter_test.dart';

PlanDay day(int n, {DateTime? assigned, DateTime? doneAt}) =>
    PlanDay(id: 'd$n', planId: 'p', dayNumber: n, reference: 'Genesis $n', dateAssigned: assigned, completedAt: doneAt);

void main() {
  group('parseReference', () {
    test('verse, verse range, chapter, chapter range', () {
      expect(parseReference('John 3:16'), const Passage(book: 'John', chapter: 3, verseStart: 16));
      expect(parseReference('Genesis 1:1-3'), const Passage(book: 'Genesis', chapter: 1, verseStart: 1, verseEnd: 3));
      expect(parseReference('Psalm 23'), const Passage(book: 'Psalms', chapter: 23));
      expect(parseReference('Genesis 1 – 4'), const Passage(book: 'Genesis', chapter: 1, chapterEnd: 4));
    });

    test('expands abbreviations and numbered books', () {
      expect(parseReference('1 Cor 13'), const Passage(book: '1 Corinthians', chapter: 13));
      expect(parseReference('Matt 5:3-12'), const Passage(book: 'Matthew', chapter: 5, verseStart: 3, verseEnd: 12));
    });

    test('single-chapter books need no chapter', () {
      expect(parseReference('Jude'), const Passage(book: 'Jude', chapter: 1));
      expect(parseReference('Genesis'), isNull);
    });
  });

  test('parsePassages splits lists and "2 & 3 John" like the web', () {
    expect(parsePassages('Genesis 1-3, Psalm 1'), const [
      Passage(book: 'Genesis', chapter: 1, chapterEnd: 3),
      Passage(book: 'Psalms', chapter: 1),
    ]);
    expect(parsePassages('2 & 3 John'), const [Passage(book: '2 John', chapter: 1), Passage(book: '3 John', chapter: 1)]);
    expect(parsePassages('Nonsense!, John 1'), const [Passage(book: 'John', chapter: 1)]);
  });

  group('cleanVerseText', () {
    test('strips Strong’s numbers from KJV', () {
      expect(
        cleanVerseText('In the beginning<S>7225</S> God<S>430</S> created<S>1254</S> <S>853</S> the heaven<S>8064</S>.', 'KJV'),
        'In the beginning God created the heaven.',
      );
    });

    test('drops footnote markers and tags elsewhere', () {
      expect(cleanVerseText('For God so loved[1] the <i>world</i><sup>a</sup>', 'NIV'), 'For God so loved the world');
    });
  });

  test('bibleBooks has 66 books and 1,189 chapters', () {
    expect(bibleBooks, hasLength(66));
    expect(bibleBooks.fold(0, (n, b) => n + b.chapters), 1189);
  });

  group('todaysReading', () {
    final now = DateTime(2026, 11, 3, 9);

    test('prefers the day pinned to today', () {
      final days = [day(1, doneAt: now), day(2, assigned: DateTime(2026, 11, 3)), day(3)];
      expect(todaysReading(days, now)!.dayNumber, 2);
    });

    test('otherwise the first unread day, otherwise the last', () {
      expect(todaysReading([day(1, doneAt: now), day(2), day(3)], now)!.dayNumber, 2);
      expect(todaysReading([day(1, doneAt: now), day(2, doneAt: now)], now)!.dayNumber, 2);
      expect(todaysReading([], now), isNull);
    });
  });

  group('readingStreak', () {
    final now = DateTime(2026, 11, 3, 20);

    test('counts back from today', () {
      expect(readingStreak([DateTime(2026, 11, 3, 7), DateTime(2026, 11, 2, 22), DateTime(2026, 11, 1, 6)], now), 3);
    });

    test('still counts when today’s reading isn’t done yet', () {
      expect(readingStreak([DateTime(2026, 11, 2), DateTime(2026, 11, 1)], now), 2);
    });

    test('a missed day ends it, and two readings in a day count once', () {
      expect(readingStreak([DateTime(2026, 11, 3, 6), DateTime(2026, 11, 3, 9), DateTime(2026, 11, 1)], now), 1);
      expect(readingStreak([DateTime(2026, 10, 30)], now), 0);
    });

    test('crosses month ends', () {
      expect(readingStreak([DateTime(2026, 11, 1), DateTime(2026, 10, 31), DateTime(2026, 10, 30)], DateTime(2026, 11, 1, 12)), 3);
    });
  });

  test('weekOf runs Sunday to Saturday, across a month end', () {
    final week = weekOf(DateTime(2026, 11, 3, 20)); // a Tuesday
    expect(week.first, DateTime(2026, 11, 1));
    expect(week.last, DateTime(2026, 11, 7));
    expect(weekOf(DateTime(2026, 11, 1)).first, DateTime(2026, 11, 1), reason: 'a Sunday starts its own week');
    expect(weekOf(DateTime(2026, 10, 30)).first, DateTime(2026, 10, 25));
  });

  test('readingDays keeps one midnight per day', () {
    expect(readingDays([DateTime(2026, 11, 3, 6), DateTime(2026, 11, 3, 21), DateTime(2026, 11, 2, 8)]), {
      DateTime(2026, 11, 3),
      DateTime(2026, 11, 2),
    });
  });

  test('streak milestones', () {
    expect(
      [
        for (var d = 1; d < 400; d++)
          if (isStreakMilestone(d)) d,
      ],
      [3, 7, 14, 21, 30, 50, 100, 200, 365],
    );
    expect(isStreakMilestone(500), isTrue);
  });

  test('defaultCommitmentDue is the end of the coming Sunday', () {
    expect(defaultCommitmentDue(DateTime(2026, 11, 3, 10)), DateTime(2026, 11, 8, 23, 59, 59, 999)); // Tuesday
    expect(defaultCommitmentDue(DateTime(2026, 11, 8, 10)), DateTime(2026, 11, 8, 23, 59, 59, 999)); // Sunday
  });

  test('greetingFor and initialsOf', () {
    expect(greetingFor(DateTime(2026, 1, 1, 8), 'Jordan'), 'Good morning, Jordan');
    expect(greetingFor(DateTime(2026, 1, 1, 19), null), 'Good evening');
    expect(initialsOf('Maya Lin Chen'), 'MC');
    expect(initialsOf(''), '?');
  });

  test('timeAgo', () {
    final now = DateTime(2026, 11, 3, 12);
    expect(timeAgo(now.subtract(const Duration(seconds: 20)), now), 'Just now');
    expect(timeAgo(now.subtract(const Duration(hours: 3)), now), '3h');
    expect(timeAgo(DateTime(2026, 9, 14), now), 'Sep 14');
    expect(timeAgo(DateTime(2025, 9, 14), now), 'Sep 14, 2025');
  });
}
