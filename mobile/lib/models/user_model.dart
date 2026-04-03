class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? avatar;
  final bool isEmailVerified;
  final bool isApproved;
  final String? specialization;
  final String? bio;
  final double? rating;
  final int? reviewCount;
  final double? hourlyRate;
  final String? phone;
  final double? height;
  final double? weight;
  final List<String> fitnessGoals;
  final String? experienceLevel;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.avatar,
    this.isEmailVerified = false,
    this.isApproved = false,
    this.specialization,
    this.bio,
    this.rating,
    this.reviewCount,
    this.hourlyRate,
    this.phone,
    this.height,
    this.weight,
    this.fitnessGoals = const [],
    this.experienceLevel,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] ?? json['_id'] ?? '',
        name: json['name'] ?? '',
        email: json['email'] ?? '',
        role: json['role'] ?? 'client',
        avatar: json['avatar'],
        isEmailVerified: json['isEmailVerified'] ?? false,
        isApproved: json['isApproved'] ?? false,
        specialization: json['specialization'],
        bio: json['bio'],
        rating: (json['rating'] as num?)?.toDouble(),
        reviewCount: json['reviewCount'],
        hourlyRate: (json['hourlyRate'] as num?)?.toDouble(),
        phone: json['phone'],
        height: (json['height'] as num?)?.toDouble(),
        weight: (json['weight'] as num?)?.toDouble(),
        fitnessGoals: List<String>.from(json['fitnessGoals'] ?? []),
        experienceLevel: json['experienceLevel'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        if (avatar != null) 'avatar': avatar,
        if (phone != null) 'phone': phone,
        if (height != null) 'height': height,
        if (weight != null) 'weight': weight,
        if (experienceLevel != null) 'experienceLevel': experienceLevel,
      };

  bool get isClient => role == 'client';
  bool get isCoach => role == 'coach';
  bool get isAdmin => role == 'admin';

  String get initials {
    final parts = name.trim().split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }
}
