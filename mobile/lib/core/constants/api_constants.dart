class ApiConstants {
  // static const String baseUrl = 'http://10.0.2.2:5000/api'; // Android emulator
  // static const String baseUrl = 'http://localhost:5000/api'; // iOS simulator
  static const String baseUrl = 'http://192.168.1.73:5000/api'; // Physical device

  static const String socketUrl = 'http://192.168.1.73:5000';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refresh = '/auth/refresh';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String changePassword = '/auth/change-password';
  static const String me = '/auth/me';

  // Users
  static const String users = '/users';
  static const String coaches = '/users/coaches';
  static const String profile = '/users/profile';

  // Workouts
  static const String workouts = '/workouts';
  static const String workoutTemplates = '/workouts/templates';
  static const String requestPlan = '/workouts/request';

  // Courses
  static const String courses = '/courses';
  static const String courseCategories = '/courses/categories';

  // Tips
  static const String tips = '/tips';
  static const String tipCategories = '/tips/categories';

  // Notifications
  static const String notifications = '/notifications';
  static const String unreadCount = '/notifications/unread-count';
  static const String markAllRead = '/notifications/mark-all-read';

  // Chat
  static const String conversations = '/chat/conversation/list';
  static const String createDirect = '/chat/conversation/create-direct';
  static const String createGroup = '/chat/conversation/create-group';

  // Progress
  static const String progress = '/progress';
  static const String progressStats = '/progress/stats/overview';
  static const String progressChart = '/progress/stats/chart';

  // Exercises
  static const String exercises = '/exercises';

  // Upload
  static const String uploadVideo = '/upload/video';
  static const String uploadImage = '/upload/image';

  // AI — chat
  static const String aiChat = '/ai/chat';
  static const String aiChatHistory = '/ai/chat/history';
  static const String aiChatHistoryClear = '/ai/chat/history';

  // AI — generation
  static const String aiGenerateWorkout = '/ai/generate-workout';
  static const String aiNutrition = '/ai/nutrition';
  static const String aiAnalyzeProgress = '/ai/analyze-progress';
  static const String aiAnalyzeVideo = '/ai/analyze-video';

  // AI — intelligent coaching
  static const String aiProfile = '/ai/profile';
  static const String aiProfileContext = '/ai/profile/context';
  static const String aiDailyTip = '/ai/daily-tip';
  static const String aiInsights = '/ai/insights';
  static const String aiRecommendations = '/ai/recommendations';
  static const String aiRecommendationsGenerate = '/ai/recommendations/generate';
  static const String aiTrackWorkout = '/ai/track-workout';

  // Social Auth
  static const String socialGoogle = '/auth/social/google';
  static const String socialFacebook = '/auth/social/facebook';
  static const String socialApple = '/auth/social/apple';

  // FCM
  static const String fcmToken = '/users/fcm-token';
}
