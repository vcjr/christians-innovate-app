// Walks the real app against a seeded local Supabase and saves a screenshot of each screen.
//
//   flutter test integration_test -d linux --dart-define-from-file=env/dev.json \
//     --dart-define=TEST_EMAIL=... --dart-define=TEST_PASSWORD=... --dart-define=SHOTS_DIR=/tmp/shots
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

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Future<void> settle(WidgetTester tester, [int seconds = 2]) async {
    for (var i = 0; i < seconds * 10; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
  }

  /// Saves the current frame; [wait] first lets animations finish, which a mid-animation shot skips.
  Future<void> shot(WidgetTester tester, String name, {bool wait = true}) async {
    if (wait) await settle(tester);
    final view = binding.renderViews.first;
    await tester.runAsync(() async {
      final image = await (view.debugLayer! as OffsetLayer).toImage(view.paintBounds);
      final png = await image.toByteData(format: ui.ImageByteFormat.png);
      File('$_dir/$name.png')
        ..createSync(recursive: true)
        ..writeAsBytesSync(png!.buffer.asUint8List());
    });
  }

  Finder tab(String label) => find.descendant(of: find.byType(NavigationBar), matching: find.text(label));

  Future<void> back(WidgetTester tester) async {
    await tester.binding.handlePopRoute(); // the system back gesture; the app bar may have scrolled away
    await settle(tester, 1);
  }

  testWidgets('screens', (tester) async {
    await app.main();
    await settle(tester, 3);

    if (find.text('Welcome back').evaluate().isEmpty) {
      await tester.tap(tab('Me'));
      await settle(tester);
      await tester.tap(find.text('Sign out'));
      await settle(tester, 1);
      await tester.tap(find.text('Sign out').last);
      await settle(tester);
    }
    await shot(tester, '01-sign-in');
    await tester.enterText(find.byKey(const Key('email')), _email);
    await tester.enterText(find.byKey(const Key('password')), _password);
    await tester.tap(find.text('Sign in'));
    await settle(tester, 4);
    await shot(tester, '02-today');
    await tester.drag(find.byType(Scrollable).first, const Offset(0, -500));
    await shot(tester, '03-today-scrolled');
    await tester.drag(find.byType(Scrollable).first, const Offset(0, 800));
    await settle(tester, 1);

    // Today's day may already be read; the walk-through leaves it as it found it.
    final wasRead = find.byKey(const Key('start-reading')).evaluate().isEmpty;
    await tester.tap(wasRead ? find.text('Read again') : find.byKey(const Key('start-reading')));
    await settle(tester, 3);
    await shot(tester, '04-reading-day');
    await tester.drag(find.byType(Scrollable).hitTestable().last, const Offset(0, -1400));
    await shot(tester, '05-reading-scripture');
    // A small scroll up brings the floating app bar back.
    await tester.drag(find.byType(Scrollable).hitTestable().last, const Offset(0, 120));
    await settle(tester, 1);
    await tester.tap(find.text('Aa'));
    await shot(tester, '06-reader-settings');
    await tester.tapAt(const Offset(200, 60));
    await settle(tester, 1);
    if (wasRead) {
      await tester.scrollUntilVisible(find.text('Undo'), 600, scrollable: find.byType(Scrollable).hitTestable().last);
      await tester.drag(find.byType(Scrollable).hitTestable().last, const Offset(0, -250));
      await settle(tester, 1);
      await tester.tap(find.text('Undo'));
      await settle(tester, 2);
    }
    await tester.scrollUntilVisible(find.byKey(const Key('mark-read')), 600, scrollable: find.byType(Scrollable).hitTestable().last);
    await tester.drag(find.byType(Scrollable).hitTestable().last, const Offset(0, -200));
    await shot(tester, '07-mark-read');
    final hold = await tester.startGesture(tester.getCenter(find.byKey(const Key('mark-read'))));
    await tester.pump(const Duration(milliseconds: 150));
    await tester.pump(const Duration(milliseconds: 500));
    await shot(tester, '07a-holding', wait: false);
    await settle(tester, 1);
    await hold.up();
    await tester.pump(const Duration(milliseconds: 300));
    await shot(tester, '07b-read-burst', wait: false);
    await settle(tester, 2);
    await shot(tester, '07c-up-next');
    if (!wasRead) {
      await tester.tap(find.text('Undo'));
      await settle(tester, 2);
    }
    await tester.scrollUntilVisible(find.text('Discussion · 1'), 600, scrollable: find.byType(Scrollable).hitTestable().last);
    await tester.drag(find.byType(Scrollable).hitTestable().last, const Offset(0, -300));
    await shot(tester, '08-discussion');
    await back(tester);

    await tester.tap(tab('Bible'));
    await settle(tester, 3);
    await shot(tester, '09-bible');
    await tester.tap(find.byKey(const Key('bible-picker')));
    await shot(tester, '10-bible-picker');
    await tester.tapAt(const Offset(200, 30));
    await settle(tester, 1);

    await tester.tap(tab('Community'));
    await settle(tester, 3);
    await shot(tester, '11-prayer-wall');
    await tester.tap(find.text('Share'));
    await shot(tester, '12-compose');
    await tester.tapAt(const Offset(200, 30));
    await settle(tester, 1);
    await tester.tap(find.text('Members'));
    await settle(tester, 2);
    await shot(tester, '13-members');
    await tester.tap(find.text('Maya Chen'));
    await shot(tester, '14-member');
    await tester.tapAt(const Offset(200, 30));
    await settle(tester, 1);

    await tester.tap(tab('Groups'));
    await settle(tester, 3);
    await shot(tester, '15-groups');
    await tester.tap(find.text('Founders Circle'));
    await settle(tester, 3);
    await shot(tester, '16-group');
    await tester.drag(find.byType(Scrollable).last, const Offset(0, -500));
    await shot(tester, '17-group-scrolled');
    await back(tester);

    await tester.tap(tab('Me'));
    await settle(tester, 2);
    await shot(tester, '18-me');
    await tester.tap(find.text('Notifications').last);
    await settle(tester, 2);
    await shot(tester, '19-notifications');
    await back(tester);
    await tester.tap(find.text('Settings'));
    await settle(tester, 2);
    await shot(tester, '20-settings');
    await back(tester);

    tester.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    await tester.tap(tab('Today'));
    await settle(tester, 2);
    await shot(tester, '21-today-dark');
    await tester.tap(tab('Bible'));
    await settle(tester, 2);
    await shot(tester, '22-bible-dark');
    tester.platformDispatcher.clearPlatformBrightnessTestValue();
  });
}
