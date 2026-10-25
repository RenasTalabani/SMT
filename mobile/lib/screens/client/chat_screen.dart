import 'package:easy_localization/easy_localization.dart';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../models/message_model.dart';
import '../../widgets/gym_avatar.dart';
import '../../core/network/socket_service.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.conversationName,
  });

  final String conversationId;
  final String conversationName;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  static const _primaryBlue = Color(0xFF26BDB8);

  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final _socket = SocketService();

  bool _isTyping = false;
  Timer? _typingDebounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initChat();
    });
  }

  Future<void> _initChat() async {
    ref.read(chatProvider.notifier).setActiveConversation(widget.conversationId);
    await ref
        .read(chatProvider.notifier)
        .fetchMessages(widget.conversationId);

    await _socket.connect();
    _socket.joinConversation(widget.conversationId);
    _socket.markConversationRead(widget.conversationId);

    _socket.on('new_conversation_message', _onNewMessage);
    _socket.on('user_typing', _onUserTyping);
    _socket.on('user_stopped_typing', _onUserStoppedTyping);
  }

  void _onNewMessage(dynamic data) {
    if (!mounted) return;
    try {
      final map = Map<String, dynamic>.from(data as Map);
      final message = MessageModel.fromJson(map);
      if (message.conversationId == widget.conversationId) {
        ref.read(chatProvider.notifier).addMessage(message);
        _scrollToBottom();
      }
    } catch (_) {}
  }

  void _onUserTyping(dynamic data) {
    if (!mounted) return;
    try {
      final map = Map<String, dynamic>.from(data as Map);
      final userId = map['userId'] as String? ?? '';
      final convId = map['conversationId'] as String? ?? '';
      if (convId == widget.conversationId && userId.isNotEmpty) {
        ref.read(chatProvider.notifier).addTypingUser(userId);
      }
    } catch (_) {}
  }

  void _onUserStoppedTyping(dynamic data) {
    if (!mounted) return;
    try {
      final map = Map<String, dynamic>.from(data as Map);
      final userId = map['userId'] as String? ?? '';
      if (userId.isNotEmpty) {
        ref.read(chatProvider.notifier).removeTypingUser(userId);
      }
    } catch (_) {}
  }

  void _onTextChanged(String value) {
    _typingDebounce?.cancel();

    if (value.isNotEmpty && !_isTyping) {
      _isTyping = true;
      _socket.typingStart(widget.conversationId);
    }

    _typingDebounce = Timer(const Duration(seconds: 1), () {
      if (_isTyping) {
        _isTyping = false;
        _socket.typingStop(widget.conversationId);
      }
    });
  }

  void _sendMessage() {
    final content = _textController.text.trim();
    if (content.isEmpty) return;

    _typingDebounce?.cancel();
    if (_isTyping) {
      _isTyping = false;
      _socket.typingStop(widget.conversationId);
    }

    _socket.sendConversationMessage(
      conversationId: widget.conversationId,
      content: content,
    );

    _textController.clear();
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _typingDebounce?.cancel();
    _socket.off('new_conversation_message', _onNewMessage);
    _socket.off('user_typing', _onUserTyping);
    _socket.off('user_stopped_typing', _onUserStoppedTyping);
    _socket.leaveConversation(widget.conversationId);
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final currentUser = ref.watch(currentUserProvider);
    final currentUserId = currentUser?.id ?? '';
    final typingUsers = chatState.typingUsers;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Color(0xFF0F172A), size: 20),
          onPressed: () => context.pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.conversationName,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
              ),
            ),
            if (typingUsers.isNotEmpty)
              const Text(
                'typing...',
                style: TextStyle(
                  fontSize: 12,
                  color: _primaryBlue,
                  fontWeight: FontWeight.w500,
                ),
              )
            else
              const Text(
                'online',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF22C55E),
                  fontWeight: FontWeight.w500,
                ),
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: chatState.isLoadingMessages && chatState.messages.isEmpty
                ? const Center(
                    child: CircularProgressIndicator(color: _primaryBlue),
                  )
                : chatState.messages.isEmpty
                    ? Center(
                        child: Text(
                          'no_messages_yet_say_hello'.tr(),
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 15,
                          ),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        reverse: true,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        itemCount: chatState.messages.length,
                        itemBuilder: (context, index) {
                          final message = chatState.messages[index];
                          final isMine = message.isMine(currentUserId);

                          final showDateSeparator = _shouldShowDateSeparator(
                            chatState.messages,
                            index,
                          );

                          return Column(
                            children: [
                              if (showDateSeparator)
                                _DateSeparator(
                                  date: message.createdAt ?? DateTime.now(),
                                ),
                              _MessageBubble(
                                message: message,
                                isMine: isMine,
                              ),
                            ],
                          );
                        },
                      ),
          ),
          _MessageInputBar(
            controller: _textController,
            onChanged: _onTextChanged,
            onSend: _sendMessage,
            onFocusGained: _scrollToBottom,
          ),
        ],
      ),
    );
  }

  bool _shouldShowDateSeparator(List<MessageModel> messages, int index) {
    if (index == messages.length - 1) return true;
    final current = messages[index].createdAt;
    final next = messages[index + 1].createdAt;
    if (current == null || next == null) return false;
    return !_isSameDay(current, next);
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    required this.isMine,
  });

  final MessageModel message;
  final bool isMine;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment:
            isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMine) ...[
            GymAvatar(
              imageUrl: message.senderAvatar,
              initials: _initials(message.senderName),
              size: 28,
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isMine
                        ? const Color(0xFF26BDB8)
                        : const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isMine ? 18 : 4),
                      bottomRight: Radius.circular(isMine ? 4 : 18),
                    ),
                  ),
                  child: Text(
                    message.content,
                    style: TextStyle(
                      fontSize: 14,
                      color: isMine ? Colors.white : const Color(0xFF1E293B),
                      height: 1.4,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  message.createdAt != null
                      ? timeago.format(message.createdAt!, allowFromNow: true)
                      : '',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
          if (isMine) const SizedBox(width: 4),
        ],
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) {
      return parts[0][0].toUpperCase();
    }
    return '?';
  }
}

// ---------------------------------------------------------------------------
// Date separator
// ---------------------------------------------------------------------------

class _DateSeparator extends StatelessWidget {
  const _DateSeparator({required this.date});
  final DateTime date;

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final d = DateTime(date.year, date.month, date.day);

    if (d == today) return 'today'.tr();
    if (d == yesterday) return 'yesterday'.tr();
    return '${date.day}/${date.month}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              _formatDate(date),
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF94A3B8),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Message input bar
// ---------------------------------------------------------------------------

class _MessageInputBar extends StatelessWidget {
  const _MessageInputBar({
    required this.controller,
    required this.onChanged,
    required this.onSend,
    required this.onFocusGained,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onSend;
  final VoidCallback onFocusGained;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 10,
        bottom: MediaQuery.of(context).viewInsets.bottom + 10,
      ),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: controller,
                  onChanged: onChanged,
                  onTap: onFocusGained,
                  maxLines: 3,
                  minLines: 1,
                  textCapitalization: TextCapitalization.sentences,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF1E293B),
                  ),
                  decoration: InputDecoration(
                    hintText: 'type_message'.tr(),
                    hintStyle: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 14,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onSend,
              child: Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: Color(0xFF26BDB8),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.send_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
