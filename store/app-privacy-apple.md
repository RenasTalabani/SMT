# Apple App Privacy answers — Coach Renas (com.coachrenas.app)

App Store Connect → App Privacy → "Data Types"

**Do you or your third-party partners collect data from this app?  → NO**

Reason: the app has no account, no server and no analytics or ad SDK. Everything
the user enters (profile, plan, logged sets, food, weight) is stored with
SharedPreferences/localStorage on the device only. The only network-capable
plugin is the WebView, and the page it loads is bundled in the app (no remote
URL, no Google Fonts since 2.1.0).

If Apple asks follow-ups:
- Tracking: No. No ATT prompt, no IDFA, no tracking domains.
- Third-party SDKs: flutter_local_notifications (local only),
  webview_flutter (loads a bundled asset), shared_preferences. None send data.
- Account deletion: not applicable — there is no account. The app offers
  "My account → My data → Erase all my data", and uninstalling removes everything.
- Privacy manifest: ios/Runner/PrivacyInfo.xcprivacy declares no collected data,
  no tracking, and required-reason API use (UserDefaults CA92.1,
  file timestamp C617.1, disk space E174.1).

Privacy policy URL: https://coach-renas.vercel.app/privacy
Support e-mail: renastalabani@gmail.com
