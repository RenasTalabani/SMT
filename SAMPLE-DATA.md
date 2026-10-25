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
