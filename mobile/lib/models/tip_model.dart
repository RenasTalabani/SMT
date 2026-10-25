import '../core/i18n/trv.dart';
class TipModel {
  final String id;
  final String title;
  final String content;
  final String? category;
  final String? type;
  final String? difficulty;
  final Map<String, dynamic>? author;
  final int likesCount;
  final int bookmarksCount;
  final int viewsCount;
  final bool isLiked;
  final bool isBookmarked;
  final bool isPublished;
  final List<dynamic> media;
  final List<String> tags;
  final DateTime? createdAt;

  const TipModel({
    required this.id,
    required this.title,
    required this.content,
    this.category,
    this.type,
    this.difficulty,
    this.author,
    this.likesCount = 0,
    this.bookmarksCount = 0,
    this.viewsCount = 0,
    this.isLiked = false,
    this.isBookmarked = false,
    this.isPublished = false,
    this.media = const [],
    this.tags = const [],
    this.createdAt,
  });

  factory TipModel.fromJson(Map<String, dynamic> json) => TipModel(
        id: json['_id'] ?? json['id'] ?? '',
        title: json['title'] ?? '',
        content: json['content'] ?? '',
        category: json['category'],
        type: json['type'],
        difficulty: json['difficulty'],
        author: json['author'] is Map ? json['author'] : null,
        likesCount: json['likesCount'] ?? (json['likes'] as List?)?.length ?? 0,
        bookmarksCount: json['bookmarksCount'] ?? (json['bookmarks'] as List?)?.length ?? 0,
        viewsCount: json['viewsCount'] ?? json['views'] ?? 0,
        isLiked: json['isLiked'] ?? false,
        isBookmarked: json['isBookmarked'] ?? false,
        isPublished: json['isPublished'] ?? false,
        media: json['media'] ?? [],
        tags: List<String>.from(json['tags'] ?? []),
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'])
            : null,
      );

  String get authorName => author?['name'] as String? ?? trv('Unknown');
  String? get authorAvatar => author?['avatar'] as String?;
}

class CommentModel {
  final String id;
  final String content;
  final Map<String, dynamic>? user;
  final DateTime? createdAt;

  const CommentModel({
    required this.id,
    required this.content,
    this.user,
    this.createdAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) => CommentModel(
        id: json['_id'] ?? json['id'] ?? '',
        content: json['content'] ?? '',
        user: json['user'] is Map ? json['user'] : null,
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'])
            : null,
      );

  String get userName => user?['name'] as String? ?? trv('Unknown');
  String? get userAvatar => user?['avatar'] as String?;
}
