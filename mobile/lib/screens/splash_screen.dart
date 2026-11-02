import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../widgets/city_gym_logo.dart';
import '../coach_renas/cr_routes.dart' show crStandalone;

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _minTimeElapsed = false;
  bool _authDone = false;

  @override
  void initState() {
    super.initState();
    // Delay until after first frame so Riverpod state can be modified safely
    Future.microtask(() {
      _runMinTimer();
      _runAuth();
    });
  }

  // Minimum display time so the animation is visible
  Future<void> _runMinTimer() async {
    await Future.delayed(const Duration(milliseconds: 1600));
    if (!mounted) return;
    _minTimeElapsed = true;
    _maybeNavigate();
  }

  // Auth check with hard 8-second cap — never hangs forever
  Future<void> _runAuth() async {
    try {
      await ref
          .read(authProvider.notifier)
          .init()
          .timeout(const Duration(seconds: 8));
    } catch (_) {
      // Timeout or network error — treated as logged-out in init()
    }
    if (!mounted) return;
    _authDone = true;
    _maybeNavigate();
  }

  void _maybeNavigate() {
    if (!_minTimeElapsed || !_authDone) return;
    if (!mounted) return;

    final auth = ref.read(authProvider);
    if (crStandalone) {
      context.go('/app');
      return;
    }
    if (auth.isLoggedIn && auth.user != null) {
      final role = auth.user!.role;
      if (role == 'admin') {
        context.go('/admin');
      } else if (role == 'coach') {
        context.go('/coach');
      } else {
        context.go('/client');
      }
    } else if (auth.isGuest) {
      context.go('/client');
    } else {
      context.go('/auth/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CityGymLogo(size: 140, showTagline: true)
                .animate()
                .fadeIn(duration: 800.ms, curve: Curves.easeOut)
                .scale(
                  begin: const Offset(0.7, 0.7),
                  end: const Offset(1.0, 1.0),
                  duration: 800.ms,
                  curve: Curves.easeOutBack,
                ),
            const SizedBox(height: 52),
            SizedBox(
              width: 26,
              height: 26,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: const Color(0xFF26BDB8).withValues(alpha: 0.7),
              ),
            ).animate().fadeIn(delay: 600.ms, duration: 400.ms),
          ],
        ),
      ),
    );
  }
}
