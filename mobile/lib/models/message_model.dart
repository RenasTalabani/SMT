import '../core/i18n/trv.dart';
class ConversationModel {
  final String id;
  final bool isGroup;
  final String? groupName;
  final List<dynamic> members;
  final Map<String, dynamic>? lastMessage;
  final int unreadCount;
  final DateTime? updatedAt;

  const ConversationModel({
    required this.id,
    this.isGroup = false,
    this.groupName,
    this.members = const [],
    this.lastMessage,
    this.unreadCount = 0,
    this.updatedAt,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) =>
      ConversationModel(
        id: json['_id'] ?? json['id'] ?? '',
        isGroup: json['isGroup'] ?? false,
        groupName: json['groupName'],
        members: json['members'] ?? [],
        lastMessage: json['lastMessage'] is Map ? json['lastMessage'] : null,
        unreadCount: _extractUnreadCount(json),
        updatedAt: json['updatedAt'] != null
            ? DateTime.tryParse(json['updatedAt'])
            : null,
      );

  static int _extractUnreadCount(Map<String, dynamic> json) {
    final counts = json['unreadCounts'];
    if (counts is List && counts.isNotEmpty) {
      return counts.first['unreadCount'] ?? 0;
    }
    return 0;
  }

  String getDisplayName(String currentUserId) {
    if (isGroup) return groupName ?? trv('Group');
    final other = members.firstWhere(
      (m) => (m['_id'] ?? m['id']) != currentUserId,
      orElse: () => members.isNotEmpty ? members.first : null,
    );
    return other?['name'] ?? trv('Unknown');
  }

  String? getOtherAvatar(String currentUserId) {
    if (isGroup) return null;
    final other = members.firstWhere(
      (m) => (m['_id'] ?? m['id']) != currentUserId,
      orElse: () => null,
    );
    return other?['avatar'];
  }

  String getOtherId(String currentUserId) {
    final other = members.firstWhere(
      (m) => (m['_id'] ?? m['id']) != currentUserId,
      orElse: () => members.isNotEmpty ? members.first : null,
    );
    return other?['_id'] ?? other?['id'] ?? '';
  }

  String get lastMessageText =>
      lastMessage?['content'] as String? ?? trv('No messages yet');
}

class MessageModel {
  final String id;
  final String content;
  final String messageType;
  final Map<String, dynamic>? sender;
  final String conversationId;
  final bool isRead;
  final DateTime? createdAt;

  const MessageModel({
    required this.id,
    required this.content,
    this.messageType = 'text',
    this.sender,
    required this.conversationId,
    this.isRead = false,
    this.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) => MessageModel(
        id: json['_id'] ?? json['id'] ?? '',
        content: json['content'] ?? '',
        messageType: json['messageType'] ?? 'text',
        sender: json['sender'] is Map ? json['sender'] : null,
        conversationId: json['conversation'] ?? '',
        isRead: json['isRead'] ?? false,
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'])
            : null,
      );

  String get senderId => sender?['_id'] ?? sender?['id'] ?? '';
  String get senderName => sender?['name'] as String? ?? '';
  String? get senderAvatar => sender?['avatar'] as String?;

  bool isMine(String currentUserId) => senderId == currentUserId;
}
