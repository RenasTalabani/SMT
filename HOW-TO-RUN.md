# City Gym — how to run it on this PC (no deploy needed)

You need Node.js (already installed). No MongoDB or Docker needed for the demo.

## 1. Start the API (with demo data)
```
cd backend
npm run demo          # first run creates the demo database
npm run demo:reset    # wipe and re-create the demo data
```
API: http://localhost:5000/api

Demo logins (all local, not real accounts):
- Admin  — admin@gym.com / admin123
- Coach  — ahmed@gym.com / coach123  (also sara@gym.com)
- Member — mohammed@gym.com / client123  (also fatima@gym.com)

## 2. Start the website
```
cd web
npm run dev           # http://localhost:3000
```
If port 3000 is busy: `npx next dev -p 3100`.

## 3. Phone app (Flutter)
```
cd mobile
flutter run
```
Set the API address in `mobile/lib/core/constants/api_constants.dart` (`baseUrl`) to your PC's IP, e.g. `http://192.168.0.104:5000/api`.

## 4. Checks
```
cd backend && npm test            # 28 API tests (uses an in-memory database)
cd web && npx tsc --noEmit && npm run build
cd mobile && flutter analyze && flutter test   # 51 tests
```

## What is in the app
Members: dashboard, my plan, **3D anatomy + AR**, **AI coach** (chat, workout generator, nutrition, progress review — works without an OpenAI key), coaches & **booking**, **group classes**, **shop**, progress, **health calculators**, courses, tips, chat, notifications, profile.
Coaches: dashboard, session requests, **weekly schedule**, **group classes + check-in**, clients, workout plans, exercises.
Admins: dashboard + announcements, users, content review, **shop & orders**, analytics.
Languages: English, Arabic, Kurdish (Sorani) with right-to-left layout.
