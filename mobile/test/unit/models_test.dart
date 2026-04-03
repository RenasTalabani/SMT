import 'package:flutter_test/flutter_test.dart';
import 'package:citygym/models/user_model.dart';
import 'package:citygym/models/workout_model.dart';
import 'package:citygym/models/exercise_model.dart';

void main() {
  // ─── UserModel ───────────────────────────────────────────────────────────────

  group('UserModel', () {
    final json = {
      '_id': 'u1',
      'name': 'John Doe',
      'email': 'john@example.com',
      'role': 'client',
      'isEmailVerified': true,
      'isApproved': true,
      'fitnessGoals': ['weight_loss', 'strength'],
      'height': 175.5,
      'weight': 80.0,
    };

    test('fromJson parses basic fields', () {
      final user = UserModel.fromJson(json);
      expect(user.id, 'u1');
      expect(user.name, 'John Doe');
      expect(user.email, 'john@example.com');
      expect(user.role, 'client');
      expect(user.isEmailVerified, true);
      expect(user.height, 175.5);
      expect(user.weight, 80.0);
      expect(user.fitnessGoals, ['weight_loss', 'strength']);
    });

    test('fromJson uses id fallback when _id missing', () {
      final user = UserModel.fromJson({...json, '_id': null, 'id': 'u2'});
      expect(user.id, 'u2');
    });

    test('fromJson defaults to empty string id when both missing', () {
      final user = UserModel.fromJson({'name': 'X', 'email': 'x@x.com', 'role': 'client'});
      expect(user.id, '');
    });

    test('role helpers', () {
      final client = UserModel.fromJson({...json, 'role': 'client'});
      final coach = UserModel.fromJson({...json, 'role': 'coach'});
      final admin = UserModel.fromJson({...json, 'role': 'admin'});
      expect(client.isClient, true);
      expect(client.isCoach, false);
      expect(coach.isCoach, true);
      expect(admin.isAdmin, true);
    });

    test('initials - two words', () {
      final user = UserModel.fromJson({...json, 'name': 'John Doe'});
      expect(user.initials, 'JD');
    });

    test('initials - one word', () {
      final user = UserModel.fromJson({...json, 'name': 'Madonna'});
      expect(user.initials, 'M');
    });

    test('initials - empty name returns ?', () {
      final user = UserModel.fromJson({...json, 'name': ''});
      expect(user.initials, '?');
    });

    test('toJson includes required fields', () {
      final user = UserModel.fromJson(json);
      final out = user.toJson();
      expect(out['name'], 'John Doe');
      expect(out['email'], 'john@example.com');
      expect(out['role'], 'client');
    });
  });

  // ─── WorkoutExerciseModel ────────────────────────────────────────────────────

  group('WorkoutExerciseModel', () {
    test('fromJson parses fields with defaults', () {
      final ex = WorkoutExerciseModel.fromJson({
        '_id': 'e1',
        'sets': 4,
        'reps': 12,
        'weight': 60.5,
        'restTime': 90,
        'order': 1,
      });
      expect(ex.id, 'e1');
      expect(ex.sets, 4);
      expect(ex.reps, 12);
      expect(ex.weight, 60.5);
      expect(ex.restTime, 90);
      expect(ex.completed, false);
    });

    test('fromJson defaults sets to 3 when missing', () {
      final ex = WorkoutExerciseModel.fromJson({'_id': 'e2'});
      expect(ex.sets, 3);
    });

    test('restLabel - under 60 seconds', () {
      final ex = WorkoutExerciseModel.fromJson({'_id': 'e', 'restTime': 45});
      expect(ex.restLabel, '45s rest');
    });

    test('restLabel - exact minutes', () {
      final ex = WorkoutExerciseModel.fromJson({'_id': 'e', 'restTime': 120});
      expect(ex.restLabel, '2m rest');
    });

    test('restLabel - minutes and seconds', () {
      final ex = WorkoutExerciseModel.fromJson({'_id': 'e', 'restTime': 90});
      expect(ex.restLabel, '1m 30s rest');
    });

    test('restLabel - null returns empty', () {
      final ex = WorkoutExerciseModel.fromJson({'_id': 'e'});
      expect(ex.restLabel, '');
    });

    test('setsRepsLabel - with reps', () {
      final ex = WorkoutExerciseModel.fromJson({'_id': 'e', 'sets': 3, 'reps': 10});
      expect(ex.setsRepsLabel, '3 × 10 reps');
    });

    test('setsRepsLabel - with duration seconds', () {
      final ex = WorkoutExerciseModel.fromJson({'_id': 'e', 'sets': 3, 'duration': 30});
      expect(ex.setsRepsLabel, '3 × 30s');
    });

    test('setsRepsLabel - with duration minutes', () {
      final ex = WorkoutExerciseModel.fromJson({'_id': 'e', 'sets': 3, 'duration': 60});
      expect(ex.setsRepsLabel, '3 × 1m ');
    });

    test('setsRepsLabel - sets only', () {
      final ex = WorkoutExerciseModel.fromJson({'_id': 'e', 'sets': 4});
      expect(ex.setsRepsLabel, '4 sets');
    });
  });

  // ─── WorkoutDayModel ─────────────────────────────────────────────────────────

  group('WorkoutDayModel', () {
    final dayJson = {
      '_id': 'd1',
      'day': 1,
      'name': 'Chest Day',
      'exercises': [
        {'_id': 'e1', 'sets': 3, 'completed': true, 'order': 1},
        {'_id': 'e2', 'sets': 3, 'completed': false, 'order': 2},
        {'_id': 'e3', 'sets': 3, 'completed': true, 'order': 3},
      ],
    };

    test('fromJson parses exercises and sorts by order', () {
      final day = WorkoutDayModel.fromJson(dayJson);
      expect(day.totalExercises, 3);
      expect(day.completedExercises, 2);
    });

    test('progressPercent is correct', () {
      final day = WorkoutDayModel.fromJson(dayJson);
      expect(day.progressPercent, closeTo(2 / 3, 0.001));
    });

    test('progressPercent is 0 when no exercises', () {
      final day = WorkoutDayModel.fromJson({'_id': 'd', 'day': 1, 'name': 'Rest'});
      expect(day.progressPercent, 0.0);
    });
  });

  // ─── WorkoutPlanModel ────────────────────────────────────────────────────────

  group('WorkoutPlanModel', () {
    final planJson = {
      '_id': 'p1',
      'title': 'Beginner Strength',
      'description': '4 week program',
      'difficulty': 'beginner',
      'category': 'strength',
      'status': 'active',
      'duration': 4,
      'frequency': 3,
      'isTemplate': false,
      'goals': ['strength'],
      'tags': ['beginner', 'gym'],
      'workouts': [],
    };

    test('fromJson parses all fields', () {
      final plan = WorkoutPlanModel.fromJson(planJson);
      expect(plan.id, 'p1');
      expect(plan.title, 'Beginner Strength');
      expect(plan.difficulty, 'beginner');
      expect(plan.category, 'strength');
      expect(plan.status, 'active');
      expect(plan.duration, 4);
      expect(plan.isTemplate, false);
      expect(plan.goals, ['strength']);
    });

    test('difficultyLabel maps correctly', () {
      expect(WorkoutPlanModel.fromJson({...planJson, 'difficulty': 'beginner'}).difficultyLabel, 'Beginner');
      expect(WorkoutPlanModel.fromJson({...planJson, 'difficulty': 'intermediate'}).difficultyLabel, 'Intermediate');
      expect(WorkoutPlanModel.fromJson({...planJson, 'difficulty': 'advanced'}).difficultyLabel, 'Advanced');
      expect(WorkoutPlanModel.fromJson({...planJson, 'difficulty': 'custom'}).difficultyLabel, 'custom');
    });

    test('categoryLabel maps correctly', () {
      expect(WorkoutPlanModel.fromJson({...planJson, 'category': 'strength'}).categoryLabel, 'Strength');
      expect(WorkoutPlanModel.fromJson({...planJson, 'category': 'cardio'}).categoryLabel, 'Cardio');
      expect(WorkoutPlanModel.fromJson({...planJson, 'category': 'weight_loss'}).categoryLabel, 'Weight Loss');
      expect(WorkoutPlanModel.fromJson({...planJson, 'category': 'muscle_gain'}).categoryLabel, 'Muscle Gain');
    });

    test('coachName from createdBy map', () {
      final plan = WorkoutPlanModel.fromJson({
        ...planJson,
        'createdBy': {'_id': 'c1', 'name': 'Coach Ali'},
      });
      expect(plan.coachName, 'Coach Ali');
    });

    test('coachName defaults to Coach when missing', () {
      final plan = WorkoutPlanModel.fromJson(planJson);
      expect(plan.coachName, 'Coach');
    });

    test('overallProgress with no exercises is 0', () {
      final plan = WorkoutPlanModel.fromJson(planJson);
      expect(plan.overallProgress, 0.0);
      expect(plan.totalExercises, 0);
    });

    test('startDate parses ISO string', () {
      final plan = WorkoutPlanModel.fromJson({
        ...planJson,
        'startDate': '2024-01-15T00:00:00.000Z',
      });
      expect(plan.startDate, isNotNull);
      expect(plan.startDate!.year, 2024);
      expect(plan.startDate!.month, 1);
    });
  });

  // ─── ExerciseModel ───────────────────────────────────────────────────────────

  group('ExerciseModel', () {
    final json = {
      '_id': 'ex1',
      'name': 'Bench Press',
      'description': 'Chest press exercise',
      'category': 'strength',
      'muscleGroups': ['chest', 'triceps', 'front_shoulder'],
      'difficulty': 'intermediate',
      'instructions': [
        {'step': 1, 'instruction': 'Lie on bench'},
        {'step': 2, 'instruction': 'Press up'},
      ],
      'images': [
        {'url': 'http://example.com/img.jpg', 'alt': 'bench', 'isPrimary': true}
      ],
      'videos': [
        {'url': 'http://example.com/vid.mp4', 'title': 'Demo'}
      ],
    };

    test('fromJson parses all fields', () {
      final ex = ExerciseModel.fromJson(json);
      expect(ex.id, 'ex1');
      expect(ex.name, 'Bench Press');
      expect(ex.category, 'strength');
      expect(ex.muscleGroups, ['chest', 'triceps', 'front_shoulder']);
      expect(ex.difficulty, 'intermediate');
      expect(ex.instructions.length, 2);
      expect(ex.images.length, 1);
      expect(ex.videos.length, 1);
    });

    test('primaryVideoUrl returns first video', () {
      final ex = ExerciseModel.fromJson(json);
      expect(ex.primaryVideoUrl, 'http://example.com/vid.mp4');
    });

    test('primaryImageUrl returns first image', () {
      final ex = ExerciseModel.fromJson(json);
      expect(ex.primaryImageUrl, 'http://example.com/img.jpg');
    });

    test('primaryVideoUrl null when no videos', () {
      final ex = ExerciseModel.fromJson({...json, 'videos': []});
      expect(ex.primaryVideoUrl, isNull);
    });

    test('difficultyLabel maps correctly', () {
      expect(ExerciseModel.fromJson({...json, 'difficulty': 'beginner'}).difficultyLabel, 'Beginner');
      expect(ExerciseModel.fromJson({...json, 'difficulty': 'intermediate'}).difficultyLabel, 'Intermediate');
      expect(ExerciseModel.fromJson({...json, 'difficulty': 'advanced'}).difficultyLabel, 'Advanced');
    });

    test('categoryLabel maps correctly', () {
      expect(ExerciseModel.fromJson({...json, 'category': 'strength'}).categoryLabel, 'Strength');
      expect(ExerciseModel.fromJson({...json, 'category': 'cardio'}).categoryLabel, 'Cardio');
      expect(ExerciseModel.fromJson({...json, 'category': 'flexibility'}).categoryLabel, 'Flexibility');
    });

    test('muscleGroupsLabel formats underscores and capitalises', () {
      final ex = ExerciseModel.fromJson({...json, 'muscleGroups': ['front_shoulder', 'chest']});
      expect(ex.muscleGroupsLabel, 'Front shoulder, Chest');
    });

    test('fromJson handles empty muscleGroups', () {
      final ex = ExerciseModel.fromJson({...json, 'muscleGroups': null});
      expect(ex.muscleGroups, isEmpty);
    });

    test('instructions are parsed in order', () {
      final ex = ExerciseModel.fromJson(json);
      expect(ex.instructions.first.step, 1);
      expect(ex.instructions.first.instruction, 'Lie on bench');
      expect(ex.instructions.last.step, 2);
    });
  });
}
