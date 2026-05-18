"use client";

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProgress, addProgress } from '@/store/progressSlice';
import FileUpload from '@/components/FileUpload';

export default function ClientProgress() {
  const dispatch = useAppDispatch();
  const { entries, loading, error } = useAppSelector(state => state.progress);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [progressId] = useState('');

  useEffect(() => {
    dispatch(fetchProgress({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleAdd = async () => {
    try {
      await dispatch(addProgress({ notes, date: new Date().toISOString(), type: 'workout' })).unwrap();
      setNotes('');
      window.alert('Progress logged');
    } catch (err: unknown) {
      window.alert(typeof err === 'string' ? err : 'Failed to log progress');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <AppShell>
        <div>
          <h1 className="text-2xl font-bold">Progress</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Track your workouts, body stats, and improvement over time.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold">Log new progress</h3>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-2 w-full rounded border p-2" placeholder="Enter your notes" />
              <div className="mt-2">
                <FileUpload
                  onUpload={(url) => setPhotoUrl(url)}
                  label="Add Progress Photo"
                  endpoint={`/progress/${progressId}/photos`}
                  fieldName="photos"
                />
                {photoUrl && <img src={photoUrl} alt="Progress" className="mt-2 w-32 h-32 object-cover rounded" />}
              </div>
              <button onClick={handleAdd} className="mt-2 rounded bg-emerald-500 px-3 py-2 text-white">Save</button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold">Progress entries</h3>
              {loading && <p className="text-blue-600">Loading...</p>}
              {error && <p className="text-red-500">{error}</p>}
              {entries.length === 0 && !loading ? <p>No progress recorded yet.</p> : (
                <ul className="space-y-2 mt-2">
                  {entries.map(entry => (
                    <li key={entry._id} className="rounded border p-2">
                      <p className="text-sm text-slate-500">{new Date(entry.date).toLocaleString()}</p>
                      <p>{entry.notes}</p>
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
