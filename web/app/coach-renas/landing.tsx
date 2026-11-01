"use client";

// Coach Renas — public landing + pricing page (web). Same dark design as the
// app (Trainer App Design artifact). Prices come from the API
// (GET /api/coach-renas/plans) with a built-in copy as fallback.
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type L3 = { ar: string; ku: string; en: string };
type Lang = keyof L3;
type Tier = { key: string; name: L3; includes: L3; prices: Record<string, number>; highlight?: boolean };
type Program = { key: string; weeks: number; price: number; name: L3 };
type Plans = { tiers: Tier[]; programs: Program[]; coaching: { name: L3; includes: L3; prices: Record<string, number>; spots?: number }; freeTrialDays?: number };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Keep in sync with backend/src/modules/coach-renas/plans.js
const FALLBACK: Plans = {
  freeTrialDays: 7,
  tiers: [
    { key: 'training', name: { ar: 'التمرين', ku: 'ڕاهێنان', en: 'Training' }, includes: { ar: 'برامج التمرين، سجل التمارين، مكتبة التمارين كاملة بالحركة، الجسم 3D', ku: 'پرۆگرامەکانی ڕاهێنان، تۆماری ڕاهێنان، کتێبخانەی تەواوی ڕاهێنانەکان بە جووڵە، جەستەی 3D', en: 'Training programs, workout log, full exercise library with animations, 3D body' }, prices: { m1: 7500, m3: 19500, m12: 59000 } },
    { key: 'food', name: { ar: 'التمرين + الأكل', ku: 'ڕاهێنان + خواردن', en: 'Training + Food' }, includes: { ar: 'كل شي بالتمرين، وخطط أكل، حساب السعرات، دليل الأكل، موسوعة المكملات كاملة', ku: 'هەموو شتێکی ڕاهێنان، لەگەڵ پلانی خواردن، ژماردنی کالۆری، ڕێبەری خواردن، ئینسایکلۆپیدیای تەواوی تەواوکەرەکان', en: 'Everything in Training, plus meal plans, calorie tracking, food guide, full supplement encyclopedia' }, prices: { m1: 15000, m3: 39000, m12: 109000 } },
    { key: 'all', highlight: true, name: { ar: 'كل شي (All-Access)', ku: 'هەموو شت (All-Access)', en: 'All-Access' }, includes: { ar: 'كل شي، والمدرب الذكي، كل الكورسات الخاصة، خصم 10% بالمتجر، جلسة أسئلة شهرية ويه الكوتش', ku: 'هەموو شت، لەگەڵ ڕاهێنەری زیرەک، هەموو کۆرسە تایبەتەکان، 10% داشکاندن لە فرۆشگا، دانیشتنی پرسیاری مانگانە لەگەڵ کۆچ', en: 'Everything, plus the AI coach, all special courses, 10% off the shop, a monthly group Q&A with the coach' }, prices: { m1: 22500, m3: 59000, m12: 159000 } },
  ],
  programs: [
    { key: 'fatloss', weeks: 8, price: 25000, name: { ar: 'خسارة الدهون', ku: 'کەمکردنەوەی چەوری', en: 'Fat loss' } },
    { key: 'muscle', weeks: 10, price: 32000, name: { ar: 'بناء العضل', ku: 'دروستکردنی ماسولکە', en: 'Muscle building' } },
    { key: 'transform', weeks: 12, price: 39000, name: { ar: 'تحول كامل', ku: 'گۆڕانی تەواو', en: 'Full transformation' } },
    { key: 'ramadan', weeks: 4, price: 15000, name: { ar: 'برنامج رمضان', ku: 'پرۆگرامی ڕەمەزان', en: 'Ramadan program' } },
  ],
  coaching: {
    name: { ar: 'تدريب شخصي 1-على-1 ويه الكوتش ريناس', ku: 'ڕاهێنانی تایبەتی 1-بۆ-1 لەگەڵ کۆچ ڕێناس', en: '1-on-1 coaching with Coach Renas' },
    includes: { ar: 'برنامج وسعرات وبروتين خاص إلك، تقرير أسبوعي ومراجعة فيديوهات التكنيك، دردشة ويه الكوتش، و All-Access مجاناً', ku: 'پرۆگرام و کالۆری و پرۆتینی تایبەت بە تۆ، ڕاپۆرتی هەفتانە و پێداچوونەوەی ڤیدیۆی تەکنیک، چات لەگەڵ کۆچ، و All-Access بەخۆڕایی', en: 'A custom program and calorie/protein targets, weekly check-in and form-video review, chat with the coach, All-Access included' },
    prices: { m1: 100000, m3: 270000, m6: 510000 },
    spots: 40,
  },
};

const S: Record<string, L3> = {
  brand: { ar: 'مع الكوتش ريناس', ku: 'لەگەڵ کۆچ ڕێناس', en: 'With Coach Renas' },
  tag: { ar: 'تمرين · أكل · مكملات', ku: 'ڕاهێنان · خواردن · تەواوکەر', en: 'Training · Food · Supplements' },
  h1a: { ar: 'تمرّن صح.', ku: 'بە دروستی ڕاهێنان بکە.', en: 'Train right.' },
  h1b: { ar: 'صير أقوى.', ku: 'بەهێزتر ببە.', en: 'Get stronger.' },
  lead: { ar: 'مدربك العراقي بجيبك: كل أنواع التمارين، أكل عراقي، ونصايح مكملات صادقة.', ku: 'ڕاهێنەری عێراقیت لە گیرفانتدا: هەموو جۆرە ڕاهێنانێک، خواردنی عێراقی، و ئامۆژگاریی ڕاستگۆیانەی تەواوکەر.', en: 'Your Iraqi coach in your pocket: every kind of training, Iraqi food, and honest supplement advice.' },
  start: { ar: 'جرّب مجاناً 7 أيام', ku: '7 ڕۆژ بەخۆڕایی تاقی بکەرەوە', en: 'Try free for 7 days' },
  seePrices: { ar: 'شوف الأسعار', ku: 'نرخەکان ببینە', en: 'See prices' },
  f1t: { ar: 'تمرين بطريقة الكوتش', ku: 'ڕاهێنان بە شێوازی کۆچ', en: 'Train the coach’s way' },
  f1d: { ar: 'سِت القمة: كل تمرين يوريك الوزن اللي تبدي بيه اليوم وشكد تزيد المرة الجاية.', ku: 'سێتی لووتکە: هەر ڕاهێنانێک کێشی ئەمڕۆ و زیادکردنی جاری داهاتووت پیشان دەدات.', en: 'Top set: every workout shows today’s weight and how much to add next time.' },
  f2t: { ar: 'أكل عراقي وسعرات', ku: 'خواردنی عێراقی و کالۆری', en: 'Iraqi food and calories' },
  f2d: { ar: 'أكثر من 260 أكلة عراقية بالسعرات والبروتين: صمون، تمن، دولمة، كبة…', ku: 'زیاتر لە 260 خواردنی عێراقی بە کالۆری و پرۆتین: سەموون، برنج، دۆڵمە، کوبە…', en: '260+ Iraqi foods with calories and protein: samoon, timman, dolma, kubba…' },
  f3t: { ar: 'مكتبة 513 تمرين بالحركة', ku: 'کتێبخانەی 513 ڕاهێنان بە جووڵە', en: '513 animated exercises' },
  f3d: { ar: 'كل تمرين بجسم متحرك يوريك العضلة الأساسية والمساعدة، ويه التكنيك الصح والخطأ الشائع.', ku: 'هەر ڕاهێنانێک بە جەستەیەکی جووڵاو کە ماسولکەی سەرەکی و یارمەتیدەر پیشان دەدات، لەگەڵ تەکنیکی دروست و هەڵەی باو.', en: 'Every exercise on a moving body that lights up the main and helper muscles, with correct technique and common mistakes.' },
  f5t: { ar: 'جسمك 3D', ku: 'جەستەت بە 3D', en: 'Your body in 3D' },
  f5d: { ar: 'كل عضلة ومفصل وعظم، وإذا يألمك مكان: الإصابات المحتملة وشنو تسوي.', ku: 'هەموو ماسولکە و جومگە و ئێسکێک، و ئەگەر شوێنێک ئازاری هەیە: برینە ئەگەرییەکان و چی بکەیت.', en: 'Every muscle, joint and bone — and if something hurts, the likely injuries and what to do.' },
  f6t: { ar: 'موسوعة 139 مكمل ودوا', ku: 'ئینسایکلۆپیدیای 139 تەواوکەر و دەرمان', en: '139-supplement encyclopedia' },
  f6d: { ar: 'يفيد لو لا؟ هل يناسبني؟ الجرعة، الخلط، الخرافات — والهرمونات اللي بس ويه طبيب.', ku: 'سوودی هەیە؟ گونجاوە بۆم؟ ڕێژە، تێکەڵکردن، ئەفسانەکان — و ئەو هۆرمۆنانەی تەنها لەگەڵ دکتۆر.', en: 'Does it work? Is it right for me? Dose, mixing, myths — and the hormones that need a doctor.' },
  webapp: { ar: 'افتح التطبيق على الويب', ku: 'ئەپەکە لە وێب بکەرەوە', en: 'Open the web app' },
  terms: { ar: 'الشروط', ku: 'مەرجەکان', en: 'Terms' },
  support: { ar: 'الدعم', ku: 'پشتگیری', en: 'Support' },
  del: { ar: 'حذف الحساب', ku: 'سڕینەوەی هەژمار', en: 'Delete account' },
  f4t: { ar: 'مكملات بصدق، وخطر الهرمونات', ku: 'تەواوکەر بە ڕاستگۆیی، و مەترسیی هۆرمۆن', en: 'Honest supplements, hormone danger' },
  f4d: { ar: 'شنو يفيد وشنو فلوس ضايعة، والحقيقة عن المنشطات.', ku: 'چی سوودی هەیە و چی پارەی بەفیڕۆچوو، و ڕاستی دەربارەی ستێرۆید.', en: 'What works, what is wasted money, and the truth about steroids.' },
  prices: { ar: 'الأسعار', ku: 'نرخەکان', en: 'Prices' },
  pricesLead: { ar: 'بالدينار العراقي. السنة حوالي 7 أشهر بسعر الشهر — توفّر 40%.', ku: 'بە دیناری عێراقی. ساڵێک نزیکەی 7 مانگە — 40% پاشەکەوت.', en: 'In Iraqi dinars. A year costs about 7 months — save 40%.' },
  m1: { ar: 'شهر', ku: 'مانگێک', en: '1 month' },
  m3: { ar: '3 أشهر', ku: '3 مانگ', en: '3 months' },
  m6: { ar: '6 أشهر', ku: '6 مانگ', en: '6 months' },
  m12: { ar: 'سنة', ku: 'ساڵێک', en: '1 year' },
  best: { ar: 'الأفضل', ku: 'باشترین', en: 'Best value' },
  iqd: { ar: 'د.ع', ku: 'د.ع', en: 'IQD' },
  programs: { ar: 'برامج بدفعة وحدة', ku: 'پرۆگرامی یەکجاری', en: 'One-time programs' },
  weeks: { ar: 'أسبوع', ku: 'هەفتە', en: 'weeks' },
  coachingT: { ar: 'تدريب شخصي 1-على-1', ku: 'ڕاهێنانی تایبەتی 1-بۆ-1', en: '1-on-1 coaching' },
  spots: { ar: 'أماكن محدودة', ku: 'شوێنی سنووردار', en: 'Limited spots' },
  apply: { ar: 'اطلب مكان', ku: 'داوای شوێن بکە', en: 'Request a spot' },
  free: { ar: 'مجاني دائماً', ku: 'هەمیشە بەخۆڕایی', en: 'Always free' },
  freeList: { ar: 'مكتبة التمارين · الجسم 3D ودليل الألم · 20 مكمل أساسي · فحص «ليش جسمي ما يتغير؟» · المتجر', ku: 'کتێبخانەی ڕاهێنان · جەستەی 3D و ڕێبەری ئازار · 20 تەواوکەری سەرەکی · پشکنینی «بۆچی جەستەم ناگۆڕێت؟» · فرۆشگا', en: 'Exercise library · 3D body and pain guide · 20 core supplements · “Why isn’t my body changing?” check · the shop' },
  pay: { ar: 'شلون تدفع؟', ku: 'چۆن پارە دەدەیت؟', en: 'How to pay' },
  pay1: { ar: 'داخل التطبيق: عن طريق Google Play أو App Store (على أندرويد ممكن من رصيد زين وآسياسيل).', ku: 'لەناو ئەپ: لە ڕێگەی Google Play یان App Store (لە ئەندرۆید بە باڵانسی زەین و ئاسیاسێڵ).', en: 'In the app: through Google Play or the App Store (on Android, Zain and Asiacell phone credit works).' },
  pay2: { ar: 'التدريب الشخصي: زين كاش، FIB، كي كارد، تحويل أو كاش — مباشرة للكوتش.', ku: 'ڕاهێنانی تایبەتی: زەین کاش، FIB، کی کارد، گواستنەوە یان کاش — ڕاستەوخۆ بۆ کۆچ.', en: '1-on-1 coaching: ZainCash, FIB, Qi Card, transfer or cash — directly to the coach.' },
  pay3: { ar: 'المتجر: الدفع عند الاستلام، يوصل لكل العراق.', ku: 'فرۆشگا: پارەدان لە کاتی وەرگرتن، بۆ هەموو عێراق.', en: 'Shop: cash on delivery, all over Iraq.' },
  download: { ar: 'حمّل التطبيق', ku: 'ئەپەکە دابگرە', en: 'Get the app' },
  soon: { ar: 'قريباً على Google Play و App Store', ku: 'بەم زووانە لە Google Play و App Store', en: 'Coming soon to Google Play and the App Store' },
  privacy: { ar: 'الخصوصية', ku: 'تایبەتمەندی', en: 'Privacy' },
  login: { ar: 'تسجيل الدخول', ku: 'چوونەژوورەوە', en: 'Log in' },
  note: { ar: 'معلومات عامة مو نصيحة طبية. إذا عندك مرض أو تاخذ دوا، اسأل طبيبك أول.', ku: 'زانیاریی گشتییە نەک ئامۆژگاریی پزیشکی. ئەگەر نەخۆشیت هەیە یان دەرمان دەخۆیت، سەرەتا لە پزیشکەکەت بپرسە.', en: 'General information, not medical advice. If you are ill or take medicine, ask your doctor first.' },
};

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export default function CoachRenasLanding() {
  const [lang, setLang] = useState<Lang>('ar');
  const [period, setPeriod] = useState<'m1' | 'm3' | 'm12'>('m12');
  const [plans, setPlans] = useState<Plans>(FALLBACK);
  const t = useMemo(() => (k: string) => S[k]?.[lang] ?? k, [lang]);
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cr-lang');
      // deferred so the first render matches the server (Arabic)
      if (saved === 'ar' || saved === 'ku' || saved === 'en') queueMicrotask(() => setLang(saved));
    } catch { /* private mode */ }
    fetch(`${API_URL}/coach-renas/plans`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data?.tiers) setPlans(j.data); })
      .catch(() => { /* offline: keep fallback */ });
  }, []);

  const pickLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem('cr-lang', l); } catch { /* ignore */ }
  };

  const card = 'rounded-[18px] border border-[#262D31] bg-[#171B1E] p-4';
  return (
    <div dir={dir} lang={lang === 'ku' ? 'ckb' : lang} className="min-h-screen bg-[#0E1113] text-[#F2F4F3]" style={{ fontFamily: 'var(--font-plex-ar), var(--font-cairo), system-ui, sans-serif' }}>
      <div className="mx-auto max-w-5xl px-4 pb-16">
        <header className="flex items-center justify-between gap-3 py-4">
          <div>
            <div className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-cairo)' }}>{t('brand')}</div>
            <div className="text-xs text-[#9AA3A8]">{t('tag')}</div>
          </div>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Language" className="flex rounded-full border border-[#262D31] bg-[#171B1E] p-1 text-sm">
              {(['ar', 'ku', 'en'] as Lang[]).map((l) => (
                <button key={l} onClick={() => pickLang(l)} aria-pressed={lang === l}
                  className={`rounded-full px-3 py-1 font-semibold ${lang === l ? 'bg-[#2BC4BE] text-[#06201F]' : 'text-[#C9D0D3]'}`}>
                  {l === 'ar' ? 'عربي' : l === 'ku' ? 'کوردی' : 'EN'}
                </button>
              ))}
            </div>
            <Link href="/auth/login" className="hidden rounded-full border border-[#2A3135] px-4 py-2 text-sm font-semibold sm:block">{t('login')}</Link>
          </div>
        </header>

        <section className="relative mt-4 overflow-hidden rounded-3xl bg-[#2BC4BE] p-6 text-[#06201F] sm:p-10">
          <div aria-hidden className="absolute -top-10 h-44 w-44 rounded-full border-[22px] border-[#06201F]/10" style={{ insetInlineEnd: -40 }} />
          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl" style={{ fontFamily: 'var(--font-cairo)' }}>
            {t('h1a')}<br />{t('h1b')}
          </h1>
          <p className="mt-3 max-w-xl text-base font-medium sm:text-lg">{t('lead')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auth/register" className="rounded-full bg-[#06201F] px-6 py-3 font-bold text-[#F2F4F3]">{t('start')}</Link>
            <a href="#prices" className="rounded-full border border-[#06201F]/40 px-6 py-3 font-bold">{t('seePrices')}</a>
            <a href="/app/index.html" className="rounded-full border border-[#06201F]/40 px-6 py-3 font-bold">{t('webapp')}</a>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          {[['f1t', 'f1d', '#2BC4BE'], ['f2t', 'f2d', '#F5A524'], ['f3t', 'f3d', '#8FB8FF'], ['f4t', 'f4d', '#F08A8A'], ['f5t', 'f5d', '#FFC94A'], ['f6t', 'f6d', '#7FE0DC']].map(([a, b, c]) => (
            <div key={a} className={card}>
              <div className="mb-2 h-1.5 w-10 rounded-full" style={{ background: c }} />
              <h2 className="text-lg font-bold">{t(a)}</h2>
              <p className="text-sm text-[#9AA3A8]">{t(b)}</p>
            </div>
          ))}
        </section>

        <section id="prices" className="mt-12">
          <h2 className="text-3xl font-extrabold" style={{ fontFamily: 'var(--font-cairo)' }}>{t('prices')}</h2>
          <p className="text-sm text-[#9AA3A8]">{t('pricesLead')}</p>
          <div role="group" aria-label={t('prices')} className="mt-4 inline-flex rounded-full border border-[#262D31] bg-[#171B1E] p-1">
            {(['m1', 'm3', 'm12'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} aria-pressed={period === p}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${period === p ? 'bg-[#F2F4F3] text-[#0E1113]' : 'text-[#C9D0D3]'}`}>{t(p)}</button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {plans.tiers.map((tier) => (
              <div key={tier.key} className={`${card} flex flex-col gap-2 ${tier.highlight ? 'border-[#2BC4BE]' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold">{tier.name[lang]}</h3>
                  {tier.highlight && <span className="rounded-lg bg-[#12302F] px-2 py-0.5 text-xs font-bold text-[#2BC4BE]">{t('best')}</span>}
                </div>
                <p className="flex-1 text-sm text-[#9AA3A8]">{tier.includes[lang]}</p>
                <div className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-cairo)' }}>
                  {fmt(tier.prices[period] ?? 0)} <span className="text-sm font-semibold text-[#9AA3A8]">{t('iqd')} / {t(period)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className={card}>
              <h3 className="mb-2 text-lg font-bold">{t('programs')}</h3>
              <ul className="divide-y divide-[#262D31]">
                {plans.programs.map((p) => (
                  <li key={p.key} className="flex items-center justify-between py-2 text-sm">
                    <span>{p.name[lang]} <span className="text-[#9AA3A8]">· {p.weeks} {t('weeks')}</span></span>
                    <span className="font-bold">{fmt(p.price)} {t('iqd')}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[18px] bg-[#F5A524] p-4 text-[#2A1A00]">
              <div className="text-xs font-bold">{t('coachingT')} · {t('spots')}{plans.coaching.spots ? ` (${plans.coaching.spots})` : ''}</div>
              <h3 className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-cairo)' }}>{plans.coaching.name[lang]}</h3>
              <p className="mt-1 text-sm">{plans.coaching.includes[lang]}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
                {Object.entries(plans.coaching.prices).map(([k, v]) => (
                  <span key={k} className="rounded-full bg-[#2A1A00] px-3 py-1 text-[#FFF4DE]">{t(k)}: {fmt(v)} {t('iqd')}</span>
                ))}
              </div>
              <Link href="/auth/register" className="mt-4 inline-block rounded-full bg-[#2A1A00] px-5 py-2.5 font-bold text-[#FFF4DE]">{t('apply')}</Link>
            </div>
          </div>

          <div className={`${card} mt-3`}>
            <h3 className="font-bold">{t('free')}</h3>
            <p className="text-sm text-[#9AA3A8]">{t('freeList')}</p>
          </div>
        </section>

        <section className="mt-12 grid gap-3 md:grid-cols-2">
          <div className={card}>
            <h2 className="mb-2 text-xl font-bold">{t('pay')}</h2>
            <ul className="space-y-2 text-sm text-[#C9D0D3]">
              <li>• {t('pay1')}</li>
              <li>• {t('pay2')}</li>
              <li>• {t('pay3')}</li>
            </ul>
          </div>
          <div className={card}>
            <h2 className="mb-2 text-xl font-bold">{t('download')}</h2>
            <p className="text-sm text-[#9AA3A8]">{t('soon')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Replace href with the real store links after publishing */}
              <span className="rounded-xl border border-[#2A3135] px-4 py-2 text-sm font-semibold">Google Play</span>
              <span className="rounded-xl border border-[#2A3135] px-4 py-2 text-sm font-semibold">App Store</span>
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[#262D31] pt-6 text-sm text-[#9AA3A8]">
          <span>{t('note')}</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="text-[#2BC4BE]">{t('privacy')}</Link>
            <Link href="/terms" className="text-[#2BC4BE]">{t('terms')}</Link>
            <Link href="/support" className="text-[#2BC4BE]">{t('support')}</Link>
            <Link href="/delete-account" className="text-[#2BC4BE]">{t('del')}</Link>
            <a href="https://wa.me/9647701571162" className="text-[#2BC4BE]" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="mailto:renastalabani@gmail.com" className="text-[#2BC4BE]">renastalabani@gmail.com</a>
          </span>
        </footer>
      </div>
    </div>
  );
}
