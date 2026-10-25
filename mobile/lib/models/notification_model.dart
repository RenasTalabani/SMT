import '../core/i18n/trv.dart';
class NotificationModel {
  final String id;
  final String type;
  final String title;
  final String message;
  final String category;
  final String priority;
  final bool isRead;
  final DateTime? createdAt;
  final Map<String, dynamic>? sender;
  final String? actionUrl;

  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.category,
    this.priority = 'medium',
    this.isRead = false,
    this.createdAt,
    this.sender,
    this.actionUrl,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) =>
      NotificationModel(
        id: json['_id'] ?? json['id'] ?? '',
        type: json['type'] ?? 'system_announcement',
        title: json['title'] ?? '',
        message: json['message'] ?? '',
        category: json['category'] ?? 'system',
        priority: json['priority'] ?? 'medium',
        isRead: json['isRead'] ?? false,
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'])
            : null,
        sender: json['sender'] is Map ? json['sender'] : null,
        actionUrl: json['actionUrl'],
      );

  String get senderName => sender?['name'] as String? ?? trv('System');
  String? get senderAvatar => sender?['avatar'] as String?;
}
