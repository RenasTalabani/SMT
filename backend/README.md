# Ultimate Gym System - Backend API

A comprehensive backend API for a full-stack gym management system built with Node.js, Express, and MongoDB. Supports three user roles (Admin, Coach, Client) with complete authentication, workout management, progress tracking, real-time chat, and more.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Coach, Client)
- Email verification and password reset
- Secure password hashing with bcrypt

### 👥 User Management
- Multi-role user system
- Coach-client relationships
- User approval workflow
- Profile management with multilingual support

### 💪 Exercise & Workout Management
- Comprehensive exercise library with multimedia support
- Workout plan creation and assignment
- Progress tracking and analytics
- Template-based workout plans

### 📚 Course System
- Online courses with enrollment management
- Multi-language content support
- Progress tracking and certificates
- Instructor management

### 💡 Tips & Tricks
- Fitness tips and advice sharing
- Like, bookmark, and comment features
- Content approval workflow
- Multimedia support

### 📊 Progress Tracking
- Detailed workout logging
- Measurement tracking
- Analytics and charts
- Goal setting and monitoring

### 💬 Real-time Chat
- Real-time messaging between users
- Conversation management
- Online status tracking
- Message read receipts

### 🔔 Notifications
- In-app notifications
- Email notifications
- Push notification support
- Customizable notification types

### 📱 Admin Dashboard
- User management
- Content moderation
- Analytics and reporting
- System announcements

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.io
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Morgan

## Project Structure

```
backend/
├── models/           # MongoDB models
│   ├── User.js
│   ├── Exercise.js
│   ├── WorkoutPlan.js
│   ├── Course.js
│   ├── Tip.js
│   ├── Progress.js
│   ├── Message.js
│   └── Notification.js
├── routes/           # API routes
│   ├── auth.js
│   ├── users.js
│   ├── exercises.js
│   ├── workouts.js
│   ├── courses.js
│   ├── tips.js
│   ├── progress.js
│   ├── chat.js
│   ├── notifications.js
│   └── admin.js
├── middlewares/      # Express middlewares
│   ├── auth.js
│   ├── validation.js
│   └── upload.js
├── services/         # Business logic services
│   ├── socket.js
│   ├── email.js
│   └── cloudinary.js
├── config/           # Configuration files
├── server.js         # Main application file
├── seed.js           # Database seeding script
└── package.json
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gym-system/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/gymdb

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-token-secret
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d

   # Server
   PORT=5000
   NODE_ENV=development

   # Client URLs
   CLIENT_URL=http://localhost:3000
   MOBILE_URL=http://localhost:8080

   # Email (using Gmail SMTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Cloudinary (for file uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed the database** (optional)
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/coach/clients` - Get coach's clients (Coach only)
- `GET /api/users/admin/users` - Get all users (Admin only)

### Exercises
- `GET /api/exercises` - Get exercises
- `POST /api/exercises` - Create exercise (Coach/Admin)
- `PUT /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise
- `POST /api/exercises/:id/media` - Upload exercise media

### Workout Plans
- `GET /api/workouts` - Get workout plans
- `POST /api/workouts` - Create workout plan (Coach/Admin)
- `PUT /api/workouts/:id` - Update workout plan
- `POST /api/workouts/:id/assign` - Assign workout to client
- `GET /api/workouts/:id/progress` - Get workout progress

### Courses
- `GET /api/courses` - Get courses
- `POST /api/courses` - Create course (Coach)
- `PUT /api/courses/:id` - Update course
- `POST /api/courses/:id/enroll` - Enroll in course
- `PUT /api/courses/:id/progress` - Update course progress

### Tips
- `GET /api/tips` - Get tips
- `POST /api/tips` - Create tip (Coach)
- `PUT /api/tips/:id` - Update tip
- `POST /api/tips/:id/like` - Like/unlike tip
- `POST /api/tips/:id/comment` - Add comment

### Progress
- `GET /api/progress` - Get user progress
- `POST /api/progress` - Log progress
- `GET /api/progress/stats/overview` - Get progress statistics
- `GET /api/progress/stats/chart` - Get progress chart data

### Chat
- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/messages/:userId` - Get messages with user
- `POST /api/chat/messages` - Send message
- `GET /api/chat/unread-count` - Get unread message count

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read

### Admin
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/users` - Manage users
- `GET /api/admin/content` - Manage content
- `GET /api/admin/analytics` - Get analytics

## Database Models

### User
- Personal information (name, email, phone, etc.)
- Role-based permissions (admin, coach, client)
- Coach-client relationships
- Fitness profile and goals

### Exercise
- Exercise details with multilingual support
- Media attachments (images/videos)
- Muscle groups and equipment
- Difficulty levels and instructions

### WorkoutPlan
- Workout templates and assignments
- Exercise sequences and progress tracking
- Client assignments and completion status

### Course
- Course content and enrollment management
- Progress tracking and certification
- Instructor management

### Tip
- Fitness tips and advice
- Social features (likes, comments, bookmarks)
- Content approval workflow

### Progress
- Workout logging and measurements
- Analytics and goal tracking
- Photo progress tracking

### Message
- Real-time messaging system
- Conversation management
- Read receipts and typing indicators

### Notification
- In-app notification system
- Email notifications
- Customizable notification types

## Authentication

The API uses JWT (JSON Web Tokens) for authentication with the following flow:

1. **Registration/Login**: User provides credentials
2. **Token Generation**: Server generates access and refresh tokens
3. **Token Storage**: Client stores tokens securely
4. **Token Refresh**: Automatic token renewal using refresh tokens
5. **Authorization**: Protected routes verify JWT tokens

### Headers
Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## File Upload

The API supports file uploads through Cloudinary for:
- Exercise images and videos
- Course thumbnails and materials
- Tip media
- Progress photos
- User avatars

## Real-time Features

Using Socket.io for real-time communication:
- Live chat messaging
- Online status updates
- Notification delivery
- Typing indicators

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // optional
}
```

## Success Responses

Success responses follow this format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message" // optional
}
```

## Validation

Input validation using express-validator with detailed error messages for all endpoints.

## Security Features

- Helmet for security headers
- CORS configuration
- Rate limiting
- Input sanitization
- SQL injection prevention
- XSS protection

## Testing

```bash
npm test
```

## Deployment

1. Set `NODE_ENV=production` in environment
2. Configure production database
3. Set up Cloudinary for file storage
4. Configure email service
5. Deploy to hosting platform (Heroku, AWS, etc.)

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For support, email support@gymsystem.com or create an issue in the repository.