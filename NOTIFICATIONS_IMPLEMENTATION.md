# Real-Time Notifications System - Implementation Guide

## Overview

This document describes the complete implementation of the real-time notifications system for the Ultimate Gym System. The system combines database persistence, Socket.io real-time events, Redux state management, and a responsive UI to deliver notifications to users instantly.

## Architecture

### Backend Components

#### 1. **Notification Model** (`backend/models/Notification.js`)
- **Purpose**: Central data model for all notifications
- **Key Fields**:
  - `recipient`: ObjectId reference to receiving user
  - `sender`: ObjectId reference to sending user (optional)
  - `type`: Enum of notification types (message_received, workout_assigned, etc.)
  - `title`: Notification title
  - `message`: Notification body text
  - `category`: Category for filtering (social, workout, progress, system, etc.)
  - `priority`: Priority level (low, medium, high, urgent)
  - `isRead`: Read status
  - `readAt`: Timestamp when read
  - `data`: Flexible object for additional metadata
  - `actionUrl`: Deep link URL for the notification
  - `expiresAt`: TTL for automatic deletion

- **Static Methods**:
  - `findUnreadForUser(userId, limit)`: Get paginated unread notifications
  - `markAsRead(notificationId)`: Mark single notification as read
  - `markAllAsRead(userId)`: Bulk mark all unread notifications for user
  - `countUnread(userId)`: Get unread count

#### 2. **Socket.io Service** (`backend/services/socket.js`)
- **Socket Events for Notifications**:

##### Receive Events:
- `send_notification`: Client sends notification (creates DB record, emits to recipient)
  ```javascript
  socket.on('send_notification', async (data) => {
    // data: { recipientId, type, title, message, data, priority }
    // Creates notification in DB
    // Emits 'notification_created' to recipient's room
  });
  ```

- `mark_notification_read`: Mark single notification as read
  ```javascript
  socket.on('mark_notification_read', async (data) => {
    // data: { id: notificationId }
    // Updates DB and emits 'notification_read'
  });
  ```

- `mark_all_notifications_read`: Mark all unread as read
  ```javascript
  socket.on('mark_all_notifications_read', async (data) => {
    // Bulk updates DB
    // Emits 'all_notifications_read' to user's room
  });
  ```

##### Emit Events:
- `notification_created`: New notification received
  ```javascript
  { notification: {...}, unreadCount: 5 }
  ```

- `notification_read`: Notification marked as read
  ```javascript
  { id: notificationId }
  ```

- `all_notifications_read`: All notifications marked as read
  ```javascript
  { userId: '...' }
  ```

##### Helper Functions:
- `sendUserNotification(io, recipientId, notificationData)`: Send notification to user
- `sendBulkNotifications(io, recipientIds, notificationData)`: Send to multiple users
- `sendMessageNotification(io, conversationId, message, conversation)`: Send message notification
- `sendWorkoutNotification(io, recipientId, workout, type)`: Send workout notification
- `sendProgressNotification(io, recipientId, progress, type)`: Send progress notification

#### 3. **REST API Routes** (`backend/routes/notifications.js`)
- `GET /notifications`: Fetch paginated notifications with filters
  - Query params: `page`, `limit`, `isRead`, `type`, `category`
  - Returns: Array of notifications with sender populated

- `POST /notifications`: Create notification (admin/system use)

- `PUT /notifications/:id/read`: Mark single notification as read

- `POST /notifications/mark-all-read`: Bulk mark all as read

- `GET /notifications/unread-count`: Get unread count for user

- `DELETE /notifications/:id`: Delete notification

### Frontend Components

#### 1. **Redux Slice** (`web/store/notificationsSlice.ts`)
- **State**:
  - `notifications[]`: Array of notification objects
  - `unreadCount`: Number of unread notifications
  - `loading`: Async operation state
  - `error`: Error message

- **Async Thunks**:
  - `fetchNotifications()`: Fetch from API
  - `markNotificationAsRead(id)`: Mark single as read
  - `markAllNotificationsAsRead()`: Bulk mark as read
  - `deleteNotification(id)`: Delete notification

- **Reducers** (local state updates):
  - `addNotification`: Add new notification to state
  - `updateNotificationReadStatus`: Update read status locally
  - `markAllAsReadLocal`: Bulk mark all as read
  - `removeNotification`: Remove from array
  - `clearNotifications`: Clear all

#### 2. **useNotifications Hook** (`web/hooks/useNotifications.ts`)
- **Purpose**: Manage Socket.io listeners and dispatch Redux actions
- **Functionality**:
  - Listens to 'notification_created' events
  - Listens to 'notification_read' events
  - Listens to 'all_notifications_read' events
  - Listens to 'notification_deleted' events
  - Shows toast notifications for new messages/urgent alerts
  - Provides `markAsReadViaSocket()` helper
  - Provides `markAllAsReadViaSocket()` helper
  - Provides `handleDelete()` helper

#### 3. **NotificationBell Component** (`web/components/NotificationBell.tsx`)
- **Features**:
  - Bell icon with unread badge
  - Dropdown panel showing recent notifications
  - Search functionality
  - Mark single/all as read
  - Delete individual notifications
  - Color-coded by priority/type
  - Toast notifications for new messages
  - Emoji icons for notification types

#### 4. **Notifications Page** (`web/app/client/notifications/page.tsx`)
- **Features**:
  - Full-page notifications list
  - Advanced filtering (status, type, category)
  - Search across title and message
  - Bulk actions (select, mark read, delete)
  - Priority and category badges
  - Timestamps for all notifications
  - Responsive grid layout

#### 5. **Notification Service** (`web/services/notificationService.ts`)
- API wrapper for notification endpoints
- Methods:
  - `fetchNotifications(page, limit, filters)`: Get paginated
  - `getUnreadCount()`: Get unread count
  - `markAsRead(id)`: Mark single read
  - `markAllAsRead()`: Bulk mark read
  - `deleteNotification(id)`: Delete
  - `createTestNotification()`: For testing

## Data Flow

### Message Notification Flow
1. User A sends message in conversation via Socket.io
2. `send_conversation_message` event handler:
   - Creates Message in DB
   - Broadcasts to conversation room
   - Updates conversation last message
   - Calls `sendUserNotification()` for each non-sender member
3. `sendUserNotification()`:
   - Creates Notification in DB with type='message_received'
   - Counts unread notifications
   - Emits 'notification_created' to recipient's user room
4. Frontend:
   - `useNotifications` hook listens to 'notification_created'
   - Dispatches `addNotification` Redux action
   - Shows toast: "New message from User A"
   - Updates NotificationBell UI instantly

### User Marks Notification as Read
1. User clicks check icon in NotificationBell
2. `markAsReadViaSocket(id)` emits Socket.io event
3. Backend `mark_notification_read` handler:
   - Updates DB isRead=true, readAt=now
   - Emits 'notification_read' back to user
4. Frontend:
   - `useNotifications` receives event
   - Dispatches `updateNotificationReadStatus` action
   - Updates Redux state
   - UI removes the blue dot indicator
   - unreadCount decrements
   - Bell badge updates

## Integration Points

### Chat System
- Notifications auto-sent when message received
- Type: 'message_received'
- Category: 'social'
- Action URL: `/client/chat?conversation={conversationId}`

### Workout System
- Notifications sent when workout assigned (future)
- Type: 'workout_assigned' or 'workout_completed'
- Category: 'workout'
- Action URL: `/client/workouts/{workoutId}`

### Progress System
- Notifications sent on milestones (future)
- Type: 'progress_milestone'
- Category: 'progress'
- Action URL: `/client/progress`

## Testing the System

### 1. **Test Message Notification**
1. Open two browser windows/tabs
2. Log in as User A in window 1
3. Log in as User B in window 2
4. User A: Go to Chat, create conversation with User B
5. User A: Start typing and send message
6. User B: Should see:
   - Toast notification: "New message from User A"
   - NotificationBell badge increment
   - Notification in dropdown with emoji 💬
7. User B: Click check icon to mark read
8. User B: Badge should decrement, no blue dot

### 2. **Test Mark All as Read**
1. User A send 3 messages
2. User B receives 3 notifications
3. User B: Click "Mark all read" button
4. Check: All 3 notifications marked as read
5. Badge should show 0

### 3. **Test Bulk Actions in Notifications Page**
1. User A send 5 messages
2. User B: Go to /client/notifications
3. Select 3 notifications via checkboxes
4. Click "Mark as Read"
5. Click delete on remaining 2
6. Verify only 2 remain and are unread

### 4. **Test Filtering**
1. Create mix of message, workout, and system notifications
2. Filter by Status: Unread → shows only unread
3. Filter by Type: Messages → shows only message_received
4. Filter by Category: Social → shows only social category
5. Search: Type "workout" → filters by title/message

### 5. **Test Socket Reconnection**
1. User has notification badge showing 3 unread
2. Disconnect browser (dev tools)
3. Reconnect
4. `useNotifications` hook should:
   - Auto-reconnect Socket
   - Call `fetchNotifications` on remount
   - Restore unread count correctly

## Performance Considerations

1. **Pagination**: Notifications list is paginated (50 per page)
2. **Indexes**: DB has indexes on:
   - `recipient + createdAt` for listing
   - `recipient + isRead` for unread counting
   - `type`, `category` for filtering
   - `expiresAt` for TTL cleanup
3. **Socket.io Rooms**: User rooms isolate broadcast traffic
4. **Redux Selectors**: Use memoization for unread count
5. **Notification TTL**: Old notifications auto-deleted after 30 days

## Security

1. **Socket.io Authentication**: JWT validated on connection
2. **API Authentication**: All routes require login
3. **Authorization**: Users can only see their own notifications
4. **Input Validation**: All incoming data validated
5. **Rate Limiting**: Prevents notification spam

## Future Enhancements

1. **Notification Preferences**: Users can mute categories/types
2. **Batch Delivery**: Group notifications in digest emails
3. **Notification Policies**: Rules for when to notify (online/offline)
4. **Read Receipts**: Typing indicators and read status in chat
5. **Web Push**: Don't Disturb mode, browser notifications
6. **Analytics**: Track notification engagement
7. **Delay/Schedule**: Send notifications at optimal times
8. **Templates**: Pre-built notification templates
9. **Channels**: SMS, Email, Push in addition to in-app
10. **Unsubscribe**: User control over notification types

## Troubleshooting

### Notifications not appearing
- Check Socket.io connection: Browser DevTools → Network → WS
- Verify JWT token in socket auth
- Check MongoDB connection with `notificationService`
- Verify user room joined: `socket.join('user_' + userId)`

### Badge not updating
- Check Redux store: Redux DevTools
- Verify `useNotifications` hook mounted
- Check console for errors in socket listeners
- Verify `addNotification` dispatch working

### Notifications stuck as unread
- Check Database: `db.notifications.findOne({_id: '...'})`
- Verify `mark_notification_read` event firing
- Check Redux slice `updateNotificationReadStatus` reducer

### Performance issues
- Check notification count: `db.notifications.estimatedDocumentCount()`
- Add TTL index if missing: `db.notifications.createIndex({expiresAt: 1}, {expireAfterSeconds: 0})`
- Monitor Socket.io connection count
- Check HTTP Network tab for pagination issues

## File Structure

```
backend/
├── models/
│   └── Notification.js (155 lines)
├── routes/
│   └── notifications.js (REST API)
├── services/
│   └── socket.js (Socket.io with notification helpers)
└── server.js (Socket.io initialized)

web/
├── app/
│   ├── providers.tsx (Toaster setup)
│   └── client/
│       └── notifications/
│           └── page.tsx (Full notifications page)
├── components/
│   └── NotificationBell.tsx (Bell component)
├── hooks/
│   └── useNotifications.ts (Socket listener hook)
├── services/
│   └── notificationService.ts (API wrapper)
└── store/
    └── notificationsSlice.ts (Redux state)
```

## Summary

The real-time notifications system is now fully integrated with:
- ✅ Database persistence with TTL
- ✅ Socket.io real-time delivery
- ✅ Redux state management
- ✅ Toast UI feedback
- ✅ NotificationBell dropdown
- ✅ Full notifications page
- ✅ Message integration
- ✅ Bulk actions
- ✅ Advanced filtering
- ✅ Search functionality

Users receive instant notifications for messages, workouts, and progress updates with full read status tracking and management capabilities.
