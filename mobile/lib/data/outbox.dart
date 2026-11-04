import 'offline_store.dart';

/// Changes a member made while offline, kept on the device in order until they reach the server.
/// Each change is a JSON map with an `op` name; the backend knows how to send each kind.
class Outbox {
  Outbox(this._store);

  final OfflineStore _store;
  String? _owner;
  var _items = <Map<String, Object?>>[];

  String get _key => 'u/$_owner/outbox';

  int get length => _items.length;
  bool get isEmpty => _items.isEmpty;

  // Loads run one at a time, and adds and flushes wait for them, so a change is never added
  // to a queue that's still being read from disk and then overwritten when the read lands.
  Future<void> _loading = Future.value();

  /// Switches to [owner]'s queue (the signed-in member), loading it from the device.
  Future<void> load(String? owner) {
    final next = _loading.then((_) async {
      if (owner == _owner) return;
      final raw = owner == null ? null : await _store.get('u/$owner/outbox');
      _owner = owner;
      _items = [for (final i in (raw as List? ?? const [])) (i as Map).cast<String, Object?>()];
    });
    _loading = next.catchError((Object _) {});
    return next;
  }

  Future<void> add(Map<String, Object?> change) async {
    await _loading;
    _items.add(change);
    await _store.put(_key, _items);
  }

  /// Sends the changes in order with [send]. Stops at the first one that fails in a way worth
  /// retrying (offline, or a passing server fault) and returns false; a change the server
  /// rejects outright is dropped, so one bad change can't hold back everything after it.
  Future<bool> flush(Future<void> Function(Map<String, Object?> change) send, bool Function(Object error) shouldRetry) async {
    await _loading;
    while (_items.isNotEmpty) {
      final owner = _owner;
      try {
        await send(_items.first);
      } catch (e) {
        if (shouldRetry(e)) return false;
      }
      // The member may have signed out while that was in flight.
      if (owner != _owner || _items.isEmpty) return true;
      _items.removeAt(0);
      await _store.put(_key, _items);
    }
    return true;
  }

  Future<void> clear() async {
    await _loading;
    _items = [];
    if (_owner != null) await _store.remove(_key);
  }
}
