"use client";

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAppSelector } from '@/store/hooks';
import FileUpload from '@/components/FileUpload';

export default function ClientDashboard() {
  const auth = useAppSelector(state => state.auth);
  const [avatarUrl, setAvatarUrl] = useState(auth.user?.avatar || '');

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
    // In a real app, you'd update the user profile in Redux/store
    window.alert('Avatar updated successfully!');
  };

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Client Dashboard</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">View your training schedule, progress, and coach messages.</p>

          {/* Profile Section */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-slate-600 dark:text-slate-300">
                    {auth.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium">{auth.user?.name}</h3>
                <p className="text-slate-600 dark:text-slate-300">{auth.user?.email}</p>
                <FileUpload
                  onUpload={handleAvatarUpload}
                  label="Change Avatar"
                  endpoint={`/users/${auth.user?._id}/avatar`}
                  fieldName="avatar"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { title: 'Active Plans', value: '1', color: 'bg-blue-500' },
              { title: 'Completed Workouts', value: '12', color: 'bg-emerald-500' },
              { title: 'Unread Messages', value: '3', color: 'bg-orange-500' }
            ].map(card => (
              <div key={card.title} className={`rounded-xl p-4 text-white ${card.color}`}>
                <h2 className="text-sm font-semibold">{card.title}</h2>
                <p className="text-3xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
