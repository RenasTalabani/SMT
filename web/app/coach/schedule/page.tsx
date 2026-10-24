"use client";

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { Availability, WEEKDAYS, Weekday, errorMessage, getMyAvailability, saveAvailability } from '@/services/gymApi';

function emptySchedule(): Availability {
  const weeklySchedule = Object.fromEntries(
    WEEKDAYS.map(d => [d, { enabled: d !== 'friday', slots: [{ startTime: '16:00', endTime: '21:00' }] }]),
  ) as Availability['weeklySchedule'];
  return { weeklySchedule, sessionDurationMin: 60, bufferMin: 0, sessionPrice: 0 };
}

export default function CoachSchedulePage() {
  const { t } = useI18n();
  const [a, setA] = useState<Availability | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyAvailability()
      .then(v => {
        if (!v) return setA(emptySchedule());
        // make sure every weekday exists
        const base = emptySchedule();
        const weeklySchedule = { ...base.weeklySchedule };
        for (const d of WEEKDAYS) {
          const day = v.weeklySchedule?.[d];
          if (day) weeklySchedule[d] = { enabled: !!day.enabled, slots: (day.slots || []).map(s => ({ startTime: s.startTime, endTime: s.endTime })) };
        }
        setA({ ...base, ...v, weeklySchedule });
      })
      .catch(e => setError(errorMessage(e, t('common.error'))));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateDay = (d: Weekday, fn: (day: Availability['weeklySchedule'][Weekday]) => Availability['weeklySchedule'][Weekday]) => {
    setA(prev => (prev ? { ...prev, weeklySchedule: { ...prev.weeklySchedule, [d]: fn(prev.weeklySchedule[d]) } } : prev));
  };

  const save = async () => {
    if (!a) return;
    setSaving(true);
    try {
      const saved = await saveAvailability(a);
      setA(prev => (prev ? { ...prev, ...saved, weeklySchedule: prev.weeklySchedule } : prev));
      toast.success(t('common.saved'));
    } catch (e) {
      toast.error(errorMessage(e, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <AppShell>
        <div className="max-w-3xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{t('schedule.title')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('schedule.subtitle')}</p>
          </div>
          {error && <p className="text-red-600">{error}</p>}
          {!a && !error && <p className="text-slate-500">{t('common.loading')}</p>}
          {a && (
            <>
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
                {([
                  ['schedule.duration', 'sessionDurationMin', 15, 240],
                  ['schedule.buffer', 'bufferMin', 0, 120],
                  ['schedule.price', 'sessionPrice', 0, 10_000_000],
                ] as const).map(([label, key, min, max]) => (
                  <label key={key} className="text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{t(label)}</span>
                    <input
                      type="number" min={min} max={max}
                      value={a[key]}
                      onChange={e => setA({ ...a, [key]: Number(e.target.value) })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                ))}
              </div>

              <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {WEEKDAYS.map(d => {
                  const day = a.weeklySchedule[d];
                  return (
                    <div key={d} className="flex flex-wrap items-start gap-3 p-4">
                      <label className="flex w-36 items-center gap-2 font-medium">
                        <input type="checkbox" checked={day.enabled} onChange={e => updateDay(d, x => ({ ...x, enabled: e.target.checked }))} className="h-4 w-4 accent-orange-600" />
                        {t(`schedule.day.${d}` as TranslationKey)}
                      </label>
                      <div className={`flex flex-1 flex-col gap-2 ${day.enabled ? '' : 'opacity-40'}`}>
                        {day.slots.map((s, i) => (
                          <div key={i} className="flex flex-wrap items-center gap-2 text-sm" dir="ltr">
                            <input type="time" value={s.startTime} disabled={!day.enabled}
                              onChange={e => updateDay(d, x => ({ ...x, slots: x.slots.map((y, j) => (j === i ? { ...y, startTime: e.target.value } : y)) }))}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800" />
                            <span>→</span>
                            <input type="time" value={s.endTime} disabled={!day.enabled}
                              onChange={e => updateDay(d, x => ({ ...x, slots: x.slots.map((y, j) => (j === i ? { ...y, endTime: e.target.value } : y)) }))}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800" />
                            <button type="button" disabled={!day.enabled} onClick={() => updateDay(d, x => ({ ...x, slots: x.slots.filter((_, j) => j !== i) }))} className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="remove">
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                        <button type="button" disabled={!day.enabled}
                          onClick={() => updateDay(d, x => ({ ...x, slots: [...x.slots, { startTime: '09:00', endTime: '12:00' }] }))}
                          className="flex w-fit items-center gap-1 text-sm text-orange-600 hover:underline">
                          <FiPlus /> {t('schedule.addSlot')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={save} disabled={saving} className="rounded-lg bg-orange-600 px-6 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
