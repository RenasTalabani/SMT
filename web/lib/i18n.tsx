"use client";

// Lightweight 3-language support (English, Arabic, Kurdish Sorani) for the web
// app. Arabic and Kurdish switch the whole layout to right-to-left.

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { dictionaries, Lang, TranslationKey } from './translations';

interface I18nValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'ku', label: 'کوردی' },
];

// ── Tiny external store for the chosen language ─────────────────────────────
// useSyncExternalStore renders English on the server and during hydration,
// then switches to the saved language — no hydration mismatch.
let memoryLang: Lang = 'en';
const listeners = new Set<() => void>();

function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem('lang');
    if (v === 'en' || v === 'ar' || v === 'ku') return v;
  } catch {
    /* storage blocked → use in-memory value */
  }
  return memoryLang;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === 'lang') cb(); };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

function writeLang(next: Lang) {
  memoryLang = next;
  try {
    localStorage.setItem('lang', next);
  } catch {
    /* ignore */
  }
  listeners.forEach(l => l());
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore<Lang>(subscribe, readStoredLang, () => 'en');
  const dir: 'ltr' | 'rtl' = lang === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    document.documentElement.lang = lang === 'ku' ? 'ckb' : lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => writeLang(next), []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let text: string = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
      }
      return text;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, dir, setLang, t }), [lang, dir, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback (e.g. a component rendered outside the provider in tests)
    return {
      lang: 'en',
      dir: 'ltr',
      setLang: () => {},
      t: (key) => dictionaries.en[key] ?? key,
    };
  }
  return ctx;
}

/** Picks the localized field of a record: name / nameAr / nameKu. */
export function localized<T extends Record<string, unknown>>(item: T, field: string, lang: Lang): string {
  const suffix = lang === 'ar' ? 'Ar' : lang === 'ku' ? 'Ku' : '';
  const v = (suffix && item[`${field}${suffix}`]) || item[field];
  return typeof v === 'string' ? v : '';
}
