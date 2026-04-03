import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addNotification,
  updateNotificationReadStatus,
  markAllAsReadLocal,
  removeNotification,
  fetchNotifications,
  deleteNotification
} from '@/store/notificationsSlice';
import { socket } from '@/services/socket';
import type { Notification } from '@/store/notificationsSlice';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications.notifications);
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount);
  const loading = useAppSelector((state) => state.notifications.loading);

  useEffect(() => {
    // Fetch initial notifications
    dispatch(fetchNotifications({ page: 1, limit: 50 }));

    // Socket event listeners
    const handleNotificationCreated = (data: {
      notification: Notification;
      unreadCount: number;
    }) => {
      dispatch(addNotification(data.notification));
      
      // Show toast notification for new message type
      if (data.notification.type === 'message_received') {
        toast.success(`New message from ${data.notification.sender?.name || 'someone'}`);
      } else if (data.notification.type === 'workout_assigned') {
        toast.success(`New workout assigned: ${data.notification.title}`);
      } else if (data.notification.priority === 'urgent') {
        toast.error(data.notification.title);
      } else {
        toast.success(data.notification.title);
      }
    };

    const handleNotificationRead = (data: { id: string }) => {
      dispatch(
        updateNotificationReadStatus({
          id: data.id,
          isRead: true
        })
      );
    };

    const handleAllNotificationsRead = () => {
      dispatch(markAllAsReadLocal());
    };

    const handleNotificationDeleted = (data: { id: string }) => {
      dispatch(removeNotification(data.id));
    };

    // Register socket listeners
    socket.on('notification_created', handleNotificationCreated);
    socket.on('notification_read', handleNotificationRead);
    socket.on('all_notifications_read', handleAllNotificationsRead);
    socket.on('notification_deleted', handleNotificationDeleted);

    // Cleanup listeners
    return () => {
      socket.off('notification_created', handleNotificationCreated);
      socket.off('notification_read', handleNotificationRead);
      socket.off('all_notifications_read', handleAllNotificationsRead);
      socket.off('notification_deleted', handleNotificationDeleted);
    };
  }, [dispatch]);

  // Function to mark notification as read via socket
  const markAsReadViaSocket = (notificationId: string) => {
    socket.emit('mark_notification_read', { id: notificationId });
  };

  // Function to mark all as read via socket
  const markAllAsReadViaSocket = () => {
    socket.emit('mark_all_notifications_read');
  };

  // Function to delete notification
  const handleDelete = (notificationId: string) => {
    dispatch(deleteNotification(notificationId));
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsReadViaSocket,
    markAllAsReadViaSocket,
    handleDelete
  };
};
