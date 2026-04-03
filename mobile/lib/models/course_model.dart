class CourseModel {
  final String id;
  final String title;
  final String description;
  final String? category;
  final String? level;
  final double price;
  final int? duration;
  final String? thumbnail;
  final Map<String, dynamic>? instructor;
  final int enrolledCount;
  final double rating;
  final int reviewCount;
  final bool isPublished;
  final List<dynamic> content;
  final List<String> learningObjectives;
  final List<String> prerequisites;

  const CourseModel({
    required this.id,
    required this.title,
    required this.description,
    this.category,
    this.level,
    this.price = 0,
    this.duration,
    this.thumbnail,
    this.instructor,
    this.enrolledCount = 0,
    this.rating = 0,
    this.reviewCount = 0,
    this.isPublished = false,
    this.content = const [],
    this.learningObjectives = const [],
    this.prerequisites = const [],
  });

  factory CourseModel.fromJson(Map<String, dynamic> json) => CourseModel(
        id: json['_id'] ?? json['id'] ?? '',
        title: json['title'] ?? '',
        description: json['description'] ?? '',
        category: json['category'],
        level: json['level'],
        price: (json['price'] as num?)?.toDouble() ?? 0,
        duration: json['duration'],
        thumbnail: json['thumbnail'],
        instructor: json['instructor'] is Map ? json['instructor'] : null,
        enrolledCount: json['enrolledCount'] ?? 0,
        rating: (json['rating']?['average'] as num?)?.toDouble() ?? 0,
        reviewCount: json['rating']?['count'] ?? 0,
        isPublished: json['isPublished'] ?? false,
        content: json['content'] ?? [],
        learningObjectives:
            List<String>.from(json['learningObjectives'] ?? []),
        prerequisites: List<String>.from(json['prerequisites'] ?? []),
      );

  String get instructorName =>
      instructor?['name'] as String? ?? 'Unknown Instructor';
  String? get instructorAvatar => instructor?['avatar'] as String?;

  String get levelLabel {
    switch (level) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      case 'all_levels': return 'All Levels';
      default: return level ?? '';
    }
  }

  String get priceLabel =>
      price == 0 ? 'Free' : '\$${price.toStringAsFixed(2)}';
}
