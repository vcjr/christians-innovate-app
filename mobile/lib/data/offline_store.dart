import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

/// JSON documents kept on the device so the app can show what it last saw when it's offline.
/// One file per key; a document is read from disk once and then served from memory.
class OfflineStore {
  OfflineStore._(this._dir);

  /// Kept in memory only, for tests.
  OfflineStore.memory() : _dir = null;

  static Future<OfflineStore> open() async {
    final base = await getApplicationSupportDirectory();
    return OfflineStore._(Directory('${base.path}/offline'));
  }

  final Directory? _dir;
  final _memory = <String, Object?>{};

  // Writes go one at a time so a later write to a key never lands before an earlier one.
  Future<void> _writes = Future.value();

  File _file(String key) => File('${_dir!.path}/${base64Url.encode(utf8.encode(key))}.json');

  String? _keyOf(File f) {
    final name = f.uri.pathSegments.last;
    if (!name.endsWith('.json')) return null;
    try {
      return utf8.decode(base64Url.decode(name.substring(0, name.length - 5)));
    } on FormatException {
      return null;
    }
  }

  Future<Object?> get(String key) async {
    if (_memory.containsKey(key)) return _memory[key];
    final dir = _dir;
    if (dir == null) return null;
    final f = _file(key);
    if (!await f.exists()) return null;
    try {
      return _memory[key] = jsonDecode(await f.readAsString());
    } on FormatException {
      return null; // A half-written file from a crash; the next fetch replaces it.
    }
  }

  Future<void> put(String key, Object? value) {
    _memory[key] = value;
    final dir = _dir;
    if (dir == null) return Future.value();
    final text = jsonEncode(value);
    return _queue(() async {
      await dir.create(recursive: true);
      // Write beside it and swap in, so a crash never leaves a torn file under the real name.
      final tmp = File('${_file(key).path}.tmp');
      await tmp.writeAsString(text, flush: true);
      await tmp.rename(_file(key).path);
    });
  }

  Future<void> remove(String key) {
    _memory.remove(key);
    final dir = _dir;
    if (dir == null) return Future.value();
    return _queue(() async {
      final f = _file(key);
      if (await f.exists()) await f.delete();
    });
  }

  /// Runs [write] after the writes before it. A failure (a full disk, say) reaches the caller,
  /// but doesn't stop the writes after it.
  Future<void> _queue(Future<void> Function() write) {
    final next = _writes.then((_) => write());
    _writes = next.catchError((Object _) {});
    return next;
  }

  /// Every stored key that starts with [prefix].
  Future<Set<String>> keys(String prefix) async {
    final found = {..._memory.keys.where((k) => k.startsWith(prefix))};
    final dir = _dir;
    if (dir != null && await dir.exists()) {
      await _writes;
      await for (final e in dir.list()) {
        if (e is! File) continue;
        final k = _keyOf(e);
        if (k != null && k.startsWith(prefix)) found.add(k);
      }
    }
    return found;
  }

  /// Bytes on disk used by keys starting with [prefix].
  Future<int> size(String prefix) async {
    final dir = _dir;
    if (dir == null || !await dir.exists()) return 0;
    var total = 0;
    await for (final e in dir.list()) {
      if (e is File && (_keyOf(e)?.startsWith(prefix) ?? false)) total += await e.length();
    }
    return total;
  }

  Future<void> removePrefix(String prefix) async {
    for (final k in await keys(prefix)) {
      await remove(k);
    }
  }
}
