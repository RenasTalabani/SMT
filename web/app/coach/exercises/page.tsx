"use client";

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchExercises, createExercise } from '@/store/exercisesSlice';

export default function CoachExercises() {
  const dispatch = useAppDispatch();
  const { exercises, loading, error } = useAppSelector(state => state.exercises);
  const [name, setName] = useState('Push-up');
  const [description, setDescription] = useState('Bodyweight press movement');

  useEffect(() => {
    dispatch(fetchExercises({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleCreate = async () => {
    try {
      await dispatch(createExercise({ name, description })).unwrap();
      window.alert('Exercise created');
      setName('');
      setDescription('');
    } catch (err: any) {
      window.alert(err || 'Failed to create exercise');
    }
  };

  return (
    <ProtectedRoute allowedRoles={[ 'coach' ]}>
      <AppShell>
        <div>
          <h1 className="text-2xl font-bold">Exercises</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Build your exercise library and categories.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold">Add New Exercise</h3>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="mt-2 w-full rounded border p-2" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="mt-2 w-full rounded border p-2" />
              <button onClick={handleCreate} className="mt-2 rounded bg-emerald-500 px-3 py-2 text-white">Create</button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold">Exercise Library</h3>
              {loading && <p className="text-blue-600">Loading exercises...</p>}
              {error && <p className="text-red-500">{error}</p>}
              {exercises.length === 0 && !loading ? <p>No exercises available.</p> : (
                <ul className="mt-2 space-y-2">
                  {exercises.map(ex => (
                    <li key={ex._id} className="rounded border p-2">
                      <strong>{ex.name}</strong>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{ex.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
