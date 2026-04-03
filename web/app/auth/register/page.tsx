"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { register } from '@/store/authSlice';
import Link from 'next/link';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector(state => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'coach'>('client');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(register({ name, email, password, role }));

    if ((result as any).type === 'auth/register/fulfilled') {
      if (role === 'coach') router.push('/coach/dashboard');
      else router.push('/client/dashboard');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-md items-center justify-center px-4 py-10">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <h1 className="mb-4 text-3xl font-bold">Create an account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'client' | 'coach')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="client">Client</option>
              <option value="coach">Coach</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={auth.loading}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {auth.loading ? 'Signing up...' : 'Register'}
          </button>
          {auth.error && <p className="text-sm text-red-500">{auth.error}</p>}
        </form>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
          Already have an account? <Link href="/auth/login" className="text-blue-600 hover:text-blue-700">Login</Link>
        </p>
      </div>
    </div>
  );
}
