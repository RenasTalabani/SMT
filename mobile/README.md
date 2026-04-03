# Ultimate Gym — Flutter Mobile App

Cross-platform mobile app (Android + iOS) for the Ultimate Gym System.

## Prerequisites

- Flutter SDK ≥ 3.2.0 → https://flutter.dev/docs/get-started/install
- Android Studio (for Android) or Xcode (for iOS)
- Dart SDK (bundled with Flutter)
- The backend server running (`cd backend && npm start`)

---

## Quick Start

```bash
# 1. Install Flutter SDK first: https://flutter.dev/docs/get-started/install

# 2. Create the Flutter platform scaffold (do this ONCE in an empty temp folder, then
#    copy android/ and ios/ into the mobile/ directory):
#    flutter create --project-name ultimate_gym --org com.example temp_gym
#    cp -r temp_gym/android mobile/
#    cp -r temp_gym/ios mobile/

# 3. Install dependencies
cd mobile
flutter pub get

# 4. Run on Android emulator (must be running) or physical device
flutter run

# 5. Run on iOS simulator (macOS only)
flutter run -d ios
```

---

## Backend Connection

By default the app connects to `http://10.0.2.2:5000` (Android emulator localhost).

Edit `lib/core/constants/api_constants.dart` to change the URL:

```dart
// Android emulator
static const String baseUrl = 'http://10.0.2.2:5000/api';

// iOS simulator
// static const String baseUrl = 'http://localhost:5000/api';

// Physical device (use your machine's local IP)
// static const String baseUrl = 'http://192.168.x.x:5000/api';
```

---

## Project Structure

```
lib/
├── main.dart                  # App entry point
├── core/
│   ├── constants/             # API URLs, app constants
│   ├── network/               # Dio API client, Socket.io service
│   ├── router/                # GoRouter navigation
│   ├── storage/               # Secure token storage
│   └── theme/                 # Light & dark themes
├── models/                    # Data models (User, Workout, Course, Tip…)
├── providers/                 # Riverpod state (auth, workouts, courses…)
├── screens/
│   ├── auth/                  # Login, Register
│   ├── client/                # Dashboard, Plan, Courses, Tips, Chat, Profile
│   ├── coach/                 # Dashboard, Clients, Workouts, Profile
│   └── admin/                 # Admin Dashboard
└── widgets/                   # Reusable UI components
```

---

## Build APK (Android)

```bash
# Debug APK
flutter build apk --debug

# Release APK (add your keystore first)
flutter build apk --release

# App Bundle for Play Store
flutter build appbundle --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

---

## Build iOS

```bash
# Open in Xcode for signing
open ios/Runner.xcworkspace

# Or build directly
flutter build ios --release
```

---

## Firebase Push Notifications (Optional)

1. Create a Firebase project at https://console.firebase.google.com
2. Add Android app (package: `com.example.ultimate_gym`)
3. Download `google-services.json` → place in `android/app/`
4. Add iOS app → download `GoogleService-Info.plist` → place in `ios/Runner/`
5. Push notifications will work automatically

---

## Features

| Feature | Client | Coach | Admin |
|---------|--------|-------|-------|
| Login / Register | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Workout Plans | ✅ view | ✅ create/assign | — |
| Request Plan | ✅ | — | — |
| Courses | ✅ browse/enroll | ✅ create | — |
| Tips | ✅ like/bookmark | ✅ create | — |
| Real-time Chat | ✅ | ✅ | — |
| Notifications | ✅ | ✅ | ✅ |
| Profile | ✅ | ✅ | — |
| User Management | — | — | ✅ |

---

## Tech Stack

- **Flutter** 3.x + Dart 3.x
- **Riverpod** — state management
- **GoRouter** — navigation with auth guards
- **Dio** — HTTP client with JWT refresh interceptor
- **Socket.io client** — real-time messaging
- **Flutter Secure Storage** — encrypted token storage
- **Firebase Messaging** — push notifications
- **CachedNetworkImage** — image caching
- **FL Chart** — analytics charts
