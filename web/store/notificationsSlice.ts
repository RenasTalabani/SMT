import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/services/api';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  category: 'workout' | 'progress' | 'social' | 'system' | 'payment' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  data?: any;
  createdAt: string;
  timeAgo?: string;
}

interface NotificationsState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
}

const initialState: NotificationsState = {
  notifications: [],
  loading: false,
  error: null,
  unreadCount: 0
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (
    { page = 1, limit = 50 }: { page?: number; limit?: number } = {},
    thunkAPI
  ) => {
    try {
      const { data } = await api.get('/notifications', {
        params: { page, limit }
      });
      return data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch notifications'
      );
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string, thunkAPI) => {
    try {
      await api.put(`/notifications/${id}/read`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to mark as read'
      );
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, thunkAPI) => {
    try {
      const { data } = await api.post('/notifications/mark-all-read');
      return data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to mark all as read'
      );
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/notifications/${id}`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to delete notification'
      );
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Add new notification in real-time
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },

    // Update notification read status locally
    updateNotificationReadStatus(
      state,
      action: PayloadAction<{ id: string; isRead: boolean }>
    ) {
      const notification = state.notifications.find(
        (n) => n._id === action.payload.id
      );
      if (notification) {
        const wasRead = notification.isRead;
        notification.isRead = action.payload.isRead;

        if (!wasRead && action.payload.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else if (wasRead && !action.payload.isRead) {
          state.unreadCount += 1;
        }
      }
    },

    // Mark all as read locally
    markAllAsReadLocal(state) {
      state.notifications.forEach((notification) => {
        if (!notification.isRead) {
          notification.isRead = true;
        }
      });
      state.unreadCount = 0;
    },

    // Remove notification
    removeNotification(state, action: PayloadAction<string>) {
      const notification = state.notifications.find(
        (n) => n._id === action.payload
      );
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(
        (n) => n._id !== action.payload
      );
    },

    // Clear all notifications
    clearNotifications(state) {
      state.notifications = [];
      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchNotifications.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.notifications = action.payload.notifications || [];
          state.unreadCount = action.payload.unreadCount || 0;
        }
      )
      .addCase(fetchNotifications.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Mark as read
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          (n) => n._id === action.payload
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });

    // Mark all as read
    builder.addCase(markAllNotificationsAsRead.fulfilled, (state) => {
      state.notifications.forEach((notification) => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    });

    // Delete notification
    builder.addCase(deleteNotification.fulfilled, (state, action) => {
      const notification = state.notifications.find(
        (n) => n._id === action.payload
      );
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(
        (n) => n._id !== action.payload
      );
    });
  }
});

export const {
  addNotification,
  updateNotificationReadStatus,
  markAllAsReadLocal,
  removeNotification,
  clearNotifications
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
