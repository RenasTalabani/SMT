# Coach Renas — how to publish the next update

App: `com.coachrenas.app` · Flutter WebView wrapper around
`mobile/assets/coach_renas/web/index.html` (one self-contained HTML page).
Current version: **2.1.0+23** (`mobile/pubspec.yaml`).

## 1. Change the app
The whole app UI is the one HTML page. Edit it, then copy it to both places:

```
cp phone.html mobile/assets/coach_renas/web/index.html   # the app
cp phone.html web/public/app/index.html                  # the web demo
```

Bump `version:` in `mobile/pubspec.yaml` (`x.y.z+N` — **N must go up every
upload to Google Play**), commit and push.

## 2. Build (Windows laptop "renas")

```powershell
cd "C:\Users\Renas Talabani\Documents\03_Gym\01_Apps-and-Code\01-Gym-App-Main"
git pull --ff-only
cd mobile
$env:TEMP='C:\crtmp'; $env:TMP='C:\crtmp'
$env:JAVA_TOOL_OPTIONS='-Djdk.net.unixdomain.tmpdir=C:\crtmp -Djava.io.tmpdir=C:\crtmp'
flutter build appbundle --release      # -> build\app\outputs\bundle\release\app-release.aab  (Google Play)
flutter build apk --release --split-per-abi   # -> flutter-apk\app-arm64-v8a-release.apk (to share directly)
```

Or just run `mobile\scripts\build-release.ps1`.

Signing: `mobile/android/key.properties` + the keystore stay on the laptop only
(both are in `.gitignore`). **Never commit them, never change the keystore** —
Play will reject an update signed with a different key.

## 3. Upload to Google Play
Play Console → Coach Renas → Test and release → **Production** → Create new
release → drop the `.aab` → write "what's new" → Review → **Start rollout**.

## 4. iOS (not released yet)
Needs: Apple Developer Program ($99/year) and a Mac or a cloud build
(Codemagic free tier). Then: Xcode/Codemagic archive → TestFlight →
App Store Connect → Submit for review.
Already prepared in the repo: bundle id `com.coachrenas.app`, icons,
`ios/Runner/PrivacyInfo.xcprivacy`, and an Info.plist with no unused
permission strings.

## 5. Store text and answers
`store/` holds the listing text and the privacy-form answers for both stores.
