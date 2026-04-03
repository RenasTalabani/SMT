"use client";

import { Provider } from 'react-redux';
import { store } from '@/store';
import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff'
          },
          success: {
            style: {
              background: '#10b981'
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981'
            }
          },
          error: {
            style: {
              background: '#ef4444'
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444'
            }
          }
        }}
      />
    </Provider>
  );
}
