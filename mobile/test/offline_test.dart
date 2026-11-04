import 'dart:async';
import 'dart:io';

import 'package:ci_mobile/data/backend.dart';
import 'package:ci_mobile/data/offline_store.dart';
import 'package:ci_mobile/data/outbox.dart';
import 'package:ci_mobile/widgets/offline_banner.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:path_provider_platform_interface/path_provider_platform_interface.dart';

import 'app_test.dart' show pumpApp;
import 'fake_backend.dart';

/// Points path_provider at a temp folder so [OfflineStore.open] writes real files.
class _TempPaths extends PathProviderPlatform {
  _TempPaths(this.dir);
  final String dir;
  @override
  Future<String?> getApplicationSupportPath() async => dir;
}

void main() {
  group('OfflineStore', () {
    late Directory tmp;
    setUp(() {
      tmp = Directory.systemTemp.createTempSync('ci-store');
      PathProviderPlatform.instance = _TempPaths(tmp.path);
    });
    tearDown(() => tmp.deleteSync(recursive: true));

    test('keeps documents across app launches', () async {
      final a = await OfflineStore.open();
      await a.put('u/me/posts', [
        {'id': 'p1', 'title': 'Clinic permit'},
      ]);
      await a.put('translation/KJV', {'Genesis|1': []});
      await a.keys(''); // waits for the writes

      final b = await OfflineStore.open();
      expect(await b.get('u/me/posts'), [
        {'id': 'p1', 'title': 'Clinic permit'},
      ]);
      expect(await b.keys('translation/'), {'translation/KJV'});
      expect(await b.size('translation/'), greaterThan(0));
    });

    test('removePrefix forgets one member without touching anything else', () async {
      final s = await OfflineStore.open();
      await s.put('u/me/posts', []);
      await s.put('u/me/profile', {});
      await s.put('u/other/posts', []);
      await s.put('translation/ESV', {});
      await s.removePrefix('u/me/');
      final reopened = await OfflineStore.open();
      expect(await reopened.keys(''), {'u/other/posts', 'translation/ESV'});
    });

    test('a failed write reaches the caller, and later writes still run', () async {
      File('${tmp.path}/offline').writeAsStringSync('in the way'); // the folder can't be made
      final s = await OfflineStore.open();
      await expectLater(s.put('u/me/outbox', [1]), throwsA(isA<FileSystemException>()));
      File('${tmp.path}/offline').deleteSync();
      await s.put('u/me/outbox', [2]);
      expect(await (await OfflineStore.open()).get('u/me/outbox'), [2]);
    });
  });

  group('Outbox', () {
    const offline = BackendException('offline', offline: true);
    bool isOffline(Object e) => e is BackendException && e.offline;

    test('sends in order and stops at the first change that can’t get through', () async {
      final store = OfflineStore.memory();
      final box = Outbox(store);
      await box.load('me');
      for (final n in [1, 2, 3]) {
        await box.add({'op': 'praying', 'n': n});
      }
      final sent = <int>[];
      final done = await box.flush((c) async {
        if (c['n'] == 2) throw offline;
        sent.add(c['n'] as int);
      }, isOffline);
      expect(done, isFalse);
      expect(sent, [1]);
      expect(box.length, 2, reason: 'the unsent changes stay, in order');

      final again = Outbox(store);
      await again.load('me');
      expect(again.length, 2, reason: 'and survive a restart');
      await again.flush((c) async => sent.add(c['n'] as int), isOffline);
      expect(sent, [1, 2, 3]);
      expect(again.isEmpty, isTrue);
    });

    test('a change the server rejects is dropped so it can’t block the rest', () async {
      final box = Outbox(OfflineStore.memory());
      await box.load('me');
      await box.add({'n': 1});
      await box.add({'n': 2});
      final sent = <int>[];
      final done = await box.flush((c) async {
        if (c['n'] == 1) throw const BackendException('Something went wrong.');
        sent.add(c['n'] as int);
      }, isOffline);
      expect(done, isTrue);
      expect(sent, [2]);
    });

    test('a passing server fault keeps the change for the next try', () async {
      final box = Outbox(OfflineStore.memory());
      await box.load('me');
      await box.add({'n': 1});
      const busy = BackendException('Something went wrong.', temporary: true);
      final done = await box.flush((c) async => throw busy, (e) => e is BackendException && (e.offline || e.temporary));
      expect(done, isFalse);
      expect(box.length, 1);
    });

    test('a change added while the queue is still loading isn’t lost', () async {
      final store = OfflineStore.memory();
      await store.put('u/me/outbox', [
        {'n': 1},
      ]);
      final box = Outbox(store);
      // Startup: the auth listener, a screen's read and a write all load at once.
      unawaited(box.load('me'));
      unawaited(box.load('me'));
      await box.add({'n': 2});
      final sent = <int>[];
      await box.flush((c) async => sent.add(c['n'] as int), isOffline);
      expect(sent, [1, 2]);
    });

    test('each member has their own queue', () async {
      final store = OfflineStore.memory();
      final box = Outbox(store);
      await box.load('me');
      await box.add({'n': 1});
      await box.load('someone-else');
      expect(box.isEmpty, isTrue);
      await box.load('me');
      expect(box.length, 1);
    });
  });

  test('banner wording', () {
    expect(OfflineBanner.messageFor(false, 0), isNull);
    expect(OfflineBanner.messageFor(true, 0), 'Offline · showing what’s saved on this device');
    expect(OfflineBanner.messageFor(true, 1), 'Offline · 1 change will sync when you’re back');
    expect(OfflineBanner.messageFor(false, 3), 'Syncing 3 changes…');
  });

  testWidgets('the banner shows while offline and goes away once synced', (tester) async {
    final backend = FakeBackend();
    await pumpApp(tester, backend);
    expect(find.byKey(const Key('offline-banner')), findsNothing);

    backend.setSyncState(const SyncState(offline: true, pending: 2));
    await tester.pumpAndSettle();
    expect(find.text('Offline · 2 changes will sync when you’re back'), findsOneWidget);

    backend.setSyncState(const SyncState());
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('offline-banner')), findsNothing);
  });

  testWidgets('downloading a translation from Settings', (tester) async {
    final backend = FakeBackend();
    await pumpApp(tester, backend);
    await tester.tap(find.text('Me'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(find.byKey(const Key('download-ESV')), 200, scrollable: find.byType(Scrollable).last);
    await tester.tap(find.byKey(const Key('download-ESV')));
    await tester.pumpAndSettle();
    expect(backend.calls, contains('download ESV'));
    expect(find.byKey(const Key('remove-ESV')), findsOneWidget);
    expect(find.textContaining('Using 7 MB.'), findsOneWidget);
  });
}
