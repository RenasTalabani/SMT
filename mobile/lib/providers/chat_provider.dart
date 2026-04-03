import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';
import '../models/message_model.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class ChatState {
  final List<ConversationModel> conversations;
  final List<MessageModel> messages;
  final String? activeConversationId;
  final bool isLoading;
  final bool isLoadingMessages;
  final List<String> typingUsers;
  final String? error;

  const ChatState({
    this.conversations = const [],
    this.messages = const [],
    this.activeConversationId,
    this.isLoading = false,
    this.isLoadingMessages = false,
    this.typingUsers = const [],
    this.error,
  });

  ChatState copyWith({
    List<ConversationModel>? conversations,
    List<MessageModel>? messages,
    String? activeConversationId,
    bool clearActiveConversation = false,
    bool? isLoading,
    bool? isLoadingMessages,
    List<String>? typingUsers,
    String? error,
    bool clearError = false,
  }) {
    return ChatState(
      conversations: conversations ?? this.conversations,
      messages: messages ?? this.messages,
      activeConversationId: clearActiveConversation
          ? null
          : (activeConversationId ?? this.activeConversationId),
      isLoading: isLoading ?? this.isLoading,
      isLoadingMessages: isLoadingMessages ?? this.isLoadingMessages,
      typingUsers: typingUsers ?? this.typingUsers,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class ChatNotifier extends StateNotifier<ChatState> {
  final ApiClient _api;

  ChatNotifier(this._api) : super(const ChatState());

  // ── fetchConversations ────────────────────────────────────────────────────
  Future<void> fetchConversations() async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _api.get('/chat/conversation/list');
      final data = response.data['data'];

      List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map) {
        rawList = (data['conversations'] ?? data['items'] ?? []) as List;
      } else {
        rawList = [];
      }

      final conversations = rawList
          .map((e) => ConversationModel.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(isLoading: false, conversations: conversations);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
    }
  }

  // ── fetchMessages ─────────────────────────────────────────────────────────
  /// Loads a page of messages for [conversationId].
  ///
  /// Page 1 replaces the current message list; subsequent pages prepend older
  /// messages (suitable for scroll-up pagination).
  Future<void> fetchMessages(String conversationId, {int page = 1}) async {
    state = state.copyWith(isLoadingMessages: true);
    try {
      final response = await _api.get(
        '/chat/conversation/$conversationId/messages',
        params: {'page': page, 'limit': 20},
      );
      final data = response.data['data'];

      List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map) {
        rawList = (data['messages'] ?? data['items'] ?? []) as List;
      } else {
        rawList = [];
      }

      final fetched = rawList
          .map((e) => MessageModel.fromJson(e as Map<String, dynamic>))
          .toList();

      // Page 1 → replace; later pages → prepend (older messages at the top).
      final updated =
          page == 1 ? fetched : [...fetched, ...state.messages];

      state = state.copyWith(
        isLoadingMessages: false,
        messages: updated,
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingMessages: false,
        error: ApiClient.extractError(e),
      );
    }
  }

  // ── setActiveConversation ─────────────────────────────────────────────────
  /// Sets the currently open conversation and clears stale messages.
  void setActiveConversation(String conversationId) {
    state = state.copyWith(
      activeConversationId: conversationId,
      messages: const [],
      typingUsers: const [],
    );
  }

  // ── addMessage ────────────────────────────────────────────────────────────
  /// Prepends an incoming socket [message] to the current message list.
  void addMessage(MessageModel message) {
    state = state.copyWith(messages: [message, ...state.messages]);

    // Also update the lastMessage preview in the conversations list.
    final convIndex = state.conversations
        .indexWhere((c) => c.id == message.conversationId);
    if (convIndex != -1) {
      final original = state.conversations[convIndex];
      final updatedConv = ConversationModel.fromJson({
        '_id': original.id,
        'isGroup': original.isGroup,
        if (original.groupName != null) 'groupName': original.groupName,
        'members': original.members,
        'lastMessage': {
          'content': message.content,
          'createdAt': message.createdAt?.toIso8601String(),
        },
        'unreadCounts': [],
        if (original.updatedAt != null)
          'updatedAt': DateTime.now().toIso8601String(),
      });

      final updatedConvs = [...state.conversations];
      updatedConvs.removeAt(convIndex);
      updatedConvs.insert(0, updatedConv); // Bubble to top.
      state = state.copyWith(conversations: updatedConvs);
    }
  }

  // ── typing indicators ─────────────────────────────────────────────────────
  /// Registers [userId] as currently typing.
  void addTypingUser(String userId) {
    if (state.typingUsers.contains(userId)) return;
    state = state.copyWith(typingUsers: [...state.typingUsers, userId]);
  }

  /// Removes [userId] from the typing indicator list.
  void removeTypingUser(String userId) {
    state = state.copyWith(
      typingUsers: state.typingUsers.where((id) => id != userId).toList(),
    );
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>(
  (ref) => ChatNotifier(ApiClient()),
);
