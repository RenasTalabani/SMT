"use client";

// Public page for the stores and the website. DRAFT — have it checked before launch.
// Replace renastalabani@gmail.com, +964 770 157 1162 and Coach Renas with the real details.
import LegalPage, { type LegalDoc } from '@/components/LegalPage';

const DOC: LegalDoc = {
  "en": {
    "title": "Delete your Coach Renas account",
    "lead": "You can delete your account and personal data at any time.",
    "sections": [
      [
        "In the app (fastest)",
        "Open Coach Renas → My account → Delete my account → confirm. Your account is deleted from our server straight away."
      ],
      [
        "Without the app",
        "E-mail renastalabani@gmail.com from the e-mail or phone number on your account, with the subject “Delete my account”. We delete it within 7 days and reply to confirm."
      ],
      [
        "What is deleted",
        "Your profile, body measurements, health answers, workouts, food log, weekly check-ins, progress photos, chat messages, AI-coach questions and receipt images."
      ],
      [
        "What is kept",
        "Payment records (amount, date, method) for up to 5 years because accounting law requires it — without your name, photos or notes. Shop order records without your address and phone."
      ],
      [
        "Subscriptions",
        "Deleting your account does not cancel a Google Play or App Store subscription. Cancel it in your store account first."
      ]
    ]
  },
  "ar": {
    "title": "حذف حسابك بالكوتش ريناس",
    "lead": "تگدر تحذف حسابك وبياناتك الشخصية بأي وقت.",
    "sections": [
      [
        "من التطبيق (الأسرع)",
        "افتح الكوتش ريناس ← حسابي ← احذف حسابي ← أكّد. حسابك ينحذف من السيرفر فوراً."
      ],
      [
        "بدون التطبيق",
        "راسلنا على renastalabani@gmail.com من نفس الإيميل أو الرقم المسجل بحسابك، والعنوان «احذف حسابي». نحذفه خلال 7 أيام ونرد عليك نأكد."
      ],
      [
        "شنو ينحذف",
        "ملفك، قياسات جسمك، أجوبة الصحة، التمارين، سجل الأكل، التقارير الأسبوعية، صور التقدم، رسائل الدردشة، أسئلة المدرب الذكي، وصور الإيصالات."
      ],
      [
        "شنو يبقى",
        "سجلات الدفع (المبلغ والتاريخ والطريقة) لمدة لحد 5 سنين لأن قانون الحسابات يطلبها — بدون اسمك وصورك وملاحظاتك. وسجلات الطلبات بدون عنوانك ورقمك."
      ],
      [
        "الاشتراكات",
        "حذف الحساب ما يلغي اشتراك Google Play أو App Store. ألغِه من حسابك بالمتجر أول."
      ]
    ]
  },
  "ku": {
    "title": "سڕینەوەی هەژماری کۆچ ڕێناس",
    "lead": "هەر کاتێک دەتوانیت هەژمار و داتای کەسیی خۆت بسڕیتەوە.",
    "sections": [
      [
        "لە ئەپ (خێراترین)",
        "کۆچ ڕێناس بکەرەوە ← هەژمارەکەم ← هەژمارەکەم بسڕەوە ← پشتڕاستی بکەرەوە. هەژمارەکەت یەکسەر لە سێرڤەر دەسڕدرێتەوە."
      ],
      [
        "بەبێ ئەپ",
        "ئیمەیڵ بنێرە بۆ renastalabani@gmail.com لە هەمان ئیمەیڵ یان ژمارەی هەژمارەکەت، بە ناونیشانی «هەژمارەکەم بسڕەوە». لە ماوەی 7 ڕۆژدا دەیسڕینەوە و وەڵامت دەدەینەوە."
      ],
      [
        "چی دەسڕدرێتەوە",
        "پرۆفایل، پێوانەکانی جەستە، وەڵامەکانی تەندروستی، ڕاهێنانەکان، تۆماری خواردن، ڕاپۆرتی هەفتانە، وێنەی پێشکەوتن، نامەکانی چات، پرسیارەکانی ڕاهێنەری زیرەک و وێنەی پسوولە."
      ],
      [
        "چی دەمێنێتەوە",
        "تۆماری پارەدان (بڕ، بەروار، ڕێگا) تا 5 ساڵ چونکە یاسای ژمێریاری داوای دەکات — بەبێ ناو، وێنە و تێبینییەکانت. تۆماری داواکارییەکان بەبێ ناونیشان و ژمارەکەت."
      ],
      [
        "بەشداریکردن",
        "سڕینەوەی هەژمار بەشداریکردنی Google Play یان App Store هەڵناوەشێنێتەوە. سەرەتا لە هەژمارەکەتی فرۆشگا هەڵیبوەشێنەوە."
      ]
    ]
  }
};

export default function DeleteAccountPage() {
  return <LegalPage doc={DOC} updated={'2026-11-01'} />;
}
