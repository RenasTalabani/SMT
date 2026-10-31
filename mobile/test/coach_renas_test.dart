// Coach Renas module: data files load, translations exist, and the main
// screens render without overflow in Arabic, Kurdish and English on a 360px phone.
import 'package:citygym/coach_renas/cr_core.dart';
import 'package:citygym/coach_renas/screens/cr_food_shop_screens.dart';
import 'package:citygym/coach_renas/screens/cr_train_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late CrData data;

  setUpAll(() async {
    data = await CrData.load();
  });

  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('data: exercises, Iraqi foods, programs and dictionaries are loaded', () {
    expect(data.exercises.length, greaterThan(400));
    expect(data.foods.length, greaterThan(200));
    expect(data.list('PROGRAMS'), isNotEmpty);
    expect(CrI18n.ku['الرئيسية'], isNotNull);
    expect(CrI18n.en['المتجر'], 'Store');
    // every program day points to a real exercise
    for (final p in data.list('PROGRAMS')) {
      for (final day in (p['days'] as List? ?? const [])) {
        for (final id in (day[1] as List)) {
          expect(data.exMap[id], isNotNull, reason: 'program ${p['id']} uses missing exercise $id');
        }
      }
    }
  });

  test('T() translates and fills placeholders', () {
    CrI18n.lang = 'en';
    expect(T('المتجر'), 'Store');
    expect(T('سِت القمة: {w} كغ', {'w': 29}), contains('29'));
    CrI18n.lang = 'ku';
    expect(T('المتجر'), 'فرۆشگا');
    CrI18n.lang = 'ar';
    expect(T('المتجر'), 'المتجر');
  });

  test('calorie targets use the prototype formula and floors', () {
    final st = CrState()..s = CrState.seed(data);
    final t = st.targets();
    expect(t['kcal']!, greaterThanOrEqualTo(1500));
    expect(t['pLo'], (78 * 1.6).round());
    expect(e1rm(28, 6), closeTo(33.6, 0.01));
  });

  final screens = <String, Widget Function()>{
    'home': () => const CrHomeScreen(),
    'train': () => const CrTrainScreen(),
    'goal': () => const CrGoalScreen(),
    'workout': () => const CrWorkoutScreen(),
    'library': () => const CrLibraryScreen(),
    'food': () => const CrFoodScreen(),
    'supps': () => const CrSuppsScreen(),
    'hormones': () => const CrHormonesScreen(),
    'shop': () => const CrShopScreen(),
  };

  for (final lang in ['ar', 'ku', 'en']) {
    for (final e in screens.entries) {
      testWidgets('${e.key} renders in $lang at 360px', (tester) async {
        tester.view.physicalSize = const Size(360, 780);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.reset);
        CrI18n.lang = lang;
        await tester.pumpWidget(ProviderScope(
          overrides: [crDataProvider.overrideWith((ref) async => data)],
          child: MaterialApp(theme: crTheme(), home: e.value()),
        ));
        for (var i = 0; i < 6; i++) {
          await tester.pump(const Duration(milliseconds: 50));
        }
        expect(tester.takeException(), isNull);
        expect(find.byType(Scaffold), findsWidgets);
        // real content, not the loading spinner
        expect(find.byType(CircularProgressIndicator), findsNothing, reason: 'still loading');
        expect(find.byType(ListView), findsWidgets);
        final want = lang == 'en' ? TextDirection.ltr : TextDirection.rtl;
        expect(find.byWidgetPredicate((w) => w is Directionality && w.textDirection == want), findsWidgets);
      });
    }
  }
}
