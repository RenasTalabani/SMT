import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../screens/auth/login_screen.dart';
import '../../screens/auth/register_screen.dart';
import '../../screens/client/client_shell.dart';
import '../../screens/client/dashboard_screen.dart';
import '../../screens/client/plan_screen.dart';
import '../../screens/client/courses_screen.dart';
import '../../screens/client/tips_screen.dart';
import '../../screens/client/tip_detail_screen.dart';
import '../../screens/client/conversations_screen.dart';
import '../../screens/client/chat_screen.dart';
import '../../screens/client/notifications_screen.dart';
import '../../screens/client/profile_screen.dart';
import '../../screens/client/workout_detail_screen.dart';
import '../../screens/coach/coach_shell.dart';
import '../../screens/coach/coach_dashboard_screen.dart';
import '../../screens/coach/clients_screen.dart';
import '../../screens/coach/coach_workouts_screen.dart';
import '../../screens/coach/coach_profile_screen.dart';
import '../../screens/coach/create_workout_screen.dart';
import '../../screens/coach/create_exercise_screen.dart';
import '../../screens/client/progress_screen.dart';
import '../../screens/ai/ai_chat_screen.dart';
import '../../screens/ai/ai_workout_screen.dart';
import '../../screens/ai/ai_nutrition_screen.dart';
import '../../screens/admin/admin_dashboard_screen.dart';
import '../../screens/splash_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _clientShellKey = GlobalKey<NavigatorState>();
final _coachShellKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final isSplash = state.matchedLocation == '/splash';
      if (isSplash) return null;

      final isLoggedIn = authState.isLoggedIn;
      final isGuest = authState.isGuest;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      // Unauthenticated and not a guest → force login
      if (!isLoggedIn && !isGuest && !isAuthRoute) return '/auth/login';

      // Authenticated or guest on auth route → redirect into app
      if ((isLoggedIn || isGuest) && isAuthRoute) {
        if (isGuest) return '/client';
        final role = authState.user?.role;
        if (role == 'admin') return '/admin';
        if (role == 'coach') return '/coach';
        return '/client';
      }
      return null;
    },
    routes: [
      // Splash
      GoRoute(
        path: '/splash',
        builder: (_, __) => const SplashScreen(),
      ),

      // Auth routes
      GoRoute(
        path: '/auth/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (_, __) => const RegisterScreen(),
      ),

      // Client shell
      ShellRoute(
        navigatorKey: _clientShellKey,
        builder: (_, state, child) => ClientShell(child: child),
        routes: [
          GoRoute(
            path: '/client',
            builder: (_, __) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/client/plan',
            builder: (_, __) => const PlanScreen(),
          ),
          GoRoute(
            path: '/client/plan/:id',
            builder: (_, state) => WorkoutDetailScreen(
              planId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/client/courses',
            builder: (_, __) => const CoursesScreen(),
          ),
          GoRoute(
            path: '/client/tips',
            builder: (_, __) => const TipsScreen(),
          ),
          GoRoute(
            path: '/client/tips/:id',
            builder: (_, state) =>
                TipDetailScreen(tipId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/client/conversations',
            builder: (_, __) => const ConversationsScreen(),
          ),
          GoRoute(
            path: '/client/chat/:id',
            builder: (_, state) => ChatScreen(
              conversationId: state.pathParameters['id']!,
              conversationName:
                  state.uri.queryParameters['name'] ?? 'Chat',
            ),
          ),
          GoRoute(
            path: '/client/notifications',
            builder: (_, __) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/client/progress',
            builder: (_, __) => const ProgressScreen(),
          ),
          GoRoute(
            path: '/client/profile',
            builder: (_, __) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/client/ai/chat',
            builder: (_, __) => const AiChatScreen(),
          ),
          GoRoute(
            path: '/client/ai/workout',
            builder: (_, __) => const AiWorkoutScreen(),
          ),
          GoRoute(
            path: '/client/ai/nutrition',
            builder: (_, __) => const AiNutritionScreen(),
          ),
        ],
      ),

      // Coach shell
      ShellRoute(
        navigatorKey: _coachShellKey,
        builder: (_, state, child) => CoachShell(child: child),
        routes: [
          GoRoute(
            path: '/coach',
            builder: (_, __) => const CoachDashboardScreen(),
          ),
          GoRoute(
            path: '/coach/clients',
            builder: (_, __) => const ClientsScreen(),
          ),
          GoRoute(
            path: '/coach/workouts',
            builder: (_, __) => const CoachWorkoutsScreen(),
          ),
          GoRoute(
            path: '/coach/workouts/create',
            builder: (_, __) => const CreateWorkoutScreen(),
          ),
          GoRoute(
            path: '/coach/workouts/:id',
            builder: (_, state) => WorkoutDetailScreen(
              planId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/coach/profile',
            builder: (_, __) => const CoachProfileScreen(),
          ),
          GoRoute(
            path: '/coach/notifications',
            builder: (_, __) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/coach/exercises/create',
            builder: (_, __) => const CreateExerciseScreen(),
          ),
        ],
      ),

      // Admin
      GoRoute(
        path: '/admin',
        builder: (_, __) => const AdminDashboardScreen(),
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.error}'),
      ),
    ),
  );
});
