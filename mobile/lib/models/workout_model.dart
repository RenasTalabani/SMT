import 'exercise_model.dart';

// ---------------------------------------------------------------------------
// Per-exercise entry inside a workout day
// ---------------------------------------------------------------------------

class WorkoutExerciseModel {
  final String id;
  final ExerciseModel? exercise; // populated
  final String? exerciseId;      // raw ID when not populated
  final int sets;
  final int? reps;
  final double? weight; // kg
  final int? restTime; // seconds
  final int? duration; // seconds (timed exercises)
  final String? notes;
  final int order;
  final bool completed;

  const WorkoutExerciseModel({
    required this.id,
    this.exercise,
    this.exerciseId,
    required this.sets,
    this.reps,
    this.weight,
    this.restTime,
    this.duration,
    this.notes,
    this.order = 0,
    this.completed = false,
  });

  factory WorkoutExerciseModel.fromJson(Map<String, dynamic> json) {
    ExerciseModel? ex;
    String? exId;
    final rawExercise = json['exercise'];
    if (rawExercise is Map<String, dynamic>) {
      ex = ExerciseModel.fromJson(rawExercise);
    } else if (rawExercise is String) {
      exId = rawExercise;
    }

    return WorkoutExerciseModel(
      id: json['_id'] ?? json['id'] ?? '',
      exercise: ex,
      exerciseId: exId,
      sets: json['sets'] ?? 3,
      reps: json['reps'],
      weight: json['weight']?.toDouble(),
      restTime: json['restTime'],
      duration: json['duration'],
      notes: json['notes'],
      order: json['order'] ?? 0,
      completed: json['completed'] ?? false,
    );
  }

  String get restLabel {
    if (restTime == null) return '';
    if (restTime! >= 60) {
      final m = restTime! ~/ 60;
      final s = restTime! % 60;
      return s == 0 ? '${m}m rest' : '${m}m ${s}s rest';
    }
    return '${restTime}s rest';
  }

  String get setsRepsLabel {
    if (reps != null) return '$sets × $reps reps';
    if (duration != null) {
      final d = duration!;
      return d >= 60 ? '$sets × ${d ~/ 60}m ${d % 60 > 0 ? '${d % 60}s' : ''}' : '$sets × ${d}s';
    }
    return '$sets sets';
  }
}

// ---------------------------------------------------------------------------
// A single workout day inside a plan
// ---------------------------------------------------------------------------

class WorkoutDayModel {
  final String id;
  final int day;
  final String name;
  final String? description;
  final int? estimatedDuration; // minutes
  final List<WorkoutExerciseModel> exercises;
  final String? warmUp;
  final String? coolDown;

  const WorkoutDayModel({
    required this.id,
    required this.day,
    required this.name,
    this.description,
    this.estimatedDuration,
    this.exercises = const [],
    this.warmUp,
    this.coolDown,
  });

  factory WorkoutDayModel.fromJson(Map<String, dynamic> json) =>
      WorkoutDayModel(
        id: json['_id'] ?? json['id'] ?? '',
        day: json['day'] ?? 1,
        name: json['name'] ?? 'Workout',
        description: json['description'],
        estimatedDuration: json['estimatedDuration'],
        exercises: (json['exercises'] as List<dynamic>? ?? [])
            .map((e) => WorkoutExerciseModel.fromJson(e as Map<String, dynamic>))
            .toList()
          ..sort((a, b) => a.order.compareTo(b.order)),
        warmUp: json['warmUp'],
        coolDown: json['coolDown'],
      );

  int get totalExercises => exercises.length;
  int get completedExercises => exercises.where((e) => e.completed).length;
  double get progressPercent =>
      totalExercises == 0 ? 0.0 : completedExercises / totalExercises;
}

// ---------------------------------------------------------------------------
// Top-level workout plan
// ---------------------------------------------------------------------------

class WorkoutPlanModel {
  final String id;
  final String title;
  final String description;
  final String? difficulty;
  final String? category;
  final String? status;
  final int? duration; // weeks
  final int? frequency; // days/week
  final Map<String, dynamic>? createdBy;
  final Map<String, dynamic>? assignedTo;
  final bool isTemplate;
  final DateTime? startDate;
  final DateTime? endDate;
  final List<WorkoutDayModel> workouts;
  final List<String> goals;
  final List<String> tags;

  const WorkoutPlanModel({
    required this.id,
    required this.title,
    required this.description,
    this.difficulty,
    this.category,
    this.status,
    this.duration,
    this.frequency,
    this.createdBy,
    this.assignedTo,
    this.isTemplate = false,
    this.startDate,
    this.endDate,
    this.workouts = const [],
    this.goals = const [],
    this.tags = const [],
  });

  factory WorkoutPlanModel.fromJson(Map<String, dynamic> json) => WorkoutPlanModel(
        id: json['_id'] ?? json['id'] ?? '',
        title: json['title'] ?? '',
        description: json['description'] ?? '',
        difficulty: json['difficulty'],
        category: json['category'],
        status: json['status'],
        duration: json['duration'],
        frequency: json['frequency'],
        createdBy: json['createdBy'] is Map ? json['createdBy'] as Map<String, dynamic> : null,
        assignedTo: json['assignedTo'] is Map ? json['assignedTo'] as Map<String, dynamic> : null,
        isTemplate: json['isTemplate'] ?? false,
        startDate: json['startDate'] != null ? DateTime.tryParse(json['startDate']) : null,
        endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate']) : null,
        workouts: (json['workouts'] as List<dynamic>? ?? [])
            .map((e) => WorkoutDayModel.fromJson(e as Map<String, dynamic>))
            .toList()
          ..sort((a, b) => a.day.compareTo(b.day)),
        goals: List<String>.from(json['goals'] ?? []),
        tags: List<String>.from(json['tags'] ?? []),
      );

  int get totalExercises => workouts.fold(0, (sum, w) => sum + w.totalExercises);
  int get completedExercises => workouts.fold(0, (sum, w) => sum + w.completedExercises);
  double get overallProgress =>
      totalExercises == 0 ? 0.0 : completedExercises / totalExercises;

  String get coachName => (createdBy?['name'] as String?) ?? 'Coach';

  String get difficultyLabel {
    switch (difficulty) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      default: return difficulty ?? '';
    }
  }

  String get categoryLabel {
    switch (category) {
      case 'strength': return 'Strength';
      case 'cardio': return 'Cardio';
      case 'mixed': return 'Mixed';
      case 'weight_loss': return 'Weight Loss';
      case 'muscle_gain': return 'Muscle Gain';
      case 'endurance': return 'Endurance';
      case 'flexibility': return 'Flexibility';
      default: return category ?? '';
    }
  }
}
