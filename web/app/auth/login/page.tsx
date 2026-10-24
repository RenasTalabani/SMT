"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/authSlice';
import { homeForRole } from '@/components/ProtectedRoute';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector(state => state.auth);
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await dispatch(login({ email, password })).unwrap();
      router.push(homeForRole(result.user.role));
    } catch {
      // error is stored in auth.error
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-orange-600">← {t('brand.name')}</Link>
        <LanguageSwitcher />
      </div>
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <h1 className="mb-6 text-2xl font-bold">{t('auth.loginTitle')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            {t('auth.email')}
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} dir="ltr" />
          </label>
          <label className="block text-sm font-medium">
            {t('auth.password')}
            <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} dir="ltr" />
          </label>
          <button type="submit" disabled={auth.loading} className="w-full rounded-lg bg-orange-600 px-3 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-70">
            {auth.loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
          {auth.error && <p className="text-sm text-red-500" role="alert">{auth.error}</p>}
        </form>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
          {t('auth.noAccount')} <Link href="/auth/register" className="font-medium text-orange-600">{t('auth.create')}</Link>
        </p>
      </div>
    </div>
  );
}
