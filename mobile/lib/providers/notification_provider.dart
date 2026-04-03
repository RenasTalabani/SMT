import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';
import '../models/notification_model.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class NotificationsState {
  final List<NotificationModel> notifications;
  final int unreadCount;
  final bool isLoading;
  final String? error;

  const NotificationsState({
    this.notifications = const [],
    this.unreadCount = 0,
    this.isLoading = false,
    this.error,
  });

  NotificationsState copyWith({
    List<NotificationModel>? notifications,
    int? unreadCount,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class NotificationNotifier extends StateNotifier<NotificationsState> {
  final ApiClient _api;

  NotificationNotifier(this._api) : super(const NotificationsState());

  // ── fetchNotifications ────────────────────────────────────────────────────
  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _api.get('/notifications');
      final data = response.data['data'];

      List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map) {
        rawList = (data['notifications'] ?? data['items'] ?? []) as List;
      } else {
        rawList = [];
      }

      final notifications = rawList
          .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
          .toList();

      final unread = notifications.where((n) => !n.isRead).length;

      state = state.copyWith(
        isLoading: false,
        notifications: notifications,
        unreadCount: unread,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractError(e),
      );
    }
  }

  // ── markRead ──────────────────────────────────────────────────────────────
  /// Marks a single notification as read, updating the local list immediately.
  Future<void> markRead(String id) async {
    // Optimistic local update.
    final index = state.notifications.indexWhere((n) => n.id == id);
    if (index != -1 && !state.notifications[index].isRead) {
      final updated = [...state.notifications];
      updated[index] = _markNotificationRead(updated[index]);
      final newUnread = (state.unreadCount - 1).clamp(0, state.unreadCount);
      state = state.copyWith(notifications: updated, unreadCount: newUnread);
    }

    try {
      await _api.put('/notifications/$id/read');
    } catch (e) {
      // Revert – re-fetch to restore consistent state.
      state = state.copyWith(error: ApiClient.extractError(e));
      await fetchNotifications();
    }
  }

  // ── markAllRead ───────────────────────────────────────────────────────────
  /// Marks every notification as read in one server call.
  Future<void> markAllRead() async {
    // Optimistic local update.
    final updated =
        state.notifications.map(_markNotificationRead).toList();
    state = state.copyWith(
      notifications: updated,
      unreadCount: 0,
      clearError: true,
    );

    try {
      await _api.post('/notifications/mark-all-read');
    } catch (e) {
      // Revert.
      state = state.copyWith(error: ApiClient.extractError(e));
      await fetchNotifications();
    }
  }

  // ── fetchUnreadCount ──────────────────────────────────────────────────────
  /// Lightweight call to refresh only the badge counter.
  Future<void> fetchUnreadCount() async {
    try {
      final response = await _api.get('/notifications/unread-count');
      final data = response.data['data'];

      int count = 0;
      if (data is Map) {
        count = data['unreadCount'] ?? data['count'] ?? 0;
      } else if (data is int) {
        count = data;
      }

      state = state.copyWith(unreadCount: count);
    } catch (e) {
      // Non-critical – silently ignore badge refresh failures.
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  NotificationModel _markNotificationRead(NotificationModel n) {
    return NotificationModel.fromJson({
      '_id': n.id,
      'type': n.type,
      'title': n.title,
      'message': n.message,
      'category': n.category,
      'priority': n.priority,
      'isRead': true,
      if (n.createdAt != null) 'createdAt': n.createdAt!.toIso8601String(),
      if (n.sender != null) 'sender': n.sender,
      if (n.actionUrl != null) 'actionUrl': n.actionUrl,
    });
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationsState>(
  (ref) => NotificationNotifier(ApiClient()),
);
