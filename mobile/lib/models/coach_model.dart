class CoachModel {
  final String id;
  final String name;
  final String? avatar;
  final List<String> specialization;
  final String? bio;
  final double rating;
  final int reviewCount;
  final double? hourlyRate;
  final int? experienceYears;

  const CoachModel({
    required this.id,
    required this.name,
    this.avatar,
    required this.specialization,
    this.bio,
    required this.rating,
    required this.reviewCount,
    this.hourlyRate,
    this.experienceYears,
  });

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  String get primarySpecialty {
    if (specialization.isEmpty) return 'General Fitness';
    return _formatSpec(specialization[0]);
  }

  List<String> get formattedSpecialties =>
      specialization.map(_formatSpec).toList();

  static String _formatSpec(String s) {
    return s
        .replaceAll('_', ' ')
        .split(' ')
        .map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1))
        .join(' ');
  }

  factory CoachModel.fromJson(Map<String, dynamic> json) {
    final spec = (json['specialization'] as List?)
            ?.map((e) => e.toString())
            .toList() ??
        [];
    return CoachModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      avatar: json['avatar'],
      specialization: spec,
      bio: json['bio'],
      rating: (json['rating'] ?? 0).toDouble(),
      reviewCount: (json['reviewCount'] ?? 0).toInt(),
      hourlyRate: json['hourlyRate'] != null
          ? (json['hourlyRate'] as num).toDouble()
          : null,
      experienceYears: json['experienceYears'] != null
          ? (json['experienceYears'] as num).toInt()
          : null,
    );
  }
}
