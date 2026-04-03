import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/notification_provider.dart';

class ClientShell extends ConsumerStatefulWidget {
  const ClientShell({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<ClientShell> createState() => _ClientShellState();
}

class _ClientShellState extends ConsumerState<ClientShell> {
  static const List<String> _routes = [
    '/client',
    '/client/plan',
    '/client/courses',
    '/client/tips',
    '/client/progress',
    '/client/profile',
  ];

  int _locationToIndex(String location) {
    for (int i = _routes.length - 1; i >= 0; i--) {
      if (location.startsWith(_routes[i])) return i;
    }
    return 0;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).fetchUnreadCount();
    });
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final currentIndex = _locationToIndex(location);

    final destinations = [
      NavigationDestination(
        icon: const Icon(Icons.dashboard_outlined),
        selectedIcon: const Icon(Icons.dashboard_rounded),
        label: 'nav_dashboard'.tr(),
      ),
      NavigationDestination(
        icon: const Icon(Icons.fitness_center_outlined),
        selectedIcon: const Icon(Icons.fitness_center_rounded),
        label: 'nav_plan'.tr(),
      ),
      NavigationDestination(
        icon: const Icon(Icons.play_circle_outline_rounded),
        selectedIcon: const Icon(Icons.play_circle_rounded),
        label: 'nav_courses'.tr(),
      ),
      NavigationDestination(
        icon: const Icon(Icons.lightbulb_outline_rounded),
        selectedIcon: const Icon(Icons.lightbulb_rounded),
        label: 'nav_tips'.tr(),
      ),
      NavigationDestination(
        icon: const Icon(Icons.timeline_outlined),
        selectedIcon: const Icon(Icons.timeline_rounded),
        label: 'nav_progress'.tr(),
      ),
      NavigationDestination(
        icon: const Icon(Icons.person_outline_rounded),
        selectedIcon: const Icon(Icons.person_rounded),
        label: 'nav_profile'.tr(),
      ),
    ];

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          context.go(_routes[index]);
        },
        destinations: destinations,
        backgroundColor: Theme.of(context).colorScheme.surface,
        indicatorColor: const Color(0xFF26BDB8).withValues(alpha: 0.12),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),
    );
  }
}
