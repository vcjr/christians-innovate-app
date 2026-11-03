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

  /// Switches to [owner]'s queue (the signed-in member), loading it from the device.
  Future<void> load(String? owner) async {
    if (owner == _owner) return;
    _owner = owner;
    final raw = owner == null ? null : await _store.get(_key);
    _items = [for (final i in (raw as List? ?? const [])) (i as Map).cast<String, Object?>()];
  }

  Future<void> add(Map<String, Object?> change) async {
    _items.add(change);
    await _store.put(_key, _items);
  }

  /// Sends the changes in order with [send]. Stops at the first one that fails because the
  /// device is offline and returns false; a change the server rejects outright is dropped, so
  /// one bad change can't hold back everything after it.
  Future<bool> flush(Future<void> Function(Map<String, Object?> change) send, bool Function(Object error) isOffline) async {
    while (_items.isNotEmpty) {
      final owner = _owner;
      try {
        await send(_items.first);
      } catch (e) {
        if (isOffline(e)) return false;
      }
      // The member may have signed out while that was in flight.
      if (owner != _owner || _items.isEmpty) return true;
      _items.removeAt(0);
      await _store.put(_key, _items);
    }
    return true;
  }

  Future<void> clear() async {
    _items = [];
    if (_owner != null) await _store.remove(_key);
  }
}
