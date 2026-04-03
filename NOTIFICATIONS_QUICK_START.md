# Real-Time Notifications System - Quick Start Guide

## Prerequisites

- Node.js v18+
- MongoDB running locally or remote
- Two browser windows/tabs for testing

## Installation

### Backend Dependencies
```bash
cd backend
npm install
# No new dependencies needed (socket.io, mongoose already installed)
```

### Frontend Dependencies
```bash
cd web
npm install react-hot-toast
# Already included in package.json
```

## Configuration

### Backend Environment Variables
Ensure `.env` has:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gymdb
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000
```

### Frontend Socket Connection
The socket connection is configured in `web/services/socket.js` (auto-connects with JWT token)

## Running the System

### Start Backend Server
```bash
cd backend
npm start
# Server running on http://localhost:5000
# Socket.io listening on ws://localhost:5000
```

### Start Frontend Development Server
```bash
cd web
npm run dev
# Frontend running on http://localhost:3000
```

## Testing Notifications

### Quick Test in 5 Steps

1. **Open Two Browser Windows**
   - Window 1: http://localhost:3000/auth/login
   - Window 2: http://localhost:3000/auth/login

2. **Login with Test Users**
   - Window 1: Login as User A (coach or admin with chat access)
   - Window 2: Login as User B (client)

3. **Create a Conversation**
   - Window 1: Go to `/client/chat`
   - Click "New Chat" or find User B
   - Send a message: "Hello from User A"

4. **Check Notification in Window 2**
   - Should see toast: "New message from User A"
   - NotificationBell badge showing "1"
   - Click bell icon to see notification in dropdown

5. **Mark as Read**
   - Click check icon on notification
   - Badge goes to 0
   - Blue dot disappears
   - Redux state updates instantly

### Test Full Notifications Page

1. Send 5 messages from Window 1 to User B
2. In Window 2, click NotificationBell
3. Click "View All Notifications →"
4. You'll see `/client/notifications` page with:
   - All 5 message notifications
   - Search bar
   - Filter by status/type/category
   - Bulk select and actions
   - Delete buttons

### Test Real-Time Updates

1. Window 1 & 2 open, both logged in
2. Window 1: Send message
3. Watch Window 2: Should see:
   - Toast appears immediately
   - Bell badge increments
   - Notification appears in dropdown
   - Page updates without refresh
   - Redux DevTools shows new state

## Testing Specific Features

### Test 1: Message Notifications
**File**: `web/hooks/useNotifications.ts`

```bash
# In browser console (Window 2):
# Check if hook is listening
store.getState().notifications.notifications.length > 0
# Should be true after message received
```

### Test 2: Redux State Management
**File**: `web/store/notificationsSlice.ts`

```bash
# In Redux DevTools:
# Send message → Check notifications state
# Dispatch updateNotificationReadStatus → Check isRead updates
# Dispatch markAllAsReadLocal → Check unreadCount = 0
```

### Test 3: Socket.io Events
**Files**: `backend/services/socket.js`

```bash
# In browser DevTools Network tab:
# Filter by WS
# Send notification → See "message:notification_created"
# Mark read → See "message:notification_read"
# Open console to see backend logs:
# "User X connected with socket ..."
```

### Test 4: Database Persistence
**File**: `backend/models/Notification.js`

```bash
# Connect to MongoDB:
mongo
use gymdb
db.notifications.find().pretty()
# Should see notifications with isRead status

# Check TTL:
db.notifications.findOne()
# Should have expiresAt field (30 days from creation)
```

### Test 5: API Endpoints
**File**: `backend/routes/notifications.js`

Use Postman or curl:

```bash
# Get notifications
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/notifications?page=1&limit=10

# Mark as read
curl -X PUT -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/notifications/NOTIF_ID/read

# Get unread count
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/notifications/unread-count

# Mark all as read
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/notifications/mark-all-read
```

## Debugging

### Enable Debug Logging

**Backend** - Add to `backend/services/socket.js`:
```javascript
// At top of initializeSocket function
io.on('connection', (socket) => {
  console.log(`[SOCKET] User ${socket.user.name} connected`);
  
  socket.on('send_notification', (data) => {
    console.log(`[NOTIFY] Sending to ${data.recipientId}:`, data.title);
  });
});
```

**Frontend** - Add to `web/hooks/useNotifications.ts`:
```javascript
const handleNotificationCreated = (data) => {
  console.log('[FRONTEND] notification_created:', data);
  dispatch(addNotification(data.notification));
};
```

### Monitor Socket Connections

Browser DevTools:
1. Open Console
2. Type: `socket.on('notification_created', (data) => console.log(data))`
3. Check connections in Network tab → WS

### Check Redux State

Install Redux DevTools extension:
1. Open DevTools → Redux tab
2. Send notification
3. Action `notifications/addNotification` should dispatch
4. State should show new notification
5. unreadCount should increment

## Common Issues & Solutions

### Issue: Notifications not appearing
**Solution**:
1. Check Socket.io connection: DevTools → Network → WS should show connected
2. Verify JWT token: Console → `localStorage.getItem('token')`
3. Check backend logs: Should see "User X connected"
4. Check Redux state: Should have notifications array

### Issue: Badge not updating
**Solution**:
1. Check `useNotifications` hook is called
2. Verify socket listeners registered: `socket.on('notification_created', ...)`
3. Check Redux dispatch: Look for `addNotification` action
4. Verify NotificationBell component re-renders

### Issue: Toast notifications not showing
**Solution**:
1. Check Toaster in providers.tsx
2. Verify react-hot-toast installed: `npm list react-hot-toast`
3. Check for CSS issues: Tailwind classes defined
4. Check console for toast errors

### Issue: Notifications marked as unread in DB but showing as read
**Solution**:
1. Check local Redux state vs DB state
2. Verify `markAsReadViaSocket` emits correct event
3. Check backend `mark_notification_read` handler
4. Sync by refreshing page (will call `fetchNotifications`)

## Performance Testing

### Load Test: Create 100 Notifications
```bash
# Use notificationService.createTestNotification in browser console
for(let i=0; i<100; i++) {
  notificationService.createTestNotification({
    title: `Test ${i}`,
    message: 'Test notification',
    type: 'system_announcement'
  });
}

# Check:
# - Pagination works (50 per page)
# - Search still responsive
# - Filtering performs well
# - No lag in Bell dropdown
```

### Monitor Memory Usage
1. Open DevTools → Performance
2. Open Notifications page
3. Record for 10 seconds
4. Load 100 notifications
5. Check memory doesn't spike excessively

### Check Socket.io Performance
1. Open DevTools → Network → WS (filter)
2. Send 10 messages
3. Each message should emit one `notification_created` event
4. Message size should be small (< 2KB)

## Deployment Checklist

- [ ] Environment variables set in production
- [ ] MongoDB indexes created: `recipient+createdAt`, `recipient+isRead`, TTL
- [ ] Socket.io CORS origin set to production domain
- [ ] JWT secret updated
- [ ] Notification TTL set appropriately (30 days)
- [ ] Rate limiting configured
- [ ] Error handling tested
- [ ] Socket reconnection works
- [ ] Toast messages display correctly
- [ ] Styling responsive on mobile

## Next Steps

1. **Test with Real Data**: Create conversations and messages between users
2. **Add More Notification Types**: Workout assignments, progress milestones
3. **Customize Styles**: Match your design system
4. **Add User Preferences**: Let users mute notification types
5. **Implement Email Digest**: Send daily digest of notifications
6. **Mobile Notifications**: Add web push notifications

## Support

For issues or questions:
1. Check backend logs: `backend/server.js`
2. Check frontend console: `web/` source files
3. Review Redux DevTools: Check state transitions
4. Monitor network: Check Socket.io message count
5. Check NOTIFICATIONS_IMPLEMENTATION.md for detailed docs

---

**Status**: ✅ Real-time notifications system fully implemented and ready for testing!
