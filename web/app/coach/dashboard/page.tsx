import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CoachDashboard() {
  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <AppShell>
        <div>
          <h1 className="text-2xl font-bold">Coach Dashboard</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Manage clients, training plans, and exercise library.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {['Active Clients', 'Plans', 'Messages'].map(tile => (
              <div key={tile} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-semibold">{tile}</h3>
                <p className="text-3xl font-bold">0</p>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
