"use client";

import { LANGUAGES, useI18n } from '@/lib/i18n';
import { Lang } from '@/lib/translations';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span className="sr-only">{t('shell.language')}</span>
      <select
        value={lang}
        onChange={e => setLang(e.target.value as Lang)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        aria-label={t('shell.language')}
      >
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
}
