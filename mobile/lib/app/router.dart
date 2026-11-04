import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/auth_screens.dart';
import '../features/bible/bible_screen.dart';
import '../features/community/community_screen.dart';
import '../features/groups/group_screen.dart';
import '../features/groups/groups_screen.dart';
import '../features/me/me_screen.dart';
import '../features/me/profile_edit_screen.dart';
import '../features/me/simple_screens.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/plan/day_screen.dart';
import '../features/plan/plan_screens.dart';
import '../features/today/today_screen.dart';
import 'providers.dart';
import 'shell.dart';

const _authPaths = {'/sign-in', '/sign-up', '/forgot-password'};

final routerProvider = Provider<GoRouter>((ref) {
  final backend = ref.watch(backendProvider);
  final refresh = _StreamListenable(backend.userChanges);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/today',
    refreshListenable: refresh,
    redirect: (context, state) {
      final signedIn = backend.userId != null;
      final onAuth = _authPaths.contains(state.matchedLocation);
      if (!signedIn) return onAuth ? null : '/sign-in';
      if (onAuth) return '/today';
      return null;
    },
    routes: [
      GoRoute(path: '/sign-in', builder: (_, _) => const SignInScreen()),
      GoRoute(path: '/sign-up', builder: (_, _) => const SignUpScreen()),
      GoRoute(path: '/forgot-password', builder: (_, _) => const ForgotPasswordScreen()),
      GoRoute(path: '/onboarding', builder: (_, _) => const OnboardingScreen()),
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(
            routes: [GoRoute(path: '/today', builder: (_, _) => const TodayScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/bible', builder: (_, _) => const BibleScreen())],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/community',
                builder: (_, s) => CommunityScreen(showMembers: s.uri.queryParameters['tab'] == 'members'),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/groups', builder: (_, _) => const GroupsScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/me', builder: (_, _) => const MeScreen())],
          ),
        ],
      ),
      GoRoute(path: '/plan', builder: (_, _) => const PlanScreen()),
      GoRoute(path: '/plans', builder: (_, _) => const PlansScreen()),
      GoRoute(
        path: '/day/:id',
        builder: (_, s) => DayScreen(dayId: s.pathParameters['id']!, planId: s.uri.queryParameters['plan']!),
      ),
      GoRoute(path: '/groups/discover', builder: (_, _) => const DiscoverGroupsScreen()),
      GoRoute(path: '/groups/new', builder: (_, _) => const CreateGroupScreen()),
      GoRoute(
        path: '/group/:id',
        builder: (_, s) => GroupScreen(groupId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/notifications', builder: (_, _) => const NotificationsScreen()),
      GoRoute(path: '/resources', builder: (_, _) => const ResourcesScreen()),
      GoRoute(path: '/profile/edit', builder: (_, _) => const ProfileEditScreen()),
      GoRoute(path: '/settings', builder: (_, _) => const SettingsScreen()),
    ],
  );
});

/// Maps a web link stored on a notification ("/accountability", "/directory") to a screen here.
String appPathForWebLink(String? link) => switch (link) {
  final l? when l.startsWith('/accountability/discover') => '/groups/discover',
  final l? when l.startsWith('/accountability') => '/groups',
  final l? when l.startsWith('/directory') => '/community?tab=members',
  final l? when l.startsWith('/launch-prayer') => '/community',
  final l? when l.startsWith('/resources') => '/resources',
  _ => '/today',
};

class _StreamListenable extends ChangeNotifier {
  _StreamListenable(Stream<Object?> stream) {
    _sub = stream.listen((_) => notifyListeners());
  }
  late final StreamSubscription<Object?> _sub;

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}
