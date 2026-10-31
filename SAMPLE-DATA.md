# SAMPLE data in City Gym — replace before going live

Everything below is **example data** so the app looks and works like the real thing.
Every sample description starts with `[SAMPLE]` and every sample picture has a black **SAMPLE** badge.
Prices are in IQD and are guesses, not real prices.

## Where it lives
| What | File | What to change |
|---|---|---|
| Shop products (13) + prices + stock | `backend/scripts/sample-data.js` (`products`) | Real names, prices, stock, photos |
| Product pictures | `web/public/sample/products/*.svg` | Real product photos (or upload in Admin → Shop) |
| Coach photos | `web/public/sample/coaches/*.svg` | Real coach photos |
| Coaches (Ahmed, Sara, Karwan, Lana) + bios + phone numbers | `backend/seed.js` | Real coaches; bios start with `[SAMPLE]` |
| Members (Mohammed, Fatima) and the admin account | `backend/seed.js` | Delete; create real accounts. **Change all demo passwords** |
| Courses (2) — prices 75,000 / 60,000 IQD | `backend/seed.js` | Real courses and prices |
| Course pictures | `web/public/sample/courses/*.svg` | Real course pictures |
| Course video / PDF links | `backend/seed.js` (`example.com/...`) | Real video and PDF links |
| Coach session price 15,000 IQD, hours 16:00–21:00, Friday off | `backend/scripts/demo.js` (`seedSchedules`) | Each coach sets this in Coach → Schedule |
| Group classes (HIIT, Strength, Yoga, Boxing) | `backend/scripts/demo.js` | Coaches create real classes in Coach → Classes |
| Tips (2) | `backend/seed.js` | Real tips |

The 3D anatomy, muscle names (EN/AR/KU), exercises and health calculators are **not** sample data.

To regenerate the sample pictures: `cd backend && node scripts/make-sample-assets.js`.

## Coach Renas module (added 1 Nov 2026)
| What | File | What to change |
|---|---|---|
| Prices: tiers 7,500/15,000/22,500 IQD a month, programs, **1-on-1 coaching 100,000/270,000/510,000 (SAMPLE middle of the doc's 75–150k range)**, 40 coaching spots | `backend/src/modules/coach-renas/plans.js` (+ copy in `mobile/lib/coach_renas/cr_api.dart` and `web/app/coach-renas/landing.tsx` used offline) | Your final prices |
| Special programs (Ramadan, women at home, beginner, football) prices | same file (`sample: true`) | Decide prices |
| Transfer account numbers shown to clients | `backend/.env` → `COACH_RENAS_TRANSFER_FIB/_QI/_ZAINCASH` (now `[FIB account number]` placeholders) | Your real numbers |
| Shop products in the Coach Renas shop (whey 65,000, creatine 30,000, beginner pack 89,000 …), delivery 5,000 | `mobile/assets/coach_renas/core.json` → `PRODUCTS` | Real products/prices (or connect to the City Gym shop) |
| Sample coaching clients (سارة، علي، كاروان، زينب، هيمن) and 2 sample payments | `core.json` → `CLIENTS`, `PAYS` — only shown in the coach panel when the server can't be reached | Nothing (real clients come from the server) |
| Starting lifts/food log for a new user (bench 28 kg × 6, 5 example history points marked «مثال») | `core.json` → `SEED` | Keep or clear |
| Content plan (10 posts + 5 Kurdish captions) | `backend/src/modules/coach-renas/content-seed.js` | Edit in the app (Coach panel → content plan) |
| Iraqi food calories (267 dishes, marked estimates) | `mobile/assets/coach_renas/foods.json` | Dietitian check |
