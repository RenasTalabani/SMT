"use client";

import Link from 'next/link';
import { FiTarget, FiCpu, FiUsers, FiTrendingUp, FiPlayCircle, FiGlobe } from 'react-icons/fi';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { homeForRole } from '@/components/ProtectedRoute';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { useAppSelector } from '@/store/hooks';

const FEATURES: { icon: typeof FiTarget; title: TranslationKey; text: TranslationKey }[] = [
  { icon: FiTarget, title: 'landing.f.anatomy', text: 'landing.f.anatomyText' },
  { icon: FiCpu, title: 'landing.f.ai', text: 'landing.f.aiText' },
  { icon: FiUsers, title: 'landing.f.coach', text: 'landing.f.coachText' },
  { icon: FiTrendingUp, title: 'landing.f.progress', text: 'landing.f.progressText' },
  { icon: FiPlayCircle, title: 'landing.f.courses', text: 'landing.f.coursesText' },
  { icon: FiGlobe, title: 'landing.f.lang', text: 'landing.f.langText' },
];

export default function HomePage() {
  const { t } = useI18n();
  const auth = useAppSelector(s => s.auth);
  const signedIn = auth.hydrated && auth.user && auth.token;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 font-black">CG</span>
          <div>
            <div className="font-bold">{t('brand.name')}</div>
            <div className="text-xs text-slate-400">{t('brand.tagline')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {signedIn ? (
            <Link href={homeForRole(auth.role)} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold">{t('nav.dashboard')}</Link>
          ) : (
            <Link href="/auth/login" className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10">{t('landing.login')}</Link>
          )}
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 start-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-orange-600/30 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <h1 className="text-4xl font-black leading-tight sm:text-6xl">{t('landing.heroTitle')}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">{t('landing.heroText')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/auth/register" className="rounded-xl bg-orange-600 px-6 py-3 font-semibold shadow-lg shadow-orange-900/40 hover:bg-orange-500">{t('landing.register')}</Link>
            <Link href="/auth/login" className="rounded-xl border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">{t('landing.login')}</Link>
          </div>
          <Link href="/tools/health" className="mt-5 inline-block text-sm text-orange-300 underline">{t('landing.tools')} →</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(f => (
          <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <f.icon className="mb-3 h-7 w-7 text-orange-400" />
            <h3 className="text-lg font-semibold">{t(f.title)}</h3>
            <p className="mt-1 text-sm text-slate-300">{t(f.text)}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">© {new Date().getFullYear()} {t('brand.name')}</footer>
    </div>
  );
}
