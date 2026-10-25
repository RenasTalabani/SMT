import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/gym_avatar.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/error_view.dart';
import '../../widgets/loading_shimmer.dart';

class ConversationsScreen extends ConsumerStatefulWidget {
  const ConversationsScreen({super.key});

  @override
  ConsumerState<ConversationsScreen> createState() =>
      _ConversationsScreenState();
}

class _ConversationsScreenState extends ConsumerState<ConversationsScreen> {
  static const _primaryBlue = Color(0xFF26BDB8);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatProvider.notifier).fetchConversations();
    });
  }

  Future<void> _onRefresh() async {
    await ref.read(chatProvider.notifier).fetchConversations();
  }

  void _showNewConversationDialog() {
    showDialog<void>(
      context: context,
      builder: (context) => const _NewConversationDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final currentUser = ref.watch(currentUserProvider);
    final currentUserId = currentUser?.id ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'messages'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          IconButton(
            onPressed: _showNewConversationDialog,
            icon: const Icon(Icons.edit_square, color: Color(0xFF475569)),
            tooltip: 'new_conversation'.tr(),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        color: _primaryBlue,
        onRefresh: _onRefresh,
        child: _buildBody(chatState, currentUserId),
      ),
    );
  }

  Widget _buildBody(ChatState chatState, String currentUserId) {
    if (chatState.isLoading && chatState.conversations.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: LoadingShimmer(count: 6, height: 80),
      );
    }

    if (chatState.error != null && chatState.conversations.isEmpty) {
      return ErrorView(
        message: chatState.error!,
        onRetry: () => ref.read(chatProvider.notifier).fetchConversations(),
      );
    }

    if (chatState.conversations.isEmpty) {
      return EmptyState(
        icon: Icons.chat_bubble_outline_rounded,
        title: 'no_conversations_yet'.tr(),
        subtitle: 'start_a_new_conversation_by_tapping'.tr(),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: chatState.conversations.length,
      separatorBuilder: (_, __) => const Divider(
        height: 1,
        indent: 80,
        endIndent: 16,
        color: Color(0xFFF1F5F9),
      ),
      itemBuilder: (context, index) {
        final conv = chatState.conversations[index];
        final displayName = conv.getDisplayName(currentUserId);
        final avatarUrl = conv.getOtherAvatar(currentUserId);
        final initials = _initials(displayName);

        return _ConversationTile(
          displayName: displayName,
          avatarUrl: avatarUrl,
          initials: initials,
          lastMessage: conv.lastMessageText,
          updatedAt: conv.updatedAt,
          unreadCount: conv.unreadCount,
          onTap: () => context.push(
            '/client/chat/${conv.id}?name=${Uri.encodeComponent(displayName)}',
          ),
        );
      },
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
// Conversation tile
// ---------------------------------------------------------------------------

class _ConversationTile extends StatelessWidget {
  const _ConversationTile({
    required this.displayName,
    required this.avatarUrl,
    required this.initials,
    required this.lastMessage,
    required this.updatedAt,
    required this.unreadCount,
    required this.onTap,
  });

  final String displayName;
  final String? avatarUrl;
  final String initials;
  final String lastMessage;
  final DateTime? updatedAt;
  final int unreadCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hasUnread = unreadCount > 0;

    return InkWell(
      onTap: onTap,
      child: Container(
        color: hasUnread
            ? const Color(0xFFEFF6FF)
            : Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            GymAvatar(
              imageUrl: avatarUrl,
              initials: initials,
              size: 50,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          displayName,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: hasUnread
                                ? FontWeight.w700
                                : FontWeight.w600,
                            color: const Color(0xFF0F172A),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (updatedAt != null)
                        Text(
                          timeago.format(updatedAt!, allowFromNow: true),
                          style: TextStyle(
                            fontSize: 11,
                            color: hasUnread
                                ? const Color(0xFF26BDB8)
                                : const Color(0xFF94A3B8),
                            fontWeight: hasUnread
                                ? FontWeight.w600
                                : FontWeight.w400,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          lastMessage,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 13,
                            color: hasUnread
                                ? const Color(0xFF475569)
                                : const Color(0xFF94A3B8),
                            fontWeight: hasUnread
                                ? FontWeight.w500
                                : FontWeight.w400,
                          ),
                        ),
                      ),
                      if (hasUnread) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.all(4),
                          constraints: const BoxConstraints(
                              minWidth: 20, minHeight: 20),
                          decoration: const BoxDecoration(
                            color: Color(0xFF26BDB8),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            unreadCount > 99 ? '99+' : '$unreadCount',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// New conversation dialog
// ---------------------------------------------------------------------------

class _NewConversationDialog extends StatefulWidget {
  const _NewConversationDialog();

  @override
  State<_NewConversationDialog> createState() => _NewConversationDialogState();
}

class _NewConversationDialogState extends State<_NewConversationDialog> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        'new_conversation_2'.tr(),
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Color(0xFF0F172A),
        ),
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _searchController,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'search_by_name'.tr(),
                hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                prefixIcon: const Icon(Icons.search_rounded,
                    color: Color(0xFF94A3B8)),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (v) => setState(() => _query = v),
            ),
            const SizedBox(height: 12),
            if (_query.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'type_a_name_to_search_for'.tr(),
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'search_functionality_coming_soon'.tr(),
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(
            'cancel'.tr(),
            style: const TextStyle(color: Color(0xFF64748B)),
          ),
        ),
      ],
    );
  }
}
