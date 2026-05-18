"use client";

import { useEffect } from 'react';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers, approveCoach } from '@/store/usersSlice';

export default function AdminUsers() {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector(state => state.users);

  useEffect(() => {
    dispatch(fetchUsers({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleApprove = async (id: string) => {
    try {
      await dispatch(approveCoach(id)).unwrap();
      window.alert('Coach approved successfully');
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Failed to approve coach');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">View, approve, and manage users.</p>

          {loading && <p className="mt-4 text-blue-600">Loading users...</p>}
          {error && <p className="mt-4 text-red-500">{error}</p>}

          <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Approved</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !loading ? (
                  <tr><td colSpan={5} className="py-3">No users found</td></tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2">{user.name}</td>
                      <td className="px-3 py-2">{user.email}</td>
                      <td className="px-3 py-2">{user.role}</td>
                      <td className="px-3 py-2">{user.isApproved ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2">
                        {user.role === 'coach' && !user.isApproved && (
                          <button onClick={() => handleApprove(user._id)} className="rounded bg-emerald-500 px-2 py-1 text-white hover:bg-emerald-600">
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
