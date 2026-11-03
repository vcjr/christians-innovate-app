import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'providers.dart';

/// The five tabs. New members who haven't finished onboarding are sent there once.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.shell});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(profileProvider, (_, next) {
      final p = next.value;
      if (p != null && !p.hasCompletedOnboarding) context.go('/onboarding');
    });
    final unread = ref.watch(unreadCountProvider);
    // Only the Bible tab reads immersively.
    final hidden = ref.watch(chromeHiddenProvider) && shell.currentIndex == 1;
    return Scaffold(
      body: shell,
      bottomNavigationBar: ClipRect(
        child: AnimatedAlign(
          alignment: Alignment.topCenter,
          heightFactor: hidden ? 0 : 1,
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOutCubic,
          child: NavigationBar(
            selectedIndex: shell.currentIndex,
            onDestinationSelected: (i) {
              if (i != shell.currentIndex) HapticFeedback.selectionClick();
              ref.read(chromeHiddenProvider.notifier).set(false);
              shell.goBranch(i, initialLocation: i == shell.currentIndex);
            },
            destinations: [
              const NavigationDestination(icon: Icon(Icons.wb_sunny_outlined), selectedIcon: Icon(Icons.wb_sunny_rounded), label: 'Today'),
              const NavigationDestination(
                icon: Icon(Icons.menu_book_outlined),
                selectedIcon: Icon(Icons.menu_book_rounded),
                label: 'Bible',
              ),
              const NavigationDestination(
                icon: Icon(Icons.volunteer_activism_outlined),
                selectedIcon: Icon(Icons.volunteer_activism),
                label: 'Community',
              ),
              const NavigationDestination(icon: Icon(Icons.groups_outlined), selectedIcon: Icon(Icons.groups_rounded), label: 'Groups'),
              NavigationDestination(
                icon: Badge(isLabelVisible: unread > 0, label: Text('$unread'), child: const Icon(Icons.person_outline_rounded)),
                selectedIcon: Badge(isLabelVisible: unread > 0, label: Text('$unread'), child: const Icon(Icons.person_rounded)),
                label: 'Me',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
