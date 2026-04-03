"use client";

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getWorkouts, createWorkout, assignWorkout } from '@/store/workoutsSlice';

export default function CoachWorkouts() {
  const dispatch = useAppDispatch();
  const { plans, loading, error } = useAppSelector(state => state.workouts);

  const [title, setTitle] = useState('Full Body Template');
  const [description, setDescription] = useState('Balanced workout');
  const [clientId, setClientId] = useState('');
  const [createMode, setCreateMode] = useState(false);

  useEffect(() => {
    dispatch(getWorkouts({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleCreate = async () => {
    try {
      await dispatch(createWorkout({ title, description, difficulty: 'medium', category: 'strength', isTemplate: true })).unwrap();
      window.alert('Workout created successfully');
      setTitle('');
      setDescription('');
    } catch (err: any) {
      window.alert(err || 'Create workout failed');
    }
  };

  const handleAssign = async (workoutId: string) => {
    if (!clientId) return window.alert('Client ID required');
    try {
      await dispatch(assignWorkout({ workoutId, clientId })).unwrap();
      window.alert('Workout assigned successfully');
    } catch (err: any) {
      window.alert(err || 'Assign workout failed');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <AppShell>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Workout Plans</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Create and assign workout plans to your clients.</p>

          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setCreateMode(!createMode)}
              className="mb-3 rounded-md bg-blue-600 px-3 py-2 text-white"
            >
              {createMode ? 'Hide Creator' : 'Create Workout'}
            </button>

            {createMode && (
              <div className="space-y-2">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full rounded border p-2" />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full rounded border p-2" />
                <button onClick={handleCreate} className="rounded-md bg-green-600 px-3 py-2 text-white">Create</button>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm">Client ID to assign</label>
              <input value={clientId} onChange={e => setClientId(e.target.value)} className="w-full rounded border p-2" />
            </div>

            {loading ? <p className="text-blue-600">Loading workouts...</p> : null}
            {error ? <p className="text-red-500">{error}</p> : null}

            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">Title</th>
                  <th className="px-2 py-1">Difficulty</th>
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => (
                  <tr key={plan._id} className="border-t border-slate-200">
                    <td className="px-2 py-1">{plan.title}</td>
                    <td className="px-2 py-1">{plan.difficulty || 'N/A'}</td>
                    <td className="px-2 py-1">{plan.status || 'active'}</td>
                    <td className="px-2 py-1">
                      <button onClick={() => handleAssign(plan._id)} className="rounded bg-emerald-500 px-2 py-1 text-white">Assign</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
