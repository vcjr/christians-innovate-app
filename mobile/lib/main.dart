import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/providers.dart';
import 'app/router.dart';
import 'app/theme.dart';
import 'data/offline_store.dart';
import 'data/secure_session.dart';
import 'data/supabase_backend.dart';
import 'widgets/offline_banner.dart';

/// Set with --dart-define-from-file (see env/example.json).
const _supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const _supabaseKey = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');
const _siteUrl = String.fromEnvironment('SITE_URL', defaultValue: 'https://app.christiansinnovate.com');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  assert(_supabaseUrl != '' && _supabaseKey != '', 'Run with --dart-define-from-file=env/dev.json');
  // Phones keep the session in the Keychain/Keystore; desktop builds (local development) use
  // the default preferences file, since a desktop keyring may not be there.
  final phone = !kIsWeb && (Platform.isIOS || Platform.isAndroid);
  final (supabase, prefs, store) = await (
    Supabase.initialize(
      url: _supabaseUrl,
      publishableKey: _supabaseKey,
      authOptions: FlutterAuthClientOptions(localStorage: phone ? const SecureSessionStorage() : null),
    ),
    SharedPreferences.getInstance(),
    OfflineStore.open(),
  ).wait;
  runApp(
    ProviderScope(
      // Errors are shown with a Try again button; don't retry behind the member's back.
      retry: (_, _) => null,
      overrides: [
        backendProvider.overrideWithValue(SupabaseBackend(supabase.client, siteUrl: _siteUrl, store: store)),
        preferencesProvider.overrideWithValue(prefs),
      ],
      child: const CiApp(),
    ),
  );
}

class CiApp extends ConsumerStatefulWidget {
  const CiApp({super.key});

  @override
  ConsumerState<CiApp> createState() => _CiAppState();
}

class _CiAppState extends ConsumerState<CiApp> {
  late final AppLifecycleListener _lifecycle;

  @override
  void initState() {
    super.initState();
    // Coming back to the app is a good moment to send anything made offline.
    _lifecycle = AppLifecycleListener(onResume: () => ref.read(backendProvider).sync());
  }

  @override
  void dispose() {
    _lifecycle.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(syncStateProvider, (prev, next) {
      final before = prev?.value, now = next.value;
      if (before == null || now == null) return;
      final reconnected = before.offline && !now.offline;
      final sent = before.pending > 0 && now.pending == 0 && !now.offline;
      if (reconnected || sent) refreshAfterSync(ref);
    });
    return MaterialApp.router(
      title: 'Christians Innovate',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      routerConfig: ref.watch(routerProvider),
      builder: (context, child) => OfflineBanner(child: child!),
    );
  }
}
