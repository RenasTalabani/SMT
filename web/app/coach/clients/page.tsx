import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CoachClients() {
  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <AppShell>
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Track your clients and their progress in real time.</p>
          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p>Client table placeholder (API integration w/ /api/users/coach/clients)</p>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
