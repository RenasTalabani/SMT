class ExerciseModel {
  final String id;
  final String name;
  final String description;
  final String category;
  final List<String> muscleGroups;
  final List<String> equipment;
  final String difficulty;
  final List<ExerciseInstructionModel> instructions;
  final List<ExerciseMediaModel> images;
  final List<ExerciseVideoModel> videos;
  final List<String> tips;
  final int? sets;
  final int? reps;
  final int? restTime; // seconds
  final Map<String, dynamic>? createdBy;

  const ExerciseModel({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    this.muscleGroups = const [],
    this.equipment = const [],
    this.difficulty = 'beginner',
    this.instructions = const [],
    this.images = const [],
    this.videos = const [],
    this.tips = const [],
    this.sets,
    this.reps,
    this.restTime,
    this.createdBy,
  });

  factory ExerciseModel.fromJson(Map<String, dynamic> json) {
    return ExerciseModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? '',
      muscleGroups: List<String>.from(json['muscleGroups'] ?? []),
      equipment: List<String>.from(json['equipment'] ?? []),
      difficulty: json['difficulty'] ?? 'beginner',
      instructions: (json['instructions'] as List<dynamic>? ?? [])
          .map((e) => ExerciseInstructionModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      images: (json['images'] as List<dynamic>? ?? [])
          .map((e) => ExerciseMediaModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      videos: (json['videos'] as List<dynamic>? ?? [])
          .map((e) => ExerciseVideoModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      tips: (json['tips'] as List<dynamic>? ?? [])
          .map((e) => (e is Map) ? (e['tip'] ?? '') as String : e.toString())
          .where((t) => t.isNotEmpty)
          .toList(),
      sets: json['sets']?['recommended'],
      reps: json['reps']?['recommended'],
      restTime: json['restTime'],
      createdBy: json['createdBy'] is Map ? json['createdBy'] as Map<String, dynamic> : null,
    );
  }

  String? get primaryVideoUrl => videos.isNotEmpty ? videos.first.url : null;
  String? get primaryImageUrl => images.isNotEmpty ? images.first.url : null;

  String get difficultyLabel {
    switch (difficulty) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      default: return difficulty;
    }
  }

  String get categoryLabel {
    switch (category) {
      case 'strength': return 'Strength';
      case 'cardio': return 'Cardio';
      case 'flexibility': return 'Flexibility';
      case 'balance': return 'Balance';
      case 'sports': return 'Sports';
      case 'functional': return 'Functional';
      default: return category;
    }
  }

  String get muscleGroupsLabel => muscleGroups
      .map((m) => m.replaceAll('_', ' '))
      .map((m) => m[0].toUpperCase() + m.substring(1))
      .join(', ');
}

class ExerciseInstructionModel {
  final int step;
  final String instruction;

  const ExerciseInstructionModel({required this.step, required this.instruction});

  factory ExerciseInstructionModel.fromJson(Map<String, dynamic> json) =>
      ExerciseInstructionModel(
        step: json['step'] ?? 0,
        instruction: json['instruction'] ?? '',
      );
}

class ExerciseMediaModel {
  final String url;
  final String alt;
  final bool isPrimary;

  const ExerciseMediaModel({required this.url, this.alt = '', this.isPrimary = false});

  factory ExerciseMediaModel.fromJson(Map<String, dynamic> json) =>
      ExerciseMediaModel(
        url: json['url'] ?? '',
        alt: json['alt'] ?? '',
        isPrimary: json['isPrimary'] ?? false,
      );
}

class ExerciseVideoModel {
  final String url;
  final String title;
  final String? thumbnail;
  final int? duration;

  const ExerciseVideoModel({
    required this.url,
    this.title = '',
    this.thumbnail,
    this.duration,
  });

  factory ExerciseVideoModel.fromJson(Map<String, dynamic> json) =>
      ExerciseVideoModel(
        url: json['url'] ?? '',
        title: json['title'] ?? '',
        thumbnail: json['thumbnail'],
        duration: json['duration'],
      );
}
