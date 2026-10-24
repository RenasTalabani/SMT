"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiActivity, FiCalendar, FiCpu, FiHeart, FiTarget, FiTrendingDown, FiZap, FiClock } from 'react-icons/fi';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { useAppSelector } from '@/store/hooks';
import { Booking, ProgressStats, aiDailyTip, myBookings, myPlans, progressStats } from '@/services/gymApi';

function Stat({ icon: Icon, label, value, color }: { icon: typeof FiActivity; label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-2xl p-4 text-white shadow-sm ${color}`}>
      <Icon className="mb-2 h-5 w-5 opacity-80" />
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
}

export default function ClientDashboard() {
  const { t, lang } = useI18n();
  const user = useAppSelector(s => s.auth.user);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [plans, setPlans] = useState<{ _id: string; title: string; difficulty?: string }[] | null>(null);

  useEffect(() => {
    progressStats(30).then(setStats).catch(() => setStats(null));
    aiDailyTip().then(setTip).catch(() => setTip(null));
    myBookings()
      .then(b => setBookings(b.filter(x => (x.status === 'pending' || x.status === 'confirmed') && new Date(x.slot.date).getTime() >= Date.now() - 86_400_000).slice(0, 3)))
      .catch(() => setBookings([]));
    myPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';
  const quick: { href: string; label: TranslationKey; icon: typeof FiActivity }[] = [
    { href: '/client/anatomy', label: 'nav.anatomy', icon: FiTarget },
    { href: '/client/ai', label: 'nav.aiCoach', icon: FiCpu },
    { href: '/client/coaches', label: 'dash.bookNow', icon: FiCalendar },
    { href: '/client/health', label: 'nav.health', icon: FiHeart },
  ];

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t('dash.hello', { name: user?.name?.split(' ')[0] ?? '' })}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('dash.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={FiActivity} label={t('dash.workouts30')} value={stats?.totalWorkouts ?? '—'} color="bg-gradient-to-br from-orange-500 to-red-500" />
            <Stat icon={FiZap} label={t('dash.streak')} value={stats?.workoutStreak ?? '—'} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
            <Stat icon={FiClock} label={t('dash.minutes')} value={stats?.totalDuration ?? '—'} color="bg-gradient-to-br from-sky-500 to-indigo-600" />
            <Stat icon={FiTrendingDown} label={t('dash.weight')} value={stats ? (stats.weightChange > 0 ? `+${stats.weightChange}` : stats.weightChange) : '—'} color="bg-gradient-to-br from-violet-500 to-fuchsia-600" />
          </div>

          {tip && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20">
              <div className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">💡 {t('dash.tipOfDay')}</div>
              <p className="mt-1 text-slate-800 dark:text-slate-100">{tip}</p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{t('dash.upcoming')}</h2>
                <Link href="/client/bookings" className="text-sm text-orange-600">{t('common.viewAll')}</Link>
              </div>
              {bookings.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {t('dash.noUpcoming')} <Link href="/client/coaches" className="font-medium text-orange-600 underline">{t('dash.bookNow')}</Link>
                </p>
              ) : (
                <ul className="space-y-2">
                  {bookings.map(b => (
                    <li key={b._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                      <span>{new Date(b.slot.date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} · <span dir="ltr">{b.slot.startTime}</span></span>
                      <span className="text-slate-500">{typeof b.coach === 'object' && b.coach ? b.coach.name : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{t('dash.activePlans')}</h2>
                <Link href="/client/plan" className="text-sm text-orange-600">{t('common.viewAll')}</Link>
              </div>
              {plans === null ? (
                <p className="text-sm text-slate-500">{t('common.loading')}</p>
              ) : plans.length === 0 ? (
                <p className="text-sm text-slate-500">{t('dash.noPlans')}</p>
              ) : (
                <ul className="space-y-2">
                  {plans.map(p => (
                    <li key={p._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                      <span className="font-medium">{p.title}</span>
                      {p.difficulty && <span className="text-xs text-slate-500">{t(`ai.level.${p.difficulty}` as TranslationKey)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section>
            <h2 className="mb-3 font-semibold">{t('dash.quick')}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {quick.map(q => (
                <Link key={q.href} href={q.href} className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm font-medium hover:border-orange-400 hover:shadow dark:border-slate-800 dark:bg-slate-900">
                  <q.icon className="h-6 w-6 text-orange-600" />
                  {t(q.label)}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
