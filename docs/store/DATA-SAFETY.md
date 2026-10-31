# Google Play "Data safety" + Apple "App Privacy" answers (draft)

Matches the privacy policy at `/privacy`. Check again if you add analytics or ads.

| Data type | Collected | Shared | Why | Optional? |
|---|---|---|---|---|
| Name, e-mail, phone | Yes | No | Account, coach contact, shop delivery | Phone optional |
| Health & fitness (weight, height, age, injuries, workouts, health-screen answers) | Yes | No | App functionality (programs, calories, coaching) | Yes |
| Photos (progress photos, payment receipts) | Yes, only if the user uploads | No | Coaching, payment confirmation | Yes |
| Messages (chat with coach, AI coach questions, check-in notes) | Yes | AI questions go to OpenAI as a processor when a key is set | App functionality | Yes |
| Purchase history | Yes | No | Subscriptions, orders | — |
| Address (shop delivery: governorate + phone) | Yes | No | Delivery | Only when ordering |
| Location, contacts, advertising ID | **No** | — | — | — |

- Data encrypted in transit: **Yes** (use HTTPS for the production API — the debug app still points to `http://192.168.0.104:5000`; change `mobile/lib/core/constants/api_constants.dart` and remove `usesCleartextTraffic` before release).
- Users can request deletion: **Yes** — in-app (Coach Renas → My account → Delete my account → `DELETE /api/users/me`) and by e-mail.
- Ads: **No**. Target audience: 13+.
