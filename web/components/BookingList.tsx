"use client";

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import {
  Booking, BookingStatus, coachBookings, errorMessage, myBookings, rateBooking, setBookingStatus,
} from '@/services/gymApi';

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  confirmed: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  cancelled: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  no_show: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
};

function personName(p: Booking['coach']) {
  return typeof p === 'object' && p ? p.name : '';
}

export default function BookingList({ mode }: { mode: 'client' | 'coach' }) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    (mode === 'coach' ? coachBookings() : myBookings())
      .then(setItems)
      .catch(e => setError(errorMessage(e, t('common.error'))));
  }, [mode, t]);

  useEffect(load, [load]);

  const act = async (b: Booking, status: BookingStatus) => {
    let reason: string | undefined;
    if (status === 'cancelled') {
      reason = window.prompt(t('bookings.cancelReason')) || undefined;
      if (!reason) return;
    }
    setBusy(b._id);
    try {
      await setBookingStatus(b._id, status, reason);
      toast.success(t('common.saved'));
      load();
    } catch (e) {
      toast.error(errorMessage(e, t('common.error')));
    } finally {
      setBusy(null);
    }
  };

  const rate = async (b: Booking, score: number) => {
    setBusy(b._id);
    try {
      await rateBooking(b._id, score);
      toast.success(t('bookings.rated'));
      load();
    } catch (e) {
      toast.error(errorMessage(e, t('common.error')));
    } finally {
      setBusy(null);
    }
  };

  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';

  if (error) return <p className="text-red-600">{error} <button className="underline" onClick={load}>{t('common.retry')}</button></p>;
  if (!items) return <p className="text-slate-500">{t('common.loading')}</p>;
  if (items.length === 0) return <p className="text-slate-500">{mode === 'client' ? t('dash.noUpcoming') : t('common.empty')}</p>;

  return (
    <ul className="space-y-3">
      {items.map(b => {
        const other = mode === 'client' ? personName(b.coach) : personName(b.client);
        const open = b.status === 'pending' || b.status === 'confirmed';
        return (
          <li key={b._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{t(`booking.type.${b.type}` as TranslationKey)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[b.status]}`}>{t(`booking.status.${b.status}` as TranslationKey)}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {new Date(b.slot.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                {' · '}<span dir="ltr">{b.slot.startTime}–{b.slot.endTime}</span>
                {other && <> · {t('bookings.with', { name: other })}</>}
              </p>
              {b.notes && <p className="text-xs text-slate-500">“{b.notes}”</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {mode === 'coach' && b.status === 'pending' && (
                <button disabled={busy === b._id} onClick={() => act(b, 'confirmed')} className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 disabled:opacity-50">{t('bookings.confirm')}</button>
              )}
              {mode === 'coach' && b.status === 'confirmed' && (
                <>
                  <button disabled={busy === b._id} onClick={() => act(b, 'completed')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">{t('bookings.complete')}</button>
                  <button disabled={busy === b._id} onClick={() => act(b, 'no_show')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700">{t('bookings.noShow')}</button>
                </>
              )}
              {open && (
                <button disabled={busy === b._id} onClick={() => act(b, 'cancelled')} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20">{t('bookings.cancel')}</button>
              )}
              {mode === 'client' && b.status === 'completed' && !b.rating?.score && (
                <div className="flex items-center gap-1" aria-label={t('bookings.rate')}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} disabled={busy === b._id} onClick={() => rate(b, s)} className="text-xl text-amber-400 hover:scale-110" title={`${s}/5`}>★</button>
                  ))}
                </div>
              )}
              {b.rating?.score ? <span className="text-sm text-amber-500">{'★'.repeat(b.rating.score)}</span> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
