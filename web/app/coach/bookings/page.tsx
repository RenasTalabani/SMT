"use client";

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import BookingList from '@/components/BookingList';
import { useI18n } from '@/lib/i18n';

export default function CoachBookingsPage() {
  const { t } = useI18n();
  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <AppShell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">{t('bookings.coachTitle')}</h1>
            <Link href="/coach/schedule" className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600">{t('nav.schedule')}</Link>
          </div>
          <BookingList mode="coach" />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
