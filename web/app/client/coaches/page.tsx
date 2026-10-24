"use client";

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { Coach, DaySlots, Slot, createBooking, errorMessage, getSlots, listCoaches } from '@/services/gymApi';

const SESSION_TYPES = ['personal_training', 'nutrition_consult', 'assessment', 'online'] as const;

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function BookingPanel({ coach, onDone }: { coach: Coach; onDone: () => void }) {
  const { t, lang } = useI18n();
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [day, setDay] = useState<DaySlots | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [type, setType] = useState<(typeof SESSION_TYPES)[number]>('personal_training');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSlots(coach._id)
      .then(d => { setDays(d); setDay(d[0] ?? null); })
      .catch(e => setError(errorMessage(e, t('common.error'))));
  }, [coach._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

  const book = async () => {
    if (!day || !slot) return;
    setBusy(true);
    try {
      await createBooking({ coachId: coach._id, date: day.date, startTime: slot.startTime, endTime: slot.endTime, type, notes: notes || undefined });
      toast.success(t('coaches.booked'));
      onDone();
    } catch (e) {
      toast.error(errorMessage(e, t('common.error')));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!days) return <p className="text-sm text-slate-500">{t('common.loading')}</p>;
  if (days.length === 0) return <p className="text-sm text-slate-500">{t('coaches.noSlots')}</p>;

  return (
    <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
      <div>
        <p className="mb-1 text-sm font-medium">{t('coaches.chooseDay')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map(d => (
            <button
              key={d.date}
              onClick={() => { setDay(d); setSlot(null); }}
              className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${day?.date === d.date ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200' : 'border-slate-300 dark:border-slate-700'}`}
            >
              {fmt(d.date)}
            </button>
          ))}
        </div>
      </div>
      {day && (
        <div>
          <p className="mb-1 text-sm font-medium">{t('coaches.chooseTime')}</p>
          <div className="flex flex-wrap gap-2">
            {day.slots.map(s => (
              <button
                key={s.startTime}
                onClick={() => setSlot(s)}
                className={`rounded-lg border px-3 py-1.5 text-sm tabular-nums ${slot?.startTime === s.startTime ? 'border-orange-500 bg-orange-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}
                dir="ltr"
              >
                {s.startTime}–{s.endTime}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-slate-600 dark:text-slate-300">{t('coaches.type')}</span>
          <select value={type} onChange={e => setType(e.target.value as (typeof SESSION_TYPES)[number])} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-800">
            {SESSION_TYPES.map(s => <option key={s} value={s}>{t(`booking.type.${s}` as TranslationKey)}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-slate-600 dark:text-slate-300">{t('coaches.notes')}</span>
          <input value={notes} maxLength={500} onChange={e => setNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
        </label>
      </div>
      <button
        disabled={!slot || busy}
        onClick={book}
        className="w-full rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {busy ? t('common.loading') : t('coaches.confirm')}
      </button>
    </div>
  );
}

export default function CoachesPage() {
  const { t } = useI18n();
  const [coaches, setCoaches] = useState<Coach[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    listCoaches().then(setCoaches).catch(e => setError(errorMessage(e, t('common.error'))));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <AppShell>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{t('coaches.title')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('coaches.subtitle')}</p>
          </div>
          {error && <p className="text-red-600">{error}</p>}
          {!coaches && !error && <p className="text-slate-500">{t('common.loading')}</p>}
          {coaches?.length === 0 && <p className="text-slate-500">{t('common.empty')}</p>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {coaches?.map(c => (
              <div key={c._id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  {c.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar} alt={c.name} className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-lg font-bold text-white">{initials(c.name)}</div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{c.name}</h2>
                    <p className="truncate text-sm text-slate-500">
                      {Array.isArray(c.specialization) ? c.specialization.join(' · ') : c.specialization}
                    </p>
                    {typeof c.rating === 'number' && c.rating > 0 && <p className="text-sm text-amber-500">★ {c.rating.toFixed(1)}</p>}
                  </div>
                </div>
                {c.bio && <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{c.bio}</p>}
                {open === c._id ? (
                  <BookingPanel coach={c} onDone={() => setOpen(null)} />
                ) : (
                  <button onClick={() => setOpen(c._id)} className="w-full rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    {t('coaches.book')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
