"use client";

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import BookingList from '@/components/BookingList';
import { useI18n } from '@/lib/i18n';

export default function ClientBookingsPage() {
  const { t } = useI18n();
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <AppShell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">{t('bookings.title')}</h1>
            <Link href="/client/coaches" className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">{t('dash.bookNow')}</Link>
          </div>
          <BookingList mode="client" />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
