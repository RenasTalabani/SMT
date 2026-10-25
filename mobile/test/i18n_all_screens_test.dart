import 'dart:convert';
import 'dart:io';

import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citygym/main.dart' show appLocalizationDelegates;
import 'package:citygym/screens/ai/ai_nutrition_screen.dart';
import 'package:citygym/screens/ai/ai_progress_screen.dart';
import 'package:citygym/screens/ai/ai_workout_screen.dart';
import 'package:citygym/screens/client/change_password_screen.dart';
import 'package:citygym/screens/client/health_tools_screen.dart';

Map<String, String> _load(String lang) =>
    (jsonDecode(File('assets/translations/$lang.json').readAsStringSync()) as Map<String, dynamic>)
        .map((k, v) => MapEntry(k, '$v'));

List<File> _dartFiles() => Directory('lib')
    .listSync(recursive: true)
    .whereType<File>()
    .where((f) => f.path.endsWith('.dart'))
    .toList();

String _slug(String v) => 'v_${v.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '_').replaceAll(RegExp(r'^_+|_+$'), '')}';

/// Pumps [screen] inside EasyLocalization with the real translation files,
/// at a phone size, in [locale]. Fails on overflow or exceptions.
Future<void> _pumpLocalized(WidgetTester tester, Widget screen, Locale locale,
    {Size size = const Size(360, 740)}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('ar'), Locale('ku')],
      path: 'assets/translations',
      fallbackLocale: const Locale('en'),
      startLocale: locale,
      saveLocale: false,
      child: ProviderScope(
        child: Builder(
          builder: (context) => MaterialApp(
            locale: context.locale,
            supportedLocales: context.supportedLocales,
            localizationsDelegates: appLocalizationDelegates(context),
            home: screen,
          ),
        ),
      ),
    ),
  );
  // EasyLocalization loads the JSON asynchronously.
  for (var i = 0; i < 200 && find.byWidget(screen).evaluate().isEmpty; i++) {
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
    await tester.pump(const Duration(milliseconds: 50));
  }
  for (var i = 0; i < 4; i++) {
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
    await tester.pump(const Duration(milliseconds: 100));
  }
  expect(tester.takeException(), isNull);
  // The real app direction: Arabic and Kurdish must be right-to-left.
  final dir = Directionality.of(tester.element(find.byWidget(screen)));
  expect(dir, locale.languageCode == 'en' ? TextDirection.ltr : TextDirection.rtl,
      reason: 'wrong text direction for ${locale.languageCode}');
}


void main() {
  final en = _load('en'), ar = _load('ar'), ku = _load('ku');

  group('Every screen uses the translation files', () {
    test('every key used with .tr() exists in en.json (so in ar/ku too)', () {
      final used = <String>{};
      final re = RegExp(r"""'([a-z0-9_]+)'\s*\.tr\(""");
      for (final f in _dartFiles()) {
        for (final m in re.allMatches(f.readAsStringSync())) {
          used.add(m.group(1)!);
        }
      }
      expect(used.length, greaterThan(400));
      final missing = used.where((k) => !en.containsKey(k)).toList();
      expect(missing, isEmpty, reason: 'keys used in code but missing in en.json: $missing');
    });

    test('every trv() data value has an English, Arabic and Kurdish entry', () {
      final re = RegExp(r"""trv\('([^']+)'\)""");
      final missing = <String>[];
      for (final f in _dartFiles()) {
        for (final m in re.allMatches(f.readAsStringSync())) {
          final k = _slug(m.group(1)!);
          if (!en.containsKey(k) || !ar.containsKey(k) || !ku.containsKey(k)) missing.add(k);
        }
      }
      expect(missing, isEmpty, reason: '$missing');
    });

    test('placeholders like {name} match in Arabic and Kurdish', () {
      final ph = RegExp(r'\{[A-Za-z0-9_]+\}');
      final bad = <String>[];
      en.forEach((k, v) {
        final want = ph.allMatches(v).map((m) => m.group(0)).toSet();
        for (final lang in [ar, ku]) {
          final got = ph.allMatches(lang[k] ?? '').map((m) => m.group(0)).toSet();
          if (want.difference(got).isNotEmpty || got.difference(want).isNotEmpty) bad.add(k);
        }
      });
      expect(bad, isEmpty, reason: 'placeholder mismatch: $bad');
    });

    test('no hard-coded English Text(...) left in screens and widgets', () {
      // A capitalised word followed by more words inside Text('...') means
      // a sentence that would stay English in Arabic and Kurdish.
      final re = RegExp(r"""Text\(\s*'[A-Z][a-z]+ [A-Za-z ]+[.!?]?'\s*[,)]""");
      final offenders = <String>[];
      for (final f in _dartFiles().where((f) =>
          f.path.contains('screens') || f.path.contains('widgets'))) {
        final lines = f.readAsLinesSync();
        for (var i = 0; i < lines.length; i++) {
          if (re.hasMatch(lines[i])) offenders.add('${f.path}:${i + 1}');
        }
      }
      expect(offenders, isEmpty, reason: '$offenders');
    });

    test('Arabic and Kurdish are really translated (not copies of English)', () {
      var same = 0;
      en.forEach((k, v) {
        if (ar[k] == v && RegExp(r'[a-z]{3}').hasMatch(v)) same++;
        if (ku[k] == v && RegExp(r'[a-z]{3}').hasMatch(v)) same++;
      });
      expect(same, lessThan(10));
    });
  });

  group('Screens render translated, right-to-left, on a phone', () {
    setUpAll(() async {
      SharedPreferences.setMockInitialValues({});
      TestWidgetsFlutterBinding.ensureInitialized();
      await EasyLocalization.ensureInitialized();
    });
    // rootBundle caches each translation file as a Future created inside the
    // previous test's fake-async zone; that Future never completes in the next
    // test. Clearing the cache makes every test load the files fresh.
    setUp(() => rootBundle.clear());

    final screens = <String, Widget Function()>{
      'Health tools': () => const HealthToolsScreen(),
      'AI nutrition': () => const AiNutritionScreen(),
      'AI workout': () => const AiWorkoutScreen(),
      'AI progress': () => const AiProgressScreen(),
      'Change password': () => const ChangePasswordScreen(),
    };
    final expectText = <String, String>{
      'Health tools': 'health_tools',
      'AI nutrition': 'ai_nutrition_advisor',
      'AI workout': 'ai_workout_generator',
      'AI progress': 'ai_progress_analysis',
      'Change password': 'change_password',
    };

    testWidgets('Health tools shows BMI and calories for the default person (English)', (tester) async {
      const w = HealthToolsScreen();
      await _pumpLocalized(tester, w, const Locale('en'), size: const Size(1080, 2400));
      // 75 kg / (1.75 m)^2 = 24.5 -> healthy weight
      expect(find.textContaining('24.5'), findsOneWidget);
      expect(find.textContaining('Healthy weight'), findsOneWidget);
      // Mifflin-St Jeor: 10*75 + 6.25*175 - 5*28 + 5 = 1709 kcal resting
      expect(find.textContaining('1709 kcal'), findsOneWidget);
    });

    testWidgets('Health tools shows the BMI label in Kurdish', (tester) async {
      const w = HealthToolsScreen();
      await _pumpLocalized(tester, w, const Locale('ku'), size: const Size(1080, 2400));
      expect(find.textContaining(ku['healthy_weight']!), findsOneWidget);
      expect(find.textContaining('1709'), findsOneWidget);
    });

    for (final entry in screens.entries) {
      for (final lang in ['ar', 'ku', 'en']) {
        testWidgets('${entry.key} in $lang', (tester) async {
          final w = entry.value();
          await _pumpLocalized(tester, w, Locale(lang));
          final table = lang == 'ar' ? ar : lang == 'ku' ? ku : en;
          final want = table[expectText[entry.key]]!;
          expect(find.text(want), findsWidgets, reason: 'expected "$want" on ${entry.key} in $lang');
        });
      }
      testWidgets('${entry.key} fits a 320px phone in Kurdish', (tester) async {
        final w = entry.value();
        await _pumpLocalized(tester, w, const Locale('ku'), size: const Size(320, 640));
      });
    }
  });
}
