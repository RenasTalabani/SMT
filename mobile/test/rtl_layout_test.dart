import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:citygym/screens/client/health_tools_screen.dart';
import 'package:citygym/widgets/empty_state.dart';
import 'package:citygym/widgets/error_view.dart';
import 'package:citygym/widgets/loading_shimmer.dart';

/// Pumps [child] at a phone size in the given text direction and fails on
/// any layout overflow or exception (Flutter reports overflows as errors).
Future<void> pumpPhone(WidgetTester tester, Widget child,
    {TextDirection dir = TextDirection.rtl, Size size = const Size(360, 740)}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(MaterialApp(
    home: Directionality(textDirection: dir, child: child),
  ));
  await tester.pump(const Duration(milliseconds: 300));
  expect(tester.takeException(), isNull);
}

Map<String, String> _flat(Map<String, dynamic> m, [String p = '']) {
  final out = <String, String>{};
  m.forEach((k, v) {
    if (v is Map<String, dynamic>) {
      out.addAll(_flat(v, '$p$k.'));
    } else {
      out['$p$k'] = '$v';
    }
  });
  return out;
}

void main() {
  group('Translations', () {
    final files = {
      for (final l in ['en', 'ar', 'ku'])
        l: _flat(jsonDecode(File('assets/translations/$l.json').readAsStringSync())
            as Map<String, dynamic>)
    };
    for (final l in ['ar', 'ku']) {
      test('$l has every English key and no empty values', () {
        final missing = files['en']!.keys.toSet().difference(files[l]!.keys.toSet());
        expect(missing, isEmpty, reason: 'missing in $l: $missing');
        final empty = files[l]!.entries.where((e) => e.value.trim().isEmpty);
        expect(empty, isEmpty);
      });
    }
  });

  group('RTL phone layouts (Arabic / Kurdish direction)', () {
    for (final dir in [TextDirection.rtl, TextDirection.ltr]) {
      testWidgets('Health tools screen lays out without overflow ($dir)', (tester) async {
        await pumpPhone(tester, const HealthToolsScreen(), dir: dir);
        expect(find.byType(HealthToolsScreen), findsOneWidget);
      });
    }

    testWidgets('Health tools fits a small 320px phone in RTL', (tester) async {
      await pumpPhone(tester, const HealthToolsScreen(), size: const Size(320, 640));
    });

    testWidgets('ErrorView shows message and retry in RTL', (tester) async {
      var retried = 0;
      await pumpPhone(
          tester,
          Scaffold(
              body: ErrorView(
                  message: 'تعذر تحميل البيانات', onRetry: () => retried++)));
      expect(find.text('تعذر تحميل البيانات'), findsOneWidget);
      await tester.tap(find.byWidgetPredicate((w) => w is OutlinedButton));
      expect(retried, 1);
    });

    testWidgets('EmptyState with action in RTL', (tester) async {
      var tapped = false;
      await pumpPhone(
          tester,
          Scaffold(
              body: EmptyState(
                  icon: Icons.inbox_outlined,
                  title: 'هیچ شتێک نییە',
                  subtitle: 'دواتر سەیر بکەرەوە',
                  actionLabel: 'دروستکردن',
                  onAction: () => tapped = true)));
      expect(find.text('هیچ شتێک نییە'), findsOneWidget);
      await tester.tap(find.text('دروستکردن'));
      expect(tapped, isTrue);
    });

    testWidgets('LoadingShimmer renders in RTL', (tester) async {
      await pumpPhone(tester, const Scaffold(body: LoadingShimmer(count: 4)));
      expect(find.byType(LoadingShimmer), findsOneWidget);
    });
  });
}
