"use client";

// Shared layout for the public Coach Renas pages (privacy, terms, support,
// delete account) — the app's dark design, in English / Arabic / Kurdish.
import Link from 'next/link';
import { useState } from 'react';

export type Lang = 'en' | 'ar' | 'ku';
export type LegalDoc = Record<Lang, { title: string; lead?: string; sections: [string, string][] }>;

const NAV: Record<Lang, [string, string][]> = {
  en: [['/', 'Home'], ['/app/index.html', 'Web app'], ['/privacy', 'Privacy'], ['/terms', 'Terms'], ['/support', 'Support'], ['/delete-account', 'Delete account']],
  ar: [['/', 'الرئيسية'], ['/app/index.html', 'التطبيق على الويب'], ['/privacy', 'الخصوصية'], ['/terms', 'الشروط'], ['/support', 'الدعم'], ['/delete-account', 'حذف الحساب']],
  ku: [['/', 'سەرەکی'], ['/app/index.html', 'ئەپی وێب'], ['/privacy', 'تایبەتمەندی'], ['/terms', 'مەرجەکان'], ['/support', 'پشتگیری'], ['/delete-account', 'سڕینەوەی هەژمار']],
};

export default function LegalPage({ doc, updated }: { doc: LegalDoc; updated: string }) {
  const [lang, setLang] = useState<Lang>('en');
  const p = doc[lang];
  return (
    <div className="min-h-screen bg-[#0E1113] text-[#F2F4F3]">
      <main dir={lang === 'en' ? 'ltr' : 'rtl'} className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-[#2BC4BE]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/coach-renas-logo.png" alt="" width={32} height={32} className="rounded-full" />
            Coach Renas
          </Link>
          <div className="flex gap-1 text-sm">
            {(['en', 'ar', 'ku'] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                className={`rounded-full px-3 py-1 font-semibold ${lang === l ? 'bg-[#2BC4BE] text-[#06201F]' : 'border border-[#2A3135] text-[#C9D0D3]'}`}>
                {l === 'en' ? 'English' : l === 'ar' ? 'عربي' : 'کوردی'}
              </button>
            ))}
          </div>
        </div>
        <h1 className="text-3xl font-extrabold">{p.title}</h1>
        {p.lead && <p className="text-[#C9D0D3]">{p.lead}</p>}
        <p className="text-sm text-[#9AA3A8]">{updated}</p>
        {p.sections.map(([h, b]) => (
          <section key={h} className="rounded-[18px] border border-[#262D31] bg-[#171B1E] p-4">
            <h2 className="mb-1 text-lg font-bold">{h}</h2>
            <p className="whitespace-pre-line leading-7 text-[#C9D0D3]">{b}</p>
          </section>
        ))}
        <nav className="flex flex-wrap gap-4 border-t border-[#262D31] pt-4 text-sm">
          {NAV[lang].map(([href, label]) => <Link key={href} href={href} className="text-[#2BC4BE]">{label}</Link>)}
        </nav>
      </main>
    </div>
  );
}
