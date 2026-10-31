"use client";

// Public privacy policy for City Gym + Coach Renas (needed for Google Play,
// App Store and the web). DRAFT — have it checked legally before launch.
// Replace [CONTACT EMAIL] and [COMPANY / OWNER NAME] before publishing.
import Link from 'next/link';
import { useState } from 'react';

type Lang = 'en' | 'ar' | 'ku';
const UPDATED = '2026-11-01';

const P: Record<Lang, { title: string; sections: [string, string][] }> = {
  en: {
    title: 'Privacy policy — City Gym & Coach Renas',
    sections: [
      ['Who we are', 'City Gym and the Coach Renas coaching service are run by [COMPANY / OWNER NAME], Sulaymaniyah, Iraq. Contact: [CONTACT EMAIL].'],
      ['What we collect', 'Account details (name, e-mail or phone, password stored encrypted), the information you type in: age, sex, height, weight, goal, training level, injuries and health-screen answers, workouts, food log, weekly check-ins and notes, progress photos only if you choose to send them, shop orders (address, phone), and payment records (amount, method, receipt image you upload). We do not collect your location, contacts or advertising ID.'],
      ['Why', 'To build your training and calorie plan, let your coach follow your progress and reply, deliver shop orders, confirm payments, and keep the app secure. We do not use your data for anything else.'],
      ['Health information', 'Weight, injuries and health answers are sensitive. They are visible only to you, your coach and the gym admins, and are never used for advertising.'],
      ['AI coach', 'When you ask the AI coach a question, the text of your question (and your basic training profile) is sent to our server and, if enabled, to OpenAI to write the answer. Do not type information you do not want to share.'],
      ['Sharing', 'We do not sell your data and we do not share it with advertising companies. We use service providers to run the app (hosting, database, push notifications, image storage, store billing by Google/Apple). They only process data for us.'],
      ['Payments', 'In-app subscriptions are paid through Google Play or the App Store; we never see your card. 1-on-1 coaching may be paid by ZainCash, FIB, Qi Card, transfer or cash; we keep the amount, method and receipt for accounting.'],
      ['How long we keep data', 'As long as your account exists. Payment records are kept as required for accounting, without your receipt image or notes after you delete your account.'],
      ['Delete your account', 'In the app: Coach Renas → My account → Delete my account. This deletes your account and personal data from our server. You can also e-mail [CONTACT EMAIL] to ask for deletion or a copy of your data.'],
      ['Children', 'The app is for people aged 13 and over. Under-18s get no calorie-deficit diets and should use the app with a parent.'],
      ['Changes', 'We will show a notice in the app if this policy changes.'],
    ],
  },
  ar: {
    title: 'سياسة الخصوصية — City Gym والكوتش ريناس',
    sections: [
      ['منو إحنا', 'City Gym وخدمة التدريب «مع الكوتش ريناس» يديرها [اسم الشركة / المالك]، السليمانية، العراق. للتواصل: [CONTACT EMAIL].'],
      ['شنو نجمع', 'معلومات الحساب (الاسم، الإيميل أو الموبايل، وكلمة السر مشفّرة)، واللي تكتبه إنت: العمر والجنس والطول والوزن والهدف والمستوى والإصابات وأجوبة أسئلة الصحة، التمارين، الأكل، التقارير الأسبوعية، صور التقدم بس إذا اخترت ترسلها، طلبات المتجر (العنوان والموبايل)، وسجل الدفع (المبلغ، الطريقة، وصورة الإيصال اللي ترفعها). ما نجمع موقعك ولا جهات الاتصال ولا معرّف الإعلانات.'],
      ['ليش', 'حتى نسويلك برنامج تمرين وسعرات، والكوتش يتابعك ويرد عليك، ونوصّل طلبات المتجر، ونأكد الدفعات، ونحمي التطبيق. ما نستخدمها لأي شي ثاني.'],
      ['المعلومات الصحية', 'الوزن والإصابات وأجوبة الصحة معلومات حساسة. يشوفها بس إنت والكوتش وإدارة النادي، وما تنستخدم للإعلانات أبداً.'],
      ['المدرب الذكي', 'لما تسأل المدرب الذكي، نص سؤالك (ومعلومات تمرينك الأساسية) يروح لسيرفرنا، وإذا مفعّل لـ OpenAI حتى يكتب الجواب. لا تكتب شي ما تريد تشاركه.'],
      ['المشاركة', 'ما نبيع بياناتك ولا نشاركها ويه شركات الإعلانات. نستخدم شركات خدمة لتشغيل التطبيق (استضافة، قاعدة بيانات، إشعارات، تخزين صور، دفع Google/Apple) وهي تعالج البيانات إلنا بس.'],
      ['الدفع', 'اشتراكات التطبيق تندفع عن طريق Google Play أو App Store وإحنا ما نشوف بطاقتك. التدريب الشخصي ممكن يندفع بزين كاش أو FIB أو كي كارد أو تحويل أو كاش، ونحتفظ بالمبلغ والطريقة والإيصال للحسابات.'],
      ['شكد نحتفظ بالبيانات', 'طول ما حسابك موجود. سجلات الدفع تبقى للحسابات، بدون صورة الإيصال والملاحظات بعد ما تحذف حسابك.'],
      ['حذف حسابك', 'بالتطبيق: الكوتش ريناس ← حسابي ← احذف حسابي. ينمسح حسابك وبياناتك من السيرفر. وتگدر تراسلنا على [CONTACT EMAIL] تطلب الحذف أو نسخة من بياناتك.'],
      ['الأطفال', 'التطبيق لعمر 13 فما فوق. اللي عمرهم أقل من 18 ما ناخذلهم رجيم بنقص سعرات، والأفضل يستخدمونه ويه أهلهم.'],
      ['التغييرات', 'إذا تغيّرت هاي السياسة نعرض تنبيه بالتطبيق.'],
    ],
  },
  ku: {
    title: 'سیاسەتی تایبەتمەندی — City Gym و کۆچ ڕێناس',
    sections: [
      ['ئێمە کێین', 'City Gym و خزمەتگوزاریی ڕاهێنانی «لەگەڵ کۆچ ڕێناس» لەلایەن [ناوی کۆمپانیا / خاوەن]، سلێمانی، عێراق بەڕێوە دەبرێن. پەیوەندی: [CONTACT EMAIL].'],
      ['چی کۆدەکەینەوە', 'زانیاریی هەژمار (ناو، ئیمەیڵ یان مۆبایل، وشەی نهێنی بە شێوەی شفرەکراو)، و ئەوەی خۆت دەینووسیت: تەمەن، ڕەگەز، باڵا، کێش، ئامانج، ئاست، برینداری و وەڵامی پرسیارەکانی تەندروستی، ڕاهێنانەکان، خواردن، ڕاپۆرتی هەفتانە، وێنەی پێشکەوتن تەنها ئەگەر خۆت بینێریت، داواکارییەکانی فرۆشگا (ناونیشان و مۆبایل)، و تۆماری پارەدان (بڕ، ڕێگا و وێنەی پسوولە). شوێن و پەیوەندییەکان و ناسنامەی ڕیکلامت کۆناکەینەوە.'],
      ['بۆچی', 'بۆ دروستکردنی پلانی ڕاهێنان و کالۆری، بۆ ئەوەی کۆچ بەدواداچوون بکات و وەڵام بداتەوە، گەیاندنی داواکاری، پشتڕاستکردنەوەی پارەدان و پاراستنی ئەپەکە. بۆ هیچ شتێکی تر بەکاری ناهێنین.'],
      ['زانیاریی تەندروستی', 'کێش و برینداری و وەڵامەکانی تەندروستی هەستیارن. تەنها خۆت و کۆچەکەت و بەڕێوەبەرایەتیی یانە دەیبینن، و هەرگیز بۆ ڕیکلام بەکارنایەت.'],
      ['ڕاهێنەری زیرەک', 'کاتێک پرسیار لە ڕاهێنەری زیرەک دەکەیت، دەقی پرسیارەکەت (و زانیاریی سەرەکیی ڕاهێنانت) دەچێتە سێرڤەرەکەمان و ئەگەر چالاک بێت بۆ OpenAI بۆ نووسینی وەڵام. شتێک مەنووسە کە ناتەوێت هاوبەشی بکەیت.'],
      ['هاوبەشکردن', 'داتاکەت نافرۆشین و لەگەڵ کۆمپانیاکانی ڕیکلام هاوبەشی ناکەین. کۆمپانیای خزمەتگوزاری بەکاردەهێنین بۆ کارپێکردنی ئەپ (هۆستینگ، داتابەیس، ئاگادارکردنەوە، هەڵگرتنی وێنە، پارەدانی Google/Apple) کە تەنها بۆ ئێمە داتا دەپرۆسێسن.'],
      ['پارەدان', 'بەشداریی ئەپ لە ڕێگەی Google Play یان App Store دەدرێت و ئێمە کارتەکەت نابینین. ڕاهێنانی تایبەتی دەکرێت بە زەین کاش، FIB، کی کارد، گواستنەوە یان کاش بدرێت؛ بڕ و ڕێگا و پسوولە بۆ ژمێریاری هەڵدەگرین.'],
      ['چەند داتا هەڵدەگرین', 'تا هەژمارەکەت هەبێت. تۆماری پارەدان بۆ ژمێریاری دەمێنێتەوە، بەبێ وێنەی پسوولە و تێبینییەکان دوای سڕینەوەی هەژمار.'],
      ['سڕینەوەی هەژمار', 'لە ئەپ: کۆچ ڕێناس ← هەژمارەکەم ← هەژمارەکەم بسڕەوە. هەژمار و داتاکەت لە سێرڤەر دەسڕدرێتەوە. هەروەها دەتوانیت ئیمەیڵ بنێریت بۆ [CONTACT EMAIL].'],
      ['منداڵان', 'ئەپەکە بۆ تەمەنی 13 ساڵ و سەرووترە. کەمتر لە 18 ساڵ ڕجیمی کەمکردنەوەی کالۆری وەرناگرن و باشترە لەگەڵ خێزانەکەیان بەکاری بهێنن.'],
      ['گۆڕانکاری', 'ئەگەر ئەم سیاسەتە گۆڕا، ئاگادارییەک لە ئەپەکەدا پیشان دەدەین.'],
    ],
  },
};

export default function PrivacyPage() {
  const [lang, setLang] = useState<Lang>('en');
  const p = P[lang];
  return (
    <main dir={lang === 'en' ? 'ltr' : 'rtl'} className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="text-lg font-bold text-orange-600">City Gym</Link>
        <div className="flex gap-1 text-sm">
          {(['en', 'ar', 'ku'] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
              className={`rounded-full px-3 py-1 font-semibold ${lang === l ? 'bg-orange-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>
              {l === 'en' ? 'English' : l === 'ar' ? 'عربي' : 'کوردی'}
            </button>
          ))}
        </div>
      </div>
      <h1 className="text-3xl font-bold">{p.title}</h1>
      <p className="text-sm text-slate-500">{UPDATED}</p>
      {p.sections.map(([h, b]) => (
        <section key={h} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-1 text-lg font-semibold">{h}</h2>
          <p className="leading-7 text-slate-700 dark:text-slate-300">{b}</p>
        </section>
      ))}
    </main>
  );
}
