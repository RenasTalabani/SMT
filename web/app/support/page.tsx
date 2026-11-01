"use client";

// Public page for the stores and the website. DRAFT — have it checked before launch.
// Replace renastalabani@gmail.com, +964 770 157 1162 and Coach Renas with the real details.
import LegalPage, { type LegalDoc } from '@/components/LegalPage';

const DOC: LegalDoc = {
  "en": {
    "title": "Support — Coach Renas",
    "lead": "We usually answer within 24 hours, in Arabic, Kurdish or English.",
    "sections": [
      [
        "Contact",
        "E-mail: renastalabani@gmail.com\nWhatsApp: +964 770 157 1162\nInstagram: Coach Renas"
      ],
      [
        "Subscriptions",
        "To cancel: Google Play → Payments & subscriptions → Subscriptions → Coach Renas. iPhone: Settings → your name → Subscriptions → Coach Renas. Refunds are handled by Google or Apple."
      ],
      [
        "1-on-1 coaching payments",
        "After you pay by ZainCash, FIB, Qi Card or transfer, upload the receipt in the app (My plan → 1-on-1 coaching). The coach confirms it, usually the same day."
      ],
      [
        "Shop orders",
        "Track and cancel orders in the app under My orders. Payment is cash on delivery."
      ],
      [
        "Common problems",
        "The app is slow to open the first time: the 3D body and library are inside the app, so the first open takes a few seconds.\nI forgot my password: use “Forgot password” on the login screen.\nThe language is wrong: change it in My account."
      ],
      [
        "Delete your account",
        "See the Delete account page."
      ]
    ]
  },
  "ar": {
    "title": "الدعم — الكوتش ريناس",
    "lead": "عادةً نرد خلال 24 ساعة، بالعربي أو الكوردي أو الإنكليزي.",
    "sections": [
      [
        "التواصل",
        "الإيميل: renastalabani@gmail.com\nواتساب: +964 770 157 1162\nإنستغرام: Coach Renas"
      ],
      [
        "الاشتراكات",
        "للإلغاء: Google Play ← الدفعات والاشتراكات ← الاشتراكات ← Coach Renas. آيفون: الإعدادات ← اسمك ← الاشتراكات ← Coach Renas. الاسترجاع يكون عن طريق Google أو Apple."
      ],
      [
        "دفع التدريب الشخصي",
        "بعد ما تدفع بزين كاش أو FIB أو كي كارد أو تحويل، ارفع صورة الإيصال بالتطبيق (اشتراكي ← تدريب شخصي). الكوتش يأكده، عادةً بنفس اليوم."
      ],
      [
        "طلبات المتجر",
        "تابع طلباتك أو ألغيها من «طلباتي» بالتطبيق. الدفع عند الاستلام."
      ],
      [
        "مشاكل شائعة",
        "التطبيق بطيء أول مرة: الجسم 3D والمكتبة داخل التطبيق، فأول فتحة تاخذ كم ثانية.\nنسيت كلمة السر: استخدم «نسيت كلمة السر» بشاشة الدخول.\nاللغة غلط: غيّرها من «حسابي»."
      ],
      [
        "حذف حسابك",
        "شوف صفحة حذف الحساب."
      ]
    ]
  },
  "ku": {
    "title": "پشتگیری — کۆچ ڕێناس",
    "lead": "زۆربەی کات لە ماوەی 24 کاتژمێردا وەڵام دەدەینەوە، بە عەرەبی، کوردی یان ئینگلیزی.",
    "sections": [
      [
        "پەیوەندی",
        "ئیمەیڵ: renastalabani@gmail.com\nواتساپ: +964 770 157 1162\nئینستاگرام: Coach Renas"
      ],
      [
        "بەشداریکردن",
        "بۆ هەڵوەشاندنەوە: Google Play ← پارەدان و بەشداریکردن ← بەشداریکردنەکان ← Coach Renas. ئایفۆن: ڕێکخستنەکان ← ناوەکەت ← بەشداریکردنەکان ← Coach Renas. گەڕاندنەوەی پارە لە ڕێگەی Google یان Apple دەبێت."
      ],
      [
        "پارەدانی ڕاهێنانی تایبەتی",
        "دوای پارەدان بە زەین کاش، FIB، کی کارد یان گواستنەوە، وێنەی پسوولەکە لە ئەپ باربکە. کۆچ پشتڕاستی دەکاتەوە، زۆربەی کات هەمان ڕۆژ."
      ],
      [
        "داواکارییەکانی فرۆشگا",
        "داواکارییەکانت لە «داواکارییەکانم» لە ئەپ ببینە یان هەڵیانبوەشێنەوە. پارەدان لە کاتی وەرگرتن."
      ],
      [
        "کێشە باوەکان",
        "ئەپەکە یەکەم جار هێواشە: جەستەی 3D و کتێبخانە لەناو ئەپدان، بۆیە یەکەم کردنەوە چەند چرکەیەک دەخایەنێت.\nوشەی نهێنیم لەبیرچووە: «وشەی نهێنیم لەبیرچووە» لە شاشەی چوونەژوورەوە بەکاربهێنە.\nزمانەکە هەڵەیە: لە «هەژمارەکەم» بیگۆڕە."
      ],
      [
        "سڕینەوەی هەژمار",
        "سەیری پەڕەی سڕینەوەی هەژمار بکە."
      ]
    ]
  }
};

export default function SupportPage() {
  return <LegalPage doc={DOC} updated={'2026-11-01'} />;
}
