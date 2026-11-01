# نسخة الآيفون بدون جهاز Mac (Codemagic)

التطبيق مكتوب بـ **Flutter** (مو React Native)، فـ Expo ما يشتغل عليه.
البديل هو **Codemagic**: خدمة بيها أجهزة Mac بالسحابة، تبني نسخة الآيفون وترفعها على App Store وإنت على Windows.
مجاني لحد 500 دقيقة بالشهر (البناء الواحد ~15–20 دقيقة).

> ⚠️ حساب **Apple Developer** (99 دولار بالسنة) لازم بكل الطرق — حتى Expo يحتاجه. ماكو طريقة تنشر على App Store بدونه.

## الخطوات (مرة وحدة)
1. **حساب Apple Developer**: سجّل على https://developer.apple.com/programs/ (فردي، بإسمك). الموافقة تاخذ يوم–يومين.
2. **سوّي التطبيق بـ App Store Connect**: https://appstoreconnect.apple.com ← Apps ← + ← New App
   - الاسم: Coach Renas · اللغة الأساسية: Arabic · Bundle ID: `com.coachrenas.app` (إذا ما يطلع، سوّيه أول من developer.apple.com ← Identifiers)
   - بعدها انسخ رقم **Apple ID** مال التطبيق (App Information) وحطه بـ `codemagic.yaml` مكان `0000000000`.
3. **مفتاح API**: App Store Connect ← Users and Access ← Integrations ← App Store Connect API ← + (الصلاحية: App Manager). نزّل ملف `.p8` واحفظ Issuer ID و Key ID.
4. **Codemagic**: سجّل على https://codemagic.io بحساب GitHub مالتك، واختار المستودع `RenasTalabani/SMT`.
   - Team settings ← Integrations ← App Store Connect ← Add key ← سمّيه **CoachRenasASC** وارفع ملف `.p8` ويه الـ Issuer ID و Key ID.
   - Codemagic يسوي شهادات التوقيع (certificates) وحده.
5. **ابدأ البناء**: بالتطبيق على Codemagic ← Start new build ← اختار الفرع `claude/coach-renas-store-2026-11-01` والـ workflow **Coach Renas — iPhone**.
   - لما يخلص، النسخة تروح لـ **TestFlight** تلقائياً. نصّب تطبيق TestFlight على آيفون وجرّبه.
6. **النشر**: بـ App Store Connect حط الصور والوصف (من `STORE-LISTING.md`) ورابط الخصوصية، واختار النسخة واضغط Submit for Review.

## أندرويد على Codemagic (اختياري)
ارفع ملف التوقيع (`.jks`) بـ Codemagic ← Code signing identities ← Android keystores، وسمّيه **coach_renas_upload_key**، بعدها شغّل workflow **Coach Renas — Android**.

## قبل البناء النهائي
غيّر `API_URL` بـ `codemagic.yaml` لعنوان السيرفر الحقيقي (بعد ما نرفع السيرفر).
