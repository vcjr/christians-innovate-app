// Walks the app through losing and regaining its connection against a seeded local Supabase.
// The network is cut for real: the test writes "down" or "up" to NET_FILE and waits for a
// helper script to stop or start the Supabase gateway and echo the state to NET_FILE.ack.
//
//   PHASE=warm: sign in, use the app online, download ESV, go offline, pray and comment,
//               read a chapter from the download, come back online and check it all synced.
//   PHASE=cold: start the app with the gateway already down; it should open signed in on
//               saved content.
import 'dart:io';
import 'dart:ui' as ui;

import 'package:ci_mobile/main.dart' as app;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

const _email = String.fromEnvironment('TEST_EMAIL');
const _password = String.fromEnvironment('TEST_PASSWORD');
const _dir = String.fromEnvironment('SHOTS_DIR', defaultValue: '/tmp/ci-shots');
const _phase = String.fromEnvironment('PHASE', defaultValue: 'warm');
const _net = String.fromEnvironment('NET_FILE', defaultValue: '/tmp/ci-net');

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Future<void> settle(WidgetTester tester, [int seconds = 2]) async {
    for (var i = 0; i < seconds * 10; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
  }

  Future<void> shot(WidgetTester tester, String name) async {
    await settle(tester);
    final view = binding.renderViews.first;
    await tester.runAsync(() async {
      final image = await (view.debugLayer! as OffsetLayer).toImage(view.paintBounds);
      final png = await image.toByteData(format: ui.ImageByteFormat.png);
      File('$_dir/$name.png')
        ..createSync(recursive: true)
        ..writeAsBytesSync(png!.buffer.asUint8List());
    });
  }

  Future<void> network(WidgetTester tester, String state) async {
    File(_net).writeAsStringSync(state);
    for (var i = 0; i < 600; i++) {
      final ack = File('$_net.ack');
      if (ack.existsSync() && ack.readAsStringSync().trim() == state) return;
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 100)));
    }
    fail('the helper never turned the network $state');
  }

  /// Pumps until [finder] shows up, for things that wait on the network or a timer.
  Future<void> waitFor(WidgetTester tester, Finder finder, {int seconds = 60}) async {
    for (var i = 0; i < seconds * 10; i++) {
      if (finder.evaluate().isNotEmpty) return;
      await tester.pump(const Duration(milliseconds: 100));
      if (i % 10 == 0) await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
    }
    fail('timed out waiting for $finder');
  }

  Finder tab(String label) => find.descendant(of: find.byType(NavigationBar), matching: find.text(label));
  Finder prayButton() => find.byWidgetPredicate((w) => w.key is ValueKey<String> && (w.key! as ValueKey<String>).value.startsWith('pray-'));
  final banner = find.byKey(const Key('offline-banner'));

  Future<void> back(WidgetTester tester) async {
    await tester.binding.handlePopRoute();
    await settle(tester, 1);
  }

  Future<void> openObadiah(WidgetTester tester) async {
    await tester.tap(tab('Bible'));
    await settle(tester, 2);
    await tester.tap(find.byKey(const Key('bible-picker')));
    await settle(tester, 1);
    await tester.tap(find.text('Old Testament'));
    await settle(tester, 1);
    await tester.scrollUntilVisible(find.text('Obadiah'), 300, scrollable: find.byType(Scrollable).hitTestable().last);
    await tester.tap(find.text('Obadiah'));
    await settle(tester, 2);
  }

  if (_phase == 'cold') {
    testWidgets('opens offline, signed in, on saved content', (tester) async {
      await app.main();
      await settle(tester, 3);
      await waitFor(tester, banner);
      expect(find.text('Welcome back'), findsNothing, reason: 'still signed in');
      expect(find.textContaining('Good '), findsOneWidget);
      final started = DateTime.now();
      await waitFor(
        tester,
        find.byWidgetPredicate((w) => w.key == const Key('start-reading') || (w is Text && w.data == 'Done for today')),
      );
      debugPrint('[plan card after ${DateTime.now().difference(started).inMilliseconds} ms]');
      await shot(tester, 'off-5-cold-start');
      await openObadiah(tester);
      expect(find.textContaining('The vision of Obadiah'), findsOneWidget);
      await shot(tester, 'off-6-cold-bible');
    });
    return;
  }

  testWidgets('offline and back', (tester) async {
    await network(tester, 'up');
    await app.main();
    await settle(tester, 3);
    if (find.text('Welcome back').evaluate().isNotEmpty) {
      await tester.enterText(find.byKey(const Key('email')), _email);
      await tester.enterText(find.byKey(const Key('password')), _password);
      await tester.tap(find.text('Sign in'));
      await settle(tester, 4);
    }

    // Online: visit the screens so they're saved, and download ESV.
    await settle(tester, 3);
    await tester.tap(
      find.byKey(const Key('start-reading')).evaluate().isEmpty ? find.text('Read again') : find.byKey(const Key('start-reading')),
    );
    await settle(tester, 3);
    await back(tester);
    await tester.tap(tab('Community'));
    await settle(tester, 3);
    await tester.tap(tab('Me'));
    await settle(tester, 2);
    await tester.tap(find.text('Settings').first);
    await settle(tester, 2);
    await tester.scrollUntilVisible(
      find.byWidgetPredicate((w) => w.key == const Key('download-ESV') || w.key == const Key('remove-ESV')),
      200,
      scrollable: find.byType(Scrollable).hitTestable().last,
    );
    if (find.byKey(const Key('download-ESV')).evaluate().isNotEmpty) {
      await tester.tap(find.byKey(const Key('download-ESV')));
      await waitFor(tester, find.byKey(const Key('remove-ESV')), seconds: 120);
    }
    await shot(tester, 'off-0-downloaded');
    await back(tester);

    // Offline.
    await network(tester, 'down');
    await tester.tap(tab('Community'));
    await settle(tester, 1);
    final pray = prayButton().first;
    final wasPraying = find.descendant(of: pray, matching: find.textContaining('Praying')).evaluate().isNotEmpty;
    await tester.tap(pray);
    await waitFor(tester, banner, seconds: 40);
    await shot(tester, 'off-1-prayed-offline');

    await tester.tap(tab('Today'));
    await settle(tester, 1);
    await tester.tap(
      find.byKey(const Key('start-reading')).evaluate().isEmpty ? find.text('Read again') : find.byKey(const Key('start-reading')),
    );
    await settle(tester, 2);
    await tester.scrollUntilVisible(find.text('Share a thought'), 600, scrollable: find.byType(Scrollable).hitTestable().last);
    await tester.enterText(find.widgetWithText(TextField, 'Share a thought'), 'Offline test comment');
    await tester.tap(find.byTooltip('Send'));
    await waitFor(tester, find.text('Waiting to send'));
    await tester.scrollUntilVisible(find.text('Offline test comment'), 200, scrollable: find.byType(Scrollable).hitTestable().last);
    await shot(tester, 'off-2-comment-waiting');
    await back(tester);

    await openObadiah(tester);
    expect(find.textContaining('The vision of Obadiah'), findsOneWidget, reason: 'read from the downloaded ESV');
    await shot(tester, 'off-3-bible-offline');

    // Back online: the probe notices, the queue goes out and the screens reload.
    await network(tester, 'up');
    for (var i = 0; i < 600 && banner.evaluate().isNotEmpty; i++) {
      await tester.pump(const Duration(milliseconds: 100));
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
    }
    expect(banner, findsNothing, reason: 'synced and back online');
    await tester.tap(tab('Today'));
    await settle(tester, 2);
    await tester.tap(
      find.byKey(const Key('start-reading')).evaluate().isEmpty ? find.text('Read again') : find.byKey(const Key('start-reading')),
    );
    await settle(tester, 3);
    await tester.scrollUntilVisible(find.text('Offline test comment'), 600, scrollable: find.byType(Scrollable).hitTestable().last);
    expect(find.text('Waiting to send'), findsNothing, reason: 'the comment reached the server');
    await shot(tester, 'off-4-synced');
    await back(tester);

    // Put the praying state back how it was.
    await tester.tap(tab('Community'));
    await settle(tester, 2);
    final nowPraying = find.descendant(of: prayButton().first, matching: find.textContaining('Praying')).evaluate().isNotEmpty;
    expect(nowPraying, !wasPraying, reason: 'the offline tap synced');
    await tester.tap(prayButton().first);
    await settle(tester, 2);
  });
}
