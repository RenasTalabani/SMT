"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { register } from '@/store/authSlice';
import { homeForRole } from '@/components/ProtectedRoute';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector(state => state.auth);
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'coach'>('client');

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await dispatch(register({ name, email, password, role })).unwrap();
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
        <h1 className="mb-6 text-2xl font-bold">{t('auth.registerTitle')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            {t('auth.name')}
            <input type="text" required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm font-medium">
            {t('auth.email')}
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} dir="ltr" />
          </label>
          <label className="block text-sm font-medium">
            {t('auth.password')}
            <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} dir="ltr" />
            <span className="text-xs text-slate-500">{t('auth.passwordHint')}</span>
          </label>
          <fieldset className="text-sm font-medium">
            <legend>{t('auth.role')}</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(['client', 'coach'] as const).map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-3 py-2 ${role === r ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200' : 'border-slate-300 dark:border-slate-700'}`}
                >
                  {t(r === 'client' ? 'role.client' : 'role.coach')}
                </button>
              ))}
            </div>
            {role === 'coach' && <p className="mt-2 text-xs font-normal text-slate-500">{t('auth.coachPending')}</p>}
          </fieldset>
          <button type="submit" disabled={auth.loading} className="w-full rounded-lg bg-orange-600 px-3 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-70">
            {auth.loading ? t('auth.creating') : t('auth.create')}
          </button>
          {auth.error && <p className="text-sm text-red-500" role="alert">{auth.error}</p>}
        </form>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
          {t('auth.haveAccount')} <Link href="/auth/login" className="font-medium text-orange-600">{t('auth.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
