import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../providers/notification_provider.dart';
import '../../models/notification_model.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/error_view.dart';
import '../../widgets/loading_shimmer.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  static const _primaryBlue = Color(0xFF26BDB8);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).fetchNotifications();
    });
  }

  Future<void> _onRefresh() async {
    await ref.read(notificationProvider.notifier).fetchNotifications();
  }

  Future<void> _markAllRead() async {
    await ref.read(notificationProvider.notifier).markAllRead();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationProvider);

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
        title: const Text(
          'Notifications',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          if (state.unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text(
                'Mark All Read',
                style: TextStyle(
                  color: _primaryBlue,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        color: _primaryBlue,
        onRefresh: _onRefresh,
        child: _buildBody(state),
      ),
    );
  }

  Widget _buildBody(NotificationsState state) {
    if (state.isLoading && state.notifications.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: LoadingShimmer(count: 6, height: 84),
      );
    }

    if (state.error != null && state.notifications.isEmpty) {
      return ErrorView(
        message: state.error!,
        onRetry: () =>
            ref.read(notificationProvider.notifier).fetchNotifications(),
      );
    }

    if (state.notifications.isEmpty) {
      return const EmptyState(
        icon: Icons.notifications_none_rounded,
        title: 'No notifications',
        subtitle: 'You\'re all caught up! Check back later.',
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: state.notifications.length,
      separatorBuilder: (_, __) => const Divider(
        height: 1,
        indent: 70,
        endIndent: 16,
        color: Color(0xFFF1F5F9),
      ),
      itemBuilder: (context, index) {
        final notification = state.notifications[index];
        return _NotificationCard(
          notification: notification,
          onTap: () {
            if (!notification.isRead) {
              ref
                  .read(notificationProvider.notifier)
                  .markRead(notification.id);
            }
          },
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Notification card
// ---------------------------------------------------------------------------

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.notification,
    required this.onTap,
  });

  final NotificationModel notification;
  final VoidCallback onTap;

  IconData _iconForCategory(String category) {
    switch (category) {
      case 'workout':
        return Icons.fitness_center_rounded;
      case 'social':
        return Icons.chat_bubble_rounded;
      case 'payment':
        return Icons.payment_rounded;
      case 'system':
      default:
        return Icons.info_rounded;
    }
  }

  Color _colorForCategory(String category) {
    switch (category) {
      case 'workout':
        return const Color(0xFF26BDB8);
      case 'social':
        return const Color(0xFF7C3AED);
      case 'payment':
        return const Color(0xFF22C55E);
      case 'system':
      default:
        return const Color(0xFFF59E0B);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isUnread = !notification.isRead;
    final iconColor = _colorForCategory(notification.category);

    return InkWell(
      onTap: onTap,
      child: Container(
        color: isUnread
            ? const Color(0xFFEFF6FF)
            : Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _iconForCategory(notification.category),
                color: iconColor,
                size: 20,
              ),
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
                          notification.title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isUnread
                                ? FontWeight.w700
                                : FontWeight.w600,
                            color: const Color(0xFF0F172A),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isUnread)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(left: 8, top: 3),
                          decoration: const BoxDecoration(
                            color: Color(0xFF26BDB8),
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.message,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF475569),
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    notification.createdAt != null
                        ? timeago.format(notification.createdAt!,
                            allowFromNow: true)
                        : '',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF94A3B8),
                    ),
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
