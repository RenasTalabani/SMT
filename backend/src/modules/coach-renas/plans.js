'use strict';

// Coach Renas — price list (IQD). Source: the "Coach Renas pricing plan" doc
// (31 Oct 2026). Change prices HERE only; the app, the website and the
// API all read this file through GET /api/coach-renas/plans.
//
// channel = how it may be paid (store rules, see the pricing doc):
//   'store'  -> Google Play / App Store billing only (digital content inside the app)
//   'direct' -> ZainCash / FIB / Qi Card / bank transfer / cash (1-on-1 coaching with a real person)

const TIERS = [
  {
    key: 'training',
    name: { ar: 'التمرين', ku: 'ڕاهێنان', en: 'Training' },
    includes: {
      ar: 'برامج التمرين، سجل التمارين، مكتبة التمارين كاملة بالحركة، الجسم 3D',
      ku: 'پرۆگرامەکانی ڕاهێنان، تۆماری ڕاهێنان، کتێبخانەی تەواوی ڕاهێنانەکان بە جووڵە، جەستەی 3D',
      en: 'Training programs, workout log, full exercise library with animations, 3D body',
    },
    prices: { m1: 7500, m3: 19500, m12: 59000 },
  },
  {
    key: 'food',
    name: { ar: 'التمرين + الأكل', ku: 'ڕاهێنان + خواردن', en: 'Training + Food' },
    includes: {
      ar: 'كل شي بالتمرين، وخطط أكل، حساب السعرات، دليل الأكل، موسوعة المكملات كاملة',
      ku: 'هەموو شتێکی ڕاهێنان، لەگەڵ پلانی خواردن، ژماردنی کالۆری، ڕێبەری خواردن، ئینسایکلۆپیدیای تەواوی تەواوکەرەکان',
      en: 'Everything in Training, plus meal plans, calorie tracking, food guide, full supplement encyclopedia',
    },
    prices: { m1: 15000, m3: 39000, m12: 109000 },
  },
  {
    key: 'all',
    name: { ar: 'كل شي (All-Access)', ku: 'هەموو شت (All-Access)', en: 'All-Access' },
    includes: {
      ar: 'كل شي، والمدرب الذكي، كل الكورسات الخاصة، خصم 10% بالمتجر، جلسة أسئلة شهرية ويه الكوتش',
      ku: 'هەموو شت، لەگەڵ ڕاهێنەری زیرەک، هەموو کۆرسە تایبەتەکان، 10% داشکاندن لە فرۆشگا، دانیشتنی پرسیاری مانگانە لەگەڵ کۆچ',
      en: 'Everything, plus the AI coach, all special courses, 10% off the shop, a monthly group Q&A with the coach',
    },
    prices: { m1: 22500, m3: 59000, m12: 159000 },
    highlight: true,
  },
];

const PERIODS = {
  m1: { months: 1, name: { ar: 'شهر', ku: 'مانگێک', en: '1 month' } },
  m3: { months: 3, name: { ar: '3 أشهر', ku: '3 مانگ', en: '3 months' } },
  m12: { months: 12, name: { ar: 'سنة', ku: 'ساڵێک', en: '1 year' } },
};

// One-time programs (each with its own meal plan). All-Access members get them free.
const PROGRAMS = [
  { key: 'fatloss', weeks: 8, price: 25000, name: { ar: 'خسارة الدهون', ku: 'کەمکردنەوەی چەوری', en: 'Fat loss' } },
  { key: 'muscle', weeks: 10, price: 32000, name: { ar: 'بناء العضل', ku: 'دروستکردنی ماسولکە', en: 'Muscle building' } },
  { key: 'transform', weeks: 12, price: 39000, name: { ar: 'تحول كامل', ku: 'گۆڕانی تەواو', en: 'Full transformation' } },
  { key: 'ramadan', weeks: 4, price: 15000, sample: true, name: { ar: 'برنامج رمضان', ku: 'پرۆگرامی ڕەمەزان', en: 'Ramadan program' } },
  { key: 'women-home', weeks: 6, price: 20000, sample: true, name: { ar: 'النساء بالبيت', ku: 'ئافرەتان لە ماڵەوە', en: 'Women at home' } },
  { key: 'beginner', weeks: 6, price: 20000, sample: true, name: { ar: 'مبتدئ من الصفر', ku: 'سەرەتایی لە سفرەوە', en: 'Total beginner' } },
  { key: 'football', weeks: 8, price: 25000, sample: true, name: { ar: 'لاعبين كرة القدم', ku: 'یاریزانانی تۆپی پێ', en: 'Football players' } },
];

// 1-on-1 coaching with Renas — the only product people may pay him for directly.
// The doc suggests 75,000–150,000 IQD a month; 100,000 is a SAMPLE middle value.
const COACHING = {
  key: 'coaching',
  sample: true,
  name: { ar: 'تدريب شخصي 1-على-1 ويه الكوتش ريناس', ku: 'ڕاهێنانی تایبەتی 1-بۆ-1 لەگەڵ کۆچ ڕێناس', en: '1-on-1 coaching with Coach Renas' },
  includes: {
    ar: 'برنامج وسعرات وبروتين خاص إلك، تقرير أسبوعي ومراجعة فيديوهات التكنيك، دردشة ويه الكوتش، و All-Access مجاناً',
    ku: 'پرۆگرام و کالۆری و پرۆتینی تایبەت بە تۆ، ڕاپۆرتی هەفتانە و پێداچوونەوەی ڤیدیۆی تەکنیک، چات لەگەڵ کۆچ، و All-Access بەخۆڕایی',
    en: 'A custom program and calorie/protein targets, weekly check-in and form-video review, chat with the coach, All-Access included',
  },
  prices: { m1: 100000, m3: 270000, m6: 510000 },
  spots: 40,
};

const FREE_TRIAL_DAYS = 7;

const DIRECT_METHODS = ['zaincash', 'fib', 'qi', 'transfer', 'cash'];
const STORE_METHODS = ['google_play', 'apple'];

// Resolve a purchasable item -> { kind, key, period, amount, months, channel }
function resolveItem({ kind, key, period }) {
  if (kind === 'tier') {
    const t = TIERS.find((x) => x.key === key);
    if (!t || !t.prices[period]) return null;
    return { kind, key, period, amount: t.prices[period], months: PERIODS[period].months, channel: 'store' };
  }
  if (kind === 'program') {
    const p = PROGRAMS.find((x) => x.key === key);
    if (!p) return null;
    return { kind, key, period: 'once', amount: p.price, months: Math.ceil(p.weeks / 4), channel: 'store' };
  }
  if (kind === 'coaching') {
    const months = { m1: 1, m3: 3, m6: 6 }[period];
    if (!months) return null;
    return { kind, key: 'coaching', period, amount: COACHING.prices[period], months, channel: 'direct' };
  }
  return null;
}

module.exports = {
  TIERS, PERIODS, PROGRAMS, COACHING, FREE_TRIAL_DAYS, DIRECT_METHODS, STORE_METHODS, resolveItem,
  currency: 'IQD',
  priceDate: '2026-10-31',
};
