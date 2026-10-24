import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:citygym/models/workout_model.dart';
import 'package:citygym/screens/client/health_tools_screen.dart';

void main() {
  group('WorkoutExerciseModel', () {
    test('keeps the free-text name of AI-generated exercises', () {
      final m = WorkoutExerciseModel.fromJson({
        '_id': 'x1',
        'exercise': null,
        'name': 'Goblet Squat',
        'sets': 3,
        'reps': 12,
      });
      expect(m.name, 'Goblet Squat');
      expect(m.exercise, isNull);
      expect(m.setsRepsLabel, contains('12 reps'));
    });
  });

  group('HealthToolsScreen', () {
    testWidgets('shows BMI and calories for the default person', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(const MaterialApp(home: HealthToolsScreen()));
      // 75 kg / (1.75 m)^2 = 24.5 -> healthy weight
      expect(find.textContaining('24.5'), findsOneWidget);
      expect(find.textContaining('Healthy weight'), findsOneWidget);
      // Mifflin-St Jeor: 10*75 + 6.25*175 - 5*28 + 5 = 1709 kcal resting
      expect(find.textContaining('1709 kcal'), findsOneWidget);
    });
  });
}
