"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

interface ProtectedRouteProps {
  allowedRoles: Array<'admin' | 'coach' | 'client'>;
  children: ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const router = useRouter();
  const auth = useAppSelector(state => state.auth);

  useEffect(() => {
    if (!auth.user || !auth.token) {
      router.replace('/auth/login');
      return;
    }

    if (auth.role && !allowedRoles.includes(auth.role)) {
      router.replace('/auth/login');
    }
  }, [auth, allowedRoles, router]);

  if (!auth.user || !auth.token || (auth.role && !allowedRoles.includes(auth.role))) {
    return <div className="p-8 text-center text-xl">Checking access...</div>;
  }

  return <>{children}</>;
}
