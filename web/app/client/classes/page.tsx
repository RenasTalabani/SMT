"use client";

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { localized, useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { useAppSelector } from '@/store/hooks';
import { GymClass, errorMessage, joinClass, leaveClass, listClasses } from '@/services/gymApi';

function idOf(x: string | { _id: string }) { return typeof x === 'string' ? x : x._id; }

export default function ClassesPage() {
  const { t, lang } = useI18n();
  const me = useAppSelector(s => s.auth.user?._id);
  const [classes, setClasses] = useState<GymClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => listClasses().then(setClasses).catch(e => setError(errorMessage(e, t('common.error'))));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (c: GymClass, joined: boolean) => {
    setBusy(c._id);
    try {
      if (joined) await leaveClass(c._id); else await joinClass(c._id);
      toast.success(t('common.saved'));
      await load();
    } catch (e) {
      toast.error(errorMessage(e, t('common.error')));
    } finally {
      setBusy(null);
    }
  };

  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';
  // group by day
  const groups = new Map<string, GymClass[]>();
  for (const c of classes ?? []) {
    const key = new Date(c.startsAt).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <AppShell>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{t('classes.title')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('classes.subtitle')}</p>
          </div>
          {error && <p className="text-red-600">{error}</p>}
          {!classes && !error && <p className="text-slate-500">{t('common.loading')}</p>}
          {classes?.length === 0 && <p className="text-slate-500">{t('common.empty')}</p>}
          {[...groups.entries()].map(([day, list]) => (
            <section key={day}>
              <h2 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">{day}</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {list.map(c => {
                  const joined = !!me && c.attendees.some(a => idOf(a) === me);
                  const left = c.capacity - c.attendees.length;
                  return (
                    <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold uppercase text-orange-600">{t(`classes.cat.${c.category}` as TranslationKey)}</div>
                          <h3 className="text-lg font-semibold">{localized(c, 'title', lang)}</h3>
                          <p className="text-sm text-slate-500">
                            <span dir="ltr">{new Date(c.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span> · {c.durationMin} {t('common.minutes')} · {typeof c.coach === 'object' ? c.coach.name : ''}
                          </p>
                          {c.location && <p className="text-xs text-slate-500">📍 {c.location}</p>}
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${left > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-red-100 text-red-700'}`}>
                          {left > 0 ? t('classes.spots', { n: left }) : t('classes.full')}
                        </span>
                      </div>
                      <button
                        disabled={busy === c._id || (!joined && left <= 0)}
                        onClick={() => act(c, joined)}
                        className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 ${joined ? 'border border-slate-300 dark:border-slate-700' : 'bg-orange-600 text-white'}`}
                      >
                        {joined ? `✓ ${t('classes.joined')} · ${t('classes.leave')}` : t('classes.join')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
