"use client";

import Link from 'next/link';
import HealthTools from '@/components/HealthTools';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

// Public version of the calculators (no sign-in) — linked from the landing page.
export default function PublicHealthTools() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="text-lg font-bold text-orange-600">← {t('brand.name')}</Link>
        <LanguageSwitcher />
      </div>
      <h1 className="text-3xl font-bold">{t('health.title')}</h1>
      <p className="text-slate-600 dark:text-slate-300">{t('health.subtitle')}</p>
      <HealthTools />
      <div className="pt-4">
        <Link href="/auth/register" className="rounded-lg bg-orange-600 px-5 py-2.5 font-semibold text-white hover:bg-orange-700">
          {t('landing.register')}
        </Link>
      </div>
    </main>
  );
}
