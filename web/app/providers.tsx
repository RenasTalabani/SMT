"use client";

import { Provider } from 'react-redux';
import { store } from '@/store';
import { ReactNode, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { hydrate } from '@/store/authSlice';
import { I18nProvider } from '@/lib/i18n';

function SessionRestorer() {
  useEffect(() => {
    // Keep the user signed in across page reloads.
    store.dispatch(hydrate());
    // Apply the saved theme before any page renders its shell.
    try {
      if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <I18nProvider>
        <SessionRestorer />
        {children}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: { background: '#363636', color: '#fff' },
            success: { style: { background: '#10b981' }, iconTheme: { primary: '#fff', secondary: '#10b981' } },
            error: { style: { background: '#ef4444' }, iconTheme: { primary: '#fff', secondary: '#ef4444' } }
          }}
        />
      </I18nProvider>
    </Provider>
  );
}
