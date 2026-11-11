"use client";

// Public privacy policy for Coach Renas (needed for Google Play,
// App Store and the web). It describes the shipped app: no account, no server,
// no ads, no tracking — everything the user enters stays on their own phone.
import LegalPage, { type LegalDoc } from '@/components/LegalPage';
const UPDATED = '2026-11-11';

const P: LegalDoc = {
  en: {
    title: 'Privacy policy — Coach Renas',
    sections: [
      ['Who we are', 'The Coach Renas app is made by Coach Renas, Sulaymaniyah, Iraq. Contact: renastalabani@gmail.com.'],
      ['Short version', 'Coach Renas has no account and no password, collects nothing, and sends nothing anywhere. Everything you enter stays on your own phone.'],
      ['What the app stores on your phone', 'Your age, sex, height, weight, goal, training level, injuries and health-screen answers; your plan; the sets, weights and reps you log; your food log and your weight log; your reminder settings. All of it is saved inside the app on your device only.'],
      ['What we collect', 'Nothing. We have no server for the app, no account system and no analytics. We never see your data and we cannot recover it for you.'],
      ['Sharing', 'We do not sell or share your data, because we never receive it. The app shows no ads, uses no advertising ID and contains no tracking or analytics tools.'],
      ['Internet', 'The app works fully offline. It does not upload or download your information.'],
      ['Reminders', 'Training reminders are created by your own phone at the times you choose. They are not sent from any server and can be turned off in the app under Reminders.'],
      ['Your data is yours', 'In the app you can back up your data to a text you keep yourself (My account → Backup) and restore it on a new phone, or erase everything (My account → My data → Erase all my data). Uninstalling the app also removes it.'],
      ['Children', 'The app is rated for ages 18 and over on Google Play.'],
      ['Health note', 'Coach Renas is a general fitness app, not a medical device. It does not diagnose or treat. See a doctor before starting training or taking any supplement, especially if you have a health condition, are pregnant or are in pain.'],
      ['Changes', 'If a future version of the app ever collects data, this policy will be updated before that version is released, and the app will say so.'],
    ],
  },
  ar: {
    title: 'سياسة الخصوصية — الكوتش ريناس',
    sections: [
      ['منو إحنا', 'تطبيق «الكوتش ريناس» من سوّي الكوتش ريناس، السليمانية، العراق. للتواصل: renastalabani@gmail.com.'],
      ['باختصار', 'ما أكو حساب وما أكو كلمة سر، وما نجمع أي شي، وما نرسل أي شي لأي مكان. كل اللي تكتبه يبقى على تلفونك إنت.'],
      ['شنو ينحفظ بتلفونك', 'عمرك وجنسك وطولك ووزنك وهدفك ومستواك وإصاباتك وأجوبة أسئلة الصحة، برنامجك، السِتات والأوزان والعدات اللي تسجلها، سجل أكلك وسجل وزنك، وإعدادات التذكيرات. هذي كلها تنحفظ داخل التطبيق على جهازك بس.'],
      ['شنو نجمع إحنا', 'ولا شي. ما عدنا سيرفر للتطبيق ولا نظام حسابات ولا تحليلات. ما نشوف بياناتك أبداً وما نگدر نرجعها إلك.'],
      ['المشاركة', 'ما نبيع بياناتك وما نشاركها، لأنها أصلاً ما توصلنا. التطبيق بدون إعلانات، وما يستخدم معرّف إعلانات ولا أي أداة تتبع أو تحليلات.'],
      ['الإنترنت', 'التطبيق يشتغل كامل بدون نت، وما يرفع ولا ينزّل معلوماتك.'],
      ['التذكيرات', 'تذكيرات التمرين يطلّعها تلفونك نفسه بالأوقات اللي تختارها. ما تجي من أي سيرفر، وتگدر تطفيها من التطبيق ← التذكيرات.'],
      ['بياناتك بإيدك', 'من التطبيق تگدر تاخذ نسخة احتياطية بنص تخزنه إنت (حسابي ← نسخة احتياطية) وترجعها بتلفون جديد، أو تمسح كل شي (حسابي ← بياناتي ← امسح كل بياناتي). وإذا حذفت التطبيق تنمسح وياه.'],
      ['الأطفال', 'التطبيق مصنّف لعمر 18 فما فوق على Google Play.'],
      ['ملاحظة طبية', 'الكوتش ريناس تطبيق لياقة عامة، مو جهاز طبي، وما يشخّص ولا يعالج. راجع طبيب قبل ما تبدي تمرين أو تاخذ أي مكمل، خصوصاً إذا عندك مرض أو حامل أو عندك ألم.'],
      ['التغييرات', 'إذا بأي نسخة جاية صار التطبيق يجمع بيانات، راح نحدّث هاي السياسة قبل ما تنزل النسخة، والتطبيق راح يگلك.'],
    ],
  },
  ku: {
    title: 'سیاسەتی تایبەتمەندی — کۆچ ڕێناس',
    sections: [
      ['ئێمە کێین', 'ئەپی «کۆچ ڕێناس» لەلایەن کۆچ ڕێناس، سلێمانی، عێراق دروستکراوە. پەیوەندی: renastalabani@gmail.com.'],
      ['بە کورتی', 'هیچ هەژمارێک و وشەی نهێنی نییە، هیچ داتایەک کۆناکەینەوە و هیچ شتێک بۆ هیچ شوێنێک نانێرین. هەرچی دەینووسیت لەسەر مۆبایلەکەی خۆت دەمێنێتەوە.'],
      ['چی لەسەر مۆبایلەکەت پاشەکەوت دەکرێت', 'تەمەن، ڕەگەز، باڵا، کێش، ئامانج، ئاست، برینداری و وەڵامی پرسیارەکانی تەندروستی؛ پڕۆگرامەکەت؛ ئەو سێت و کێش و دووبارانەی تۆماری دەکەیت؛ تۆماری خواردن و کێش؛ ڕێکخستنی بیرخستنەوەکان. هەمووی تەنها لەناو ئەپەکە لەسەر ئامێرەکەت پاشەکەوت دەبێت.'],
      ['چی کۆدەکەینەوە', 'هیچ. سێرڤەرێکمان بۆ ئەپەکە نییە، سیستەمی هەژمار و شیکاری نییە. هەرگیز داتاکەت نابینین و ناتوانین بۆت بگەڕێنینەوە.'],
      ['هاوبەشکردن', 'داتاکەت نافرۆشین و هاوبەشی ناکەین، چونکە هەرگیز پێمان ناگات. ئەپەکە ڕیکلامی تێدا نییە و هیچ ئامرازێکی بەدواداچوون بەکارناهێنێت.'],
      ['ئینتەرنێت', 'ئەپەکە بە تەواوی بێ ئینتەرنێت کاردەکات و زانیارییەکانت ناخاتە سەر هیچ شوێنێک.'],
      ['بیرخستنەوەکان', 'بیرخستنەوەی ڕاهێنان لەلایەن مۆبایلەکەی خۆتەوە لەو کاتانەدا دروست دەکرێن کە هەڵیدەبژێریت، نەک لە سێرڤەرەوە، و دەتوانیت بیانکوژێنیتەوە.'],
      ['داتاکان هی تۆن', 'لە ئەپەکەدا دەتوانیت پاشەکەوتێک وەربگریت کە خۆت هەڵیدەگریت (هەژمارەکەم ← پاشەکەوت) و لە مۆبایلێکی نوێ بیگەڕێنیتەوە، یان هەمووی بسڕیتەوە. سڕینەوەی ئەپەکەش دەیسڕێتەوە.'],
      ['منداڵان', 'ئەپەکە لە Google Play بۆ تەمەنی ١٨ ساڵ و سەرووتر پۆلێنکراوە.'],
      ['تێبینی تەندروستی', 'کۆچ ڕێناس ئەپێکی لەشجوانی گشتییە، ئامێری پزیشکی نییە و نەخۆشی دەستنیشان ناکات و چارەسەر ناکات. پێش دەستپێکردنی ڕاهێنان یان وەرگرتنی هەر تەواوکەرێک سەردانی پزیشک بکە.'],
      ['گۆڕانکاری', 'ئەگەر لە وەشانێکی داهاتوودا ئەپەکە داتا کۆبکاتەوە، ئەم سیاسەتە پێش بڵاوکردنەوەی ئەو وەشانە نوێ دەکرێتەوە.'],
    ],
  },
};

export default function PrivacyPage() {
  return <LegalPage doc={P} updated={UPDATED} />;
}
