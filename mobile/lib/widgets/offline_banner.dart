import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app/providers.dart';
import '../app/theme.dart';

/// A strip along the bottom of every screen while the app is offline or still sending changes
/// made offline. Wraps the whole app, so it shows on pushed screens too.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key, required this.child});
  final Widget child;

  static String? messageFor(bool offline, int pending) {
    final changes = pending == 1 ? '1 change' : '$pending changes';
    if (offline) return pending == 0 ? 'Offline · showing what’s saved on this device' : 'Offline · $changes will sync when you’re back';
    if (pending > 0) return 'Syncing $changes…';
    return null;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(syncStateProvider).value;
    final message = s == null ? null : messageFor(s.offline, s.pending);
    final scheme = context.colors;
    return Column(
      children: [
        // The strip takes the bottom safe area, so the screen above shouldn't pad for it again.
        Expanded(
          child: MediaQuery.removePadding(context: context, removeBottom: message != null, child: child),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutCubic,
          child: message == null
              ? const SizedBox(width: double.infinity)
              : Material(
                  key: const Key('offline-banner'),
                  color: scheme.inverseSurface,
                  child: SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: Tokens.space4, vertical: Tokens.space2),
                      child: Row(
                        children: [
                          Icon(s!.offline ? Icons.cloud_off_rounded : Icons.cloud_sync_rounded, size: 18, color: scheme.onInverseSurface),
                          const SizedBox(width: Tokens.space2),
                          Expanded(
                            child: Text(
                              message,
                              style: context.text.labelMedium?.copyWith(color: scheme.onInverseSurface),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
        ),
      ],
    );
  }
}
