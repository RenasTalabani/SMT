"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useI18n } from '@/lib/i18n';

interface ProtectedRouteProps {
  allowedRoles: Array<'admin' | 'coach' | 'client'>;
  children: ReactNode;
}

export function homeForRole(role: string | null | undefined) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'coach') return '/coach/dashboard';
  return '/client/dashboard';
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const router = useRouter();
  const auth = useAppSelector(state => state.auth);
  const { t } = useI18n();

  const signedIn = Boolean(auth.user && auth.token);
  const allowed = signedIn && auth.role !== null && allowedRoles.includes(auth.role);

  useEffect(() => {
    if (!auth.hydrated) return; // wait until the saved session has been read
    if (!signedIn) {
      router.replace('/auth/login');
    } else if (!allowed) {
      router.replace(homeForRole(auth.role)); // wrong area → send to own dashboard
    }
  }, [auth.hydrated, signedIn, allowed, auth.role, router]);

  if (!auth.hydrated || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-lg text-slate-500">
        {t('common.checkingAccess')}
      </div>
    );
  }

  return <>{children}</>;
}
