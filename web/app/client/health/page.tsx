"use client";

import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import HealthTools from '@/components/HealthTools';
import { useI18n } from '@/lib/i18n';

export default function ClientHealthPage() {
  const { t } = useI18n();
  return (
    <ProtectedRoute allowedRoles={['client', 'coach', 'admin']}>
      <AppShell>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{t('health.title')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('health.subtitle')}</p>
          </div>
          <HealthTools />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
