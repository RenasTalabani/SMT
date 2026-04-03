"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/authSlice';
import Link from 'next/link';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector(state => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));

    if ((result as any).type === 'auth/login/fulfilled') {
      const role = (result as any).payload.user.role;
      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'coach') router.push('/coach/dashboard');
      else router.push('/client/dashboard');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-md items-center justify-center px-4 py-10">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <h1 className="mb-4 text-3xl font-bold">Login to Ultimate Gym</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={auth.loading}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {auth.loading ? 'Logging in...' : 'Login'}
          </button>
          {auth.error && <p className="text-sm text-red-500">{auth.error}</p>}
        </form>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
          Don't have an account? <Link href="/auth/register" className="text-blue-600 hover:text-blue-700">Register</Link>
        </p>
      </div>
    </div>
  );
}
