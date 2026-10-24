"use client";

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { adminAnnouncement, adminStats, approveUser, errorMessage } from '@/services/gymApi';

type Stats = Awaited<ReturnType<typeof adminStats>>;

export default function AdminDashboard() {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ann, setAnn] = useState({ title: '', message: '' });

  const load = () => adminStats().then(setStats).catch(e => setError(errorMessage(e, t('common.error'))));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await adminAnnouncement(ann.title, ann.message);
      setAnn({ title: '', message: '' });
      toast.success(t('admin.sent'));
    } catch (err) {
      toast.error(errorMessage(err, t('common.error')));
    }
  };

  const approve = async (id: string) => {
    try {
      await approveUser(id);
      toast.success(t('common.saved'));
      load();
    } catch (err) {
      toast.error(errorMessage(err, t('common.error')));
    }
  };

  const o = stats?.overview ?? {};
  const tiles: [TranslationKey, number | undefined][] = [
    ['admin.totalUsers', o.totalUsers], ['admin.coaches', o.totalCoaches], ['admin.members', o.totalClients],
    ['admin.courses', o.totalCourses], ['admin.tips', o.totalTips], ['admin.plans', o.totalWorkoutPlans],
  ];
  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">{t('admin.dashTitle')}</h1>
            {stats && <span className="text-sm text-slate-500">{t('admin.growth')}: <b className={stats.growth.userGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}>{stats.growth.userGrowth}%</b></span>}
          </div>
          {error && <p className="text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {tiles.map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-sm text-slate-500">{t(k)}</div>
                <div className="text-3xl font-bold tabular-nums">{v ?? '—'}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{t('admin.recentUsers')}</h2>
                <Link href="/admin/users" className="text-sm text-orange-600">{t('common.viewAll')}</Link>
              </div>
              <ul className="space-y-2">
                {stats?.recent.users.map(u => (
                  <li key={u._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                    <span>
                      <b>{u.name}</b> <span className="text-slate-500">· {t(`role.${u.role}` as TranslationKey)} · {new Date(u.createdAt).toLocaleDateString(locale)}</span>
                    </span>
                    {u.role === 'coach' && !u.isApproved && (
                      <button onClick={() => approve(u._id)} className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">{t('admin.approve')}</button>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <form onSubmit={send} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-semibold">{t('admin.announcement')}</h2>
              <input required value={ann.title} onChange={e => setAnn({ ...ann, title: e.target.value })} placeholder={t('admin.announcementTitle')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
              <textarea required rows={3} value={ann.message} onChange={e => setAnn({ ...ann, message: e.target.value })} placeholder={t('admin.announcementMessage')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
              <button className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white">{t('common.submit')}</button>
            </form>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
