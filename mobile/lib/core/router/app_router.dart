// Coach Renas app routes. The whole app is the approved Coach Renas page
// (CrAppScreen); the only native screen is the phone-reminders screen.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../coach_renas/cr_core.dart';
import '../../coach_renas/screens/cr_notif_screen.dart';
import '../../coach_renas/screens/cr_web_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/app',
    routes: [
      GoRoute(path: '/app', builder: (_, __) => const CrAppScreen()),
      GoRoute(
        path: '/renas/notif',
        builder: (_, __) => Theme(
          data: crTheme(),
          child: Directionality(textDirection: CrI18n.dir, child: const CrNotifScreen()),
        ),
      ),
    ],
    errorBuilder: (_, __) => const CrAppScreen(),
  );
});
