# iOS (App Store) — what is ready and what needs a Mac

Ready in the repo (made on Windows, 1 Nov 2026):
- `mobile/ios/` project, bundle id **`com.coachrenas.app`** (same as Android), display name **Coach Renas**.
- App icons for every size (from `docs/store/assets/coach-renas-icon-1024.png`).
- `Info.plist`: camera / photos / microphone / Face ID permission texts, languages en, ar, ckb (Kurdish Sorani),
  `ITSAppUsesNonExemptEncryption = false` (only standard HTTPS).

Needs a Mac with Xcode (cannot be done on Windows):
1. `cd mobile && flutter pub get && cd ios && pod install`
2. Open `ios/Runner.xcworkspace` → Signing & Capabilities → choose your Apple Developer team.
   Add capabilities: Push Notifications, Sign in with Apple, In-App Purchase.
3. Firebase: download `GoogleService-Info.plist` for `com.coachrenas.app` and drag it into Runner.
4. Google Sign-In: add the `REVERSED_CLIENT_ID` from that plist as a URL scheme (Info → URL Types).
5. Facebook login: add `FacebookAppID`, `FacebookClientToken`, `FacebookDisplayName` and the `fb<APPID>` URL scheme.
6. Translated permission texts (optional but nicer): File → New → Strings File `InfoPlist.strings`, Localize for Arabic and Kurdish:
   - ar: `NSCameraUsageDescription = "يستخدم التطبيق الكاميرا بس لما تختار تصوّر صورة تقدم أو إيصال دفع للكوتش.";`
     `NSPhotoLibraryUsageDescription = "يفتح التطبيق صورك بس لما تختار صورة تقدم أو صورة شخصية أو إيصال.";`
     `NSFaceIDUsageDescription = "استخدم Face ID حتى تدخل بسرعة وأمان.";`
   - ckb: `NSCameraUsageDescription = "ئەپەکە کامێرا تەنها بەکاردەهێنێت کاتێک وێنەی پێشکەوتن یان پسوولە دەگریت.";`
     `NSPhotoLibraryUsageDescription = "ئەپەکە وێنەکانت تەنها دەکاتەوە کاتێک وێنەیەک هەڵدەبژێریت.";`
     `NSFaceIDUsageDescription = "Face ID بەکاربهێنە بۆ چوونەژوورەوەی خێرا و سەلامەت.";`
7. `flutter build ipa --release --dart-define=API_URL=https://api.your-domain.com/api` → upload with Transporter.
8. App Store Connect: texts from `STORE-LISTING.md`, privacy answers from `DATA-SAFETY.md`, privacy URL `/privacy`,
   in-app purchases with the ids in `STORE-LISTING.md` (e.g. `cr_all_m12`).

Apple rule reminder (pricing doc): 1-on-1 coaching with a real person may be paid outside the app (rule 3.1.3(d));
app tiers and programs must use In-App Purchase, and the app must not link to cheaper outside prices.
