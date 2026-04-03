"use client";

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import Link from 'next/link';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [darkMode, setDarkMode] = useState(false);
  const auth = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="flex h-screen">
        <Sidebar role={auth.role} onToggleDarkMode={toggleDarkMode} darkMode={darkMode} />
        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 px-5 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="text-lg font-semibold">{auth.user?.name ? `Welcome, ${auth.user.name}` : 'Welcome'}</div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link href="/auth/login" className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600">
                Switch Account
              </Link>
              <button onClick={handleLogout} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Logout
              </button>
            </div>
          </header>
          <main className="p-5 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
