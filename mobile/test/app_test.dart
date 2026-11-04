import 'package:ci_mobile/app/providers.dart';
import 'package:ci_mobile/domain/models.dart';
import 'package:ci_mobile/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'fake_backend.dart';

Future<void> pumpApp(WidgetTester tester, FakeBackend backend) async {
  tester.view.physicalSize = const Size(412 * 3, 892 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  await tester.pumpWidget(
    ProviderScope(
      retry: (_, _) => null,
      overrides: [backendProvider.overrideWithValue(backend), preferencesProvider.overrideWithValue(prefs)],
      child: const CiApp(),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('signing in lands on Today with the first unread day', (tester) async {
    final backend = FakeBackend(signedIn: false);
    await pumpApp(tester, backend);
    expect(find.text('Welcome back'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('email')), 'jordan@example.com');
    await tester.enterText(find.byKey(const Key('password')), 'wrong');
    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();
    expect(find.text('That email and password don’t match.'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('password')), 'right-password');
    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Jordan'), findsWidgets);
    expect(find.text('Genesis 2, Psalm 2'), findsOneWidget);
    expect(find.text('1/3'), findsOneWidget);
  });

  testWidgets('reading a day and marking it read', (tester) async {
    final backend = FakeBackend();
    await pumpApp(tester, backend);

    await tester.tap(find.byKey(const Key('start-reading')));
    await tester.pumpAndSettle();
    expect(find.text('Rest is part of the work.'), findsOneWidget);
    expect(find.text('Genesis 2'), findsOneWidget, reason: 'a heading per passage when the day lists several');
    expect(find.text('Psalms 2'), findsOneWidget);

    // Tapping a verse selects it and offers Copy and Share.
    await tester.tap(find.textContaining('First verse of Genesis 2', findRichText: true));
    await tester.pumpAndSettle();
    expect(find.text('Share'), findsOneWidget);
    await tester.tap(find.text('Clear'));
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(find.byKey(const Key('mark-read')), 300, scrollable: find.byType(Scrollable).last);

    // A quick tap only explains that it needs holding.
    await tester.tap(find.byKey(const Key('mark-read')));
    await tester.pumpAndSettle();
    expect(backend.calls, isNot(contains('setDayComplete d2 true')));
    expect(find.text('Press and hold to finish'), findsOneWidget);

    final hold = await tester.startGesture(tester.getCenter(find.byKey(const Key('mark-read'))));
    await tester.pump(const Duration(milliseconds: 150));
    await tester.pump(const Duration(milliseconds: 1000));
    await hold.up();
    await tester.pumpAndSettle();
    expect(backend.calls, contains('setDayComplete d2 true'));
    expect(find.text('Read today'), findsOneWidget);
    expect(find.byKey(const Key('up-next')), findsOneWidget, reason: 'the next day is offered once this one is read');
  });

  testWidgets('praying for a request on the wall', (tester) async {
    final backend = FakeBackend();
    await pumpApp(tester, backend);
    await tester.tap(find.text('Community'));
    await tester.pumpAndSettle();

    expect(find.text('Clinic permit'), findsOneWidget);
    await tester.tap(find.byKey(const Key('pray-p1')));
    await tester.pumpAndSettle();
    expect(backend.calls, contains('setPraying p1 true'));
    expect(find.text('Praying · 3'), findsOneWidget);
  });

  testWidgets('a live meeting shows on Today and can be hidden', (tester) async {
    final backend = FakeBackend()
      ..meeting = Meeting(
        id: 'm1',
        title: 'Monthly Gathering',
        description: 'Founders share what they’re building.',
        zoomLink: 'https://zoom.us/j/1',
        startsAt: DateTime.now().subtract(const Duration(minutes: 5)),
      );
    await pumpApp(tester, backend);
    expect(find.text('Monthly Gathering'), findsOneWidget);
    expect(find.text('HAPPENING NOW'), findsOneWidget);
    expect(find.text('Join now on Zoom'), findsOneWidget);

    await tester.tap(find.byTooltip('Hide this meeting'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('meeting-card')), findsNothing);
  });

  testWidgets('new members go through onboarding once', (tester) async {
    final backend = FakeBackend(onboarded: false);
    await pumpApp(tester, backend);
    expect(find.text('Welcome, Jordan'), findsOneWidget);

    for (var i = 0; i < 5; i++) {
      await tester.tap(find.byKey(const Key('onboarding-next')));
      await tester.pumpAndSettle();
    }
    expect(backend.calls.last, contains('has_completed_onboarding'));
    expect(find.text('Genesis 2, Psalm 2'), findsOneWidget);
  });
}
