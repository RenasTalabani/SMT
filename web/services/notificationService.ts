import api from '@/services/api';
import type { Notification } from '@/store/notificationsSlice';

interface FetchNotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    total: number;
    unreadCount: number;
  };
}

interface NotificationResponse {
  success: boolean;
  data: Notification;
}

interface BulkReadResponse {
  success: boolean;
  data: {
    modifiedCount: number;
    unreadCount: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export const notificationService = {
  /**
   * Fetch paginated notifications with optional filters
   */
  async fetchNotifications(
    page: number = 1,
    limit: number = 50,
    filters?: {
      isRead?: boolean;
      type?: string;
      category?: string;
    }
  ) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    if (filters?.isRead !== undefined) {
      params.append('isRead', String(filters.isRead));
    }
    if (filters?.type) {
      params.append('type', filters.type);
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }

    const response = await api.get<FetchNotificationsResponse>(
      `/notifications?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string) {
    const response = await api.put<NotificationResponse>(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const response = await api.post<BulkReadResponse>('/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Create a test notification (admin/debug only)
   */
  async createTestNotification(data: {
    title: string;
    message: string;
    type: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: 'workout' | 'progress' | 'social' | 'system' | 'payment' | 'reminder';
  }) {
    const response = await api.post<NotificationResponse>('/notifications', data);
    return response.data;
  }
};

export default notificationService;
