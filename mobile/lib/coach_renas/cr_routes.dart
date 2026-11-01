// Coach Renas routes — all live under /renas inside one shell (bottom bar on
// the 5 main tabs only). Added to the City Gym router in core/router/app_router.dart.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'cr_shell.dart';
import 'screens/cr_account_screens.dart';
import 'screens/cr_food_shop_screens.dart';
import 'screens/cr_guide_screens.dart';
import 'screens/cr_panel_screens.dart';
import 'screens/cr_train_screens.dart';
import 'screens/cr_web_screen.dart';
import 'screens/cr_notif_screen.dart';

/// Start the app straight in Coach Renas:
/// `flutter run --dart-define=APP_MODE=coach_renas`
const kCrAppMode = String.fromEnvironment('APP_MODE');
bool get crStandalone => kCrAppMode != 'city_gym'; // Coach Renas is the app; the old City Gym screens open only with APP_MODE=city_gym

ShellRoute crShellRoute(GlobalKey<NavigatorState> key) => ShellRoute(
      navigatorKey: key,
      builder: (_, __, child) => CrShell(child: child),
      routes: [
        GoRoute(path: '/renas', builder: (_, __) => const CrHomeScreen()),
        GoRoute(path: '/renas/train', builder: (_, __) => const CrTrainScreen()),
        GoRoute(path: '/renas/food', builder: (_, __) => const CrFoodScreen()),
        GoRoute(path: '/renas/coach', builder: (_, __) => const CrCoachScreen()),
        GoRoute(path: '/renas/shop', builder: (_, __) => const CrShopScreen()),
        GoRoute(path: '/renas/goal', builder: (_, __) => const CrGoalScreen()),
        GoRoute(path: '/renas/sport/:id', builder: (_, s) => CrSportScreen(id: s.pathParameters['id']!)),
        GoRoute(path: '/renas/program/:id', builder: (_, s) => CrProgramScreen(id: s.pathParameters['id']!)),
        GoRoute(path: '/renas/workout', builder: (_, __) => const CrWorkoutScreen()),
        GoRoute(path: '/renas/lib', builder: (_, __) => const CrWebScreen(route: 'lib')),
        GoRoute(path: '/renas/ex/:id', builder: (_, s) => CrWebScreen(route: 'ex-${int.tryParse(s.pathParameters['id']!) ?? 1}')),
        GoRoute(path: '/renas/supps', builder: (_, __) => const CrWebScreen(route: 'supps')),
        GoRoute(path: '/renas/hormones', builder: (_, __) => const CrWebScreen(route: 'hormones')),
        GoRoute(path: '/renas/notif', builder: (_, __) => const CrNotifScreen()),
        GoRoute(path: '/renas/body', builder: (_, __) => const CrWebScreen(route: 'body')),
        GoRoute(path: '/renas/why', builder: (_, __) => const CrWebScreen(route: 'why')),
        GoRoute(path: '/renas/web/:route', builder: (_, s) => CrWebScreen(route: s.pathParameters['route']!)),
        GoRoute(path: '/renas/checkout', builder: (_, __) => const CrCheckoutScreen()),
        GoRoute(path: '/renas/guide/:kind', builder: (_, s) => CrWebScreen(route: s.pathParameters['kind'] == 'train' ? 'tguide' : 'fguide')),
        GoRoute(path: '/renas/tips', builder: (_, __) => const CrTipsScreen()),
        GoRoute(path: '/renas/orders', builder: (_, __) => const CrOrdersScreen()),
        GoRoute(path: '/renas/me', builder: (_, __) => const CrMeScreen()),
        GoRoute(path: '/renas/plans', builder: (_, __) => const CrPlansScreen()),
        GoRoute(path: '/renas/start', builder: (_, __) => const CrStartScreen()),
        GoRoute(path: '/renas/checkin', builder: (_, __) => const CrCheckinScreen()),
        GoRoute(path: '/renas/privacy', builder: (_, __) => const CrPrivacyScreen()),
        GoRoute(path: '/renas/delete', builder: (_, __) => const CrDeleteScreen()),
        GoRoute(path: '/renas/panel', builder: (_, __) => const CrPanelScreen()),
        GoRoute(path: '/renas/panel/client/:id', builder: (_, s) => CrPanelClientScreen(userId: s.pathParameters['id']!)),
        GoRoute(path: '/renas/content', builder: (_, __) => const CrContentScreen()),
      ],
    );

/// Entry card shown on the City Gym member and coach dashboards.
class CoachRenasEntryCard extends StatelessWidget {
  const CoachRenasEntryCard({super.key, this.coach = false});
  final bool coach;
  @override
  Widget build(BuildContext context) {
    final lang = Localizations.localeOf(context).languageCode;
    String t(String ar, String en, String ku) => lang == 'ku' ? ku : lang == 'en' ? en : ar;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Material(
        color: const Color(0xFF0E1113),
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => context.go(coach ? '/renas/panel' : '/renas'),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(color: Color(0xFF2BC4BE), shape: BoxShape.circle),
                alignment: Alignment.center,
                child: const Text('ر', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800, fontSize: 24, color: Color(0xFF06201F))),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(coach ? t('لوحة الكوتش ريناس', 'Coach Renas panel', 'داشبۆردی کۆچ ڕێناس') : t('مع الكوتش ريناس', 'With Coach Renas', 'لەگەڵ کۆچ ڕێناس'),
                      style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800, fontSize: 18, color: Color(0xFFF2F4F3))),
                  Text(
                    coach
                        ? t('متدربينك، الدفعات، التقارير وخطة المحتوى', 'Your clients, payments, check-ins and content plan', 'ڕاهێنراوەکانت، پارەدان، ڕاپۆرت و پلانی ناوەڕۆک')
                        : t('تمرين بطريقة الكوتش، أكل عراقي، مكملات، ومدرب ذكي', 'Train the coach\'s way, Iraqi food, supplements and an AI coach', 'ڕاهێنان بە شێوازی کۆچ، خواردنی عێراقی، تەواوکەر و ڕاهێنەری زیرەک'),
                    style: const TextStyle(fontSize: 13, color: Color(0xFF9AA3A8)),
                  ),
                ]),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Color(0xFF2BC4BE)),
            ]),
          ),
        ),
      ),
    );
  }
}
