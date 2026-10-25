import 'package:flutter_test/flutter_test.dart';
import 'package:citygym/models/workout_model.dart';

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

  // The HealthToolsScreen BMI / calories check moved to test/i18n_all_screens_test.dart,
  // because the screen's text now comes from the translation files.
}
