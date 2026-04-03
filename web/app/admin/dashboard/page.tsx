"use client";

import { useEffect } from 'react';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers } from '@/store/usersSlice';
import { getWorkouts } from '@/store/workoutsSlice';

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector(state => state.users);
  const { plans, loading: workoutsLoading } = useAppSelector(state => state.workouts);

  useEffect(() => {
    dispatch(fetchUsers({ page: 1, limit: 100 }));
    dispatch(getWorkouts({ page: 1, limit: 100 }));
  }, [dispatch]);

  const totalUsers = users.length;
  const totalCoaches = users.filter(u => u.role === 'coach').length;
  const totalClients = users.filter(u => u.role === 'client').length;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p>Monitor usage, user activity, and system health status.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl p-4 text-white bg-blue-500">
              <h2 className="text-sm font-semibold">Total Users</h2>
              <p className="text-3xl font-bold">{totalUsers}</p>
            </div>
            <div className="rounded-xl p-4 text-white bg-emerald-500">
              <h2 className="text-sm font-semibold">Active Coaches</h2>
              <p className="text-3xl font-bold">{totalCoaches}</p>
            </div>
            <div className="rounded-xl p-4 text-white bg-indigo-500">
              <h2 className="text-sm font-semibold">Clients</h2>
              <p className="text-3xl font-bold">{totalClients}</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {workoutsLoading ? (
              <p className="text-blue-600">Loading workout data...</p>
            ) : (
              <p>{plans.length} workout plans loaded</p>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
