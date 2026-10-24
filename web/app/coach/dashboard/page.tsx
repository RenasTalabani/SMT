"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useI18n } from '@/lib/i18n';
import { useAppSelector } from '@/store/hooks';
import { Booking, coachBookings, coachClients, myPlans } from '@/services/gymApi';

export default function CoachDashboard() {
  const { t, lang } = useI18n();
  const user = useAppSelector(s => s.auth.user);
  const [clients, setClients] = useState<number | null>(null);
  const [plans, setPlans] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user?._id) return;
    coachClients(user._id).then(c => setClients(c.length)).catch(() => setClients(0));
    myPlans().then(p => setPlans(p.length)).catch(() => setPlans(0));
    coachBookings()
      .then(all => {
        setBookings(all);
        const since = Date.now() - 86_400_000;
        setUpcoming(all.filter(b => b.status === 'confirmed' && new Date(b.slot.date).getTime() >= since).slice(0, 5));
      })
      .catch(() => setBookings([]));
  }, [user?._id]);

  const pending = bookings?.filter(b => b.status === 'pending').length ?? 0;
  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';

  const tiles = [
    { label: t('coach.activeClients'), value: clients, href: '/coach/clients' },
    { label: t('coach.plans'), value: plans, href: '/coach/workouts' },
    { label: t('coach.pendingBookings'), value: bookings ? pending : null, href: '/coach/bookings' },
  ];

  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t('coach.dashTitle')}</h1>
            {user && user.isApproved === false && (
              <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">{t('coach.pendingApproval')}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tiles.map(tile => (
              <Link key={tile.label} href={tile.href} className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-orange-400 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{tile.label}</h3>
                <p className="text-3xl font-bold tabular-nums">{tile.value ?? '—'}</p>
              </Link>
            ))}
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">{t('coach.upcoming')}</h2>
              <Link href="/coach/bookings" className="text-sm text-orange-600">{t('common.viewAll')}</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">{t('dash.noUpcoming')}</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map(b => (
                  <li key={b._id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                    <span>{new Date(b.slot.date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} · <span dir="ltr">{b.slot.startTime}</span></span>
                    <span className="text-slate-500">{typeof b.client === 'object' && b.client ? b.client.name : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
