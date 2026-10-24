"use client";

import { ReactNode, useState, useSyncExternalStore } from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { useI18n } from '@/lib/i18n';
import { FiMenu, FiMoon, FiSun, FiLogOut } from 'react-icons/fi';

interface AppShellProps {
  children: ReactNode;
}

// Theme lives on <html class="dark">; read it as an external store.
const themeListeners = new Set<() => void>();
const subscribeTheme = (cb: () => void) => { themeListeners.add(cb); return () => { themeListeners.delete(cb); }; };
const readTheme = () => document.documentElement.classList.contains('dark');

export default function AppShell({ children }: AppShellProps) {
  const darkMode = useSyncExternalStore(subscribeTheme, readTheme, () => false);
  const [menuOpen, setMenuOpen] = useState(false);
  const auth = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const { t } = useI18n();

  const toggleDarkMode = () => {
    const next = !darkMode;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    themeListeners.forEach(l => l());
  };

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="flex h-screen">
        <Sidebar role={auth.role} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        {menuOpen && (
          <button
            aria-label={t('common.close')}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
                aria-label={t('shell.menu')}
              >
                <FiMenu className="h-5 w-5" />
              </button>
              <div className="truncate text-base font-semibold sm:text-lg">
                {auth.user?.name ? t('shell.welcome', { name: auth.user.name }) : t('shell.welcomeGuest')}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={toggleDarkMode}
                className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={darkMode ? t('shell.darkOff') : t('shell.darkOn')}
                title={darkMode ? t('shell.darkOff') : t('shell.darkOn')}
              >
                {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FiLogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('shell.logout')}</span>
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-3 sm:p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
