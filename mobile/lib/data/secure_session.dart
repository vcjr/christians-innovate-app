import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Keeps the Supabase session (including its refresh token) in the Keychain on iOS and the
/// Keystore on Android rather than in plain app preferences.
class SecureSessionStorage extends LocalStorage {
  const SecureSessionStorage();

  static const _key = 'ci.supabase.session';

  // first_unlock lets the token refresh while the phone is locked after it's been unlocked once.
  static const _storage = FlutterSecureStorage(iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock));

  @override
  Future<void> initialize() async {}

  @override
  Future<bool> hasAccessToken() => _storage.containsKey(key: _key);

  @override
  Future<String?> accessToken() => _storage.read(key: _key);

  @override
  Future<void> removePersistedSession() => _storage.delete(key: _key);

  @override
  Future<void> persistSession(String persistSessionString) => _storage.write(key: _key, value: persistSessionString);
}
