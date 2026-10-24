"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useI18n } from '@/lib/i18n';
import { useAppSelector } from '@/store/hooks';
import { coachClients, errorMessage } from '@/services/gymApi';

type Client = Awaited<ReturnType<typeof coachClients>>[number];

export default function CoachClients() {
  const { t, lang } = useI18n();
  const user = useAppSelector(s => s.auth.user);
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!user?._id) return;
    coachClients(user._id).then(setClients).catch(e => setError(errorMessage(e, t('common.error'))));
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';
  const shown = (clients ?? []).filter(c => !q || `${c.name} ${c.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <AppShell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">{t('coach.clientsTitle')}</h1>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('common.search')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </div>
          {error && <p className="text-red-600">{error}</p>}
          {!clients && !error && <p className="text-slate-500">{t('common.loading')}</p>}
          {clients?.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700">
              {t('coach.clientsEmpty')} <Link href="/coach/workouts" className="text-orange-600 underline">{t('nav.workouts')}</Link>
            </p>
          )}
          {shown.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-start text-sm">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2 text-start">{t('auth.name')}</th>
                    <th className="px-4 py-2 text-start">{t('auth.email')}</th>
                    <th className="px-4 py-2 text-start">{t('coach.lastSeen')}</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map(c => (
                    <tr key={c._id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2" dir="ltr">{c.email}</td>
                      <td className="px-4 py-2 text-slate-500">{c.lastLogin ? new Date(c.lastLogin).toLocaleDateString(locale) : '—'}</td>
                      <td className="px-4 py-2 text-end">
                        <Link href="/client/chat" className="text-orange-600 hover:underline">{t('nav.chat')}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
