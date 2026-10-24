"use client";

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { localized, useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { useAppSelector } from '@/store/hooks';
import {
  GymClass, cancelClass, classRoster, createClass, errorMessage, listClasses, markAttendance,
} from '@/services/gymApi';

const CATS = ['hiit', 'strength', 'cardio', 'yoga', 'boxing', 'cycling', 'crossfit', 'other'];
const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800';

export default function CoachClassesPage() {
  const { t, lang } = useI18n();
  const user = useAppSelector(s => s.auth.user);
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [roster, setRoster] = useState<GymClass | null>(null);
  const [form, setForm] = useState({ title: '', category: 'hiit', startsAt: '', durationMin: 60, capacity: 15, location: 'Main hall', repeatWeeks: 1 });

  const load = () => listClasses(user?.role === 'coach').then(setClasses).catch(() => {});
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createClass({ ...form, startsAt: new Date(form.startsAt).toISOString() });
      toast.success(t('classes.created'));
      setForm({ ...form, title: '' });
      load();
    } catch (err) {
      toast.error(errorMessage(err, t('common.error')));
    }
  };

  const openRoster = async (c: GymClass) => {
    try { setRoster(await classRoster(c._id)); } catch (err) { toast.error(errorMessage(err, t('common.error'))); }
  };

  const toggle = async (userId: string, present: boolean) => {
    if (!roster) return;
    try {
      const updated = await markAttendance(roster._id, userId, present);
      setRoster({ ...roster, attended: updated.attended });
    } catch (err) {
      toast.error(errorMessage(err, t('common.error')));
    }
  };

  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';

  return (
    <ProtectedRoute allowedRoles={['coach', 'admin']}>
      <AppShell>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">{t('classes.title')}</h1>
            {classes.length === 0 && <p className="text-slate-500">{t('common.empty')}</p>}
            {classes.map(c => (
              <div key={c._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="font-semibold">{localized(c, 'title', lang)} <span className="text-xs text-orange-600">{t(`classes.cat.${c.category}` as TranslationKey)}</span></div>
                  <div className="text-sm text-slate-500">{new Date(c.startsAt).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {c.attendees.length}/{c.capacity}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openRoster(c)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white">{t('classes.roster')}</button>
                  <button onClick={() => { if (window.confirm(t('classes.cancelClass') + '?')) cancelClass(c._id).then(load); }} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600">{t('classes.cancelClass')}</button>
                </div>
              </div>
            ))}

            {roster && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-900/20">
                <div className="mb-2 flex justify-between">
                  <h2 className="font-semibold">{t('classes.roster')}: {roster.title}</h2>
                  <button onClick={() => setRoster(null)} className="text-sm underline">{t('common.close')}</button>
                </div>
                {roster.attendees.length === 0 ? <p className="text-sm text-slate-500">{t('common.empty')}</p> : (
                  <ul className="space-y-1">
                    {roster.attendees.map(a => {
                      if (typeof a === 'string') return null;
                      const present = roster.attended.includes(a._id);
                      return (
                        <li key={a._id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm dark:bg-slate-900">
                          <span>{a.name} <span className="text-slate-500" dir="ltr">{a.phone}</span></span>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={present} onChange={e => toggle(a._id, e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                            {t('classes.present')}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="h-fit space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-semibold">{t('classes.new')}</h2>
            <input required minLength={2} placeholder={t('classes.name')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
              {CATS.map(c => <option key={c} value={c}>{t(`classes.cat.${c}` as TranslationKey)}</option>)}
            </select>
            <label className="block text-xs">{t('classes.when')}<input required type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} className={inputCls} /></label>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs">{t('classes.duration')}<input type="number" min={15} max={240} value={form.durationMin} onChange={e => setForm({ ...form, durationMin: Number(e.target.value) })} className={inputCls} /></label>
              <label className="text-xs">{t('classes.capacity')}<input type="number" min={1} max={500} value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} className={inputCls} /></label>
              <label className="text-xs">{t('classes.repeat')}<input type="number" min={1} max={12} value={form.repeatWeeks} onChange={e => setForm({ ...form, repeatWeeks: Number(e.target.value) })} className={inputCls} /></label>
            </div>
            <input placeholder={t('classes.location')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputCls} />
            <button className="w-full rounded-lg bg-orange-600 py-2 font-semibold text-white">{t('common.save')}</button>
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
