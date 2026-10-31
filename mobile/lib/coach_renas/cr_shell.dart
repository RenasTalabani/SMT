// Coach Renas shell: the design's dark 5-tab bottom bar
// (الرئيسية · التمارين · الأكل والمكملات · المدرب الذكي · المتجر).
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'cr_core.dart';

class CrShell extends StatelessWidget {
  const CrShell({super.key, required this.child});
  final Widget child;

  static const tabs = ['/renas', '/renas/train', '/renas/food', '/renas/coach', '/renas/shop'];

  @override
  Widget build(BuildContext context) {
    // Follow the app language (en / ar / ku) chosen in City Gym.
    CrI18n.lang = switch (context.locale.languageCode) { 'ku' => 'ku', 'en' => 'en', _ => 'ar' };
    final loc = GoRouterState.of(context).matchedLocation;
    final idx = tabs.lastIndexWhere((t) => t == loc);
    final items = <(IconData, IconData, String)>[
      (Icons.home_outlined, Icons.home_rounded, T('الرئيسية')),
      (Icons.fitness_center_outlined, Icons.fitness_center_rounded, T('التمارين')),
      (Icons.restaurant_outlined, Icons.restaurant_rounded, T('الأكل والمكملات')),
      (Icons.auto_awesome_outlined, Icons.auto_awesome, T('المدرب الذكي')),
      (Icons.shopping_bag_outlined, Icons.shopping_bag_rounded, T('المتجر')),
    ];
    return Theme(
      data: crTheme(),
      child: Directionality(
        textDirection: CrI18n.dir,
        child: Scaffold(
          backgroundColor: CrColors.bg,
          body: KeyedSubtree(key: ValueKey('cr-${CrI18n.lang}'), child: child),
          bottomNavigationBar: idx < 0
              ? null
              : Container(
                  decoration: const BoxDecoration(color: CrColors.nav, border: Border(top: BorderSide(color: CrColors.line))),
                  child: SafeArea(
                    top: false,
                    child: SizedBox(
                      height: 62,
                      child: Row(children: [
                        for (var i = 0; i < items.length; i++)
                          Expanded(
                            child: Semantics(
                              selected: i == idx,
                              button: true,
                              child: InkWell(
                                onTap: () => context.go(tabs[i]),
                                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                                  Icon(i == idx ? items[i].$2 : items[i].$1, size: 22, color: i == idx ? CrColors.teal : CrColors.muted),
                                  const SizedBox(height: 2),
                                  Text(items[i].$3,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: i == idx ? FontWeight.w700 : FontWeight.w500,
                                        color: i == idx ? CrColors.teal : CrColors.muted,
                                      )),
                                ]),
                              ),
                            ),
                          ),
                      ]),
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}

/// Language switch button used in the top bars (cycles ar -> ku -> en).
class CrLangButton extends StatelessWidget {
  const CrLangButton({super.key});
  @override
  Widget build(BuildContext context) {
    final next = switch (CrI18n.lang) { 'ar' => const Locale('ku'), 'ku' => const Locale('en'), _ => const Locale('ar') };
    final label = switch (CrI18n.lang) { 'ar' => 'کوردی', 'ku' => 'English', _ => 'عربي' };
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 8),
      child: InkWell(
        onTap: () => context.setLocale(next),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(color: CrColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: CrColors.line)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.language_rounded, size: 16, color: CrColors.ink),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          ]),
        ),
      ),
    );
  }
}
