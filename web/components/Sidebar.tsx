import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconType } from 'react-icons';
import { FiActivity, FiUsers, FiBookOpen, FiClipboard, FiMessageCircle, FiHome, FiBell, FiPlay, FiAward } from 'react-icons/fi';

interface MenuItem {
  label: string;
  href: string;
  icon: IconType;
}

interface SidebarProps {
  role: 'admin' | 'coach' | 'client' | null;
  onToggleDarkMode: () => void;
  darkMode: boolean;
}

const routesByRole: Record<string, MenuItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: FiHome },
    { label: 'Users Management', href: '/admin/users', icon: FiUsers },
    { label: 'Analytics', href: '/admin/analytics', icon: FiActivity }
  ],
  coach: [
    { label: 'Dashboard', href: '/coach/dashboard', icon: FiHome },
    { label: 'Workout Plans', href: '/coach/workouts', icon: FiClipboard },
    { label: 'Exercises', href: '/coach/exercises', icon: FiBookOpen },
    { label: 'Clients', href: '/coach/clients', icon: FiUsers }
  ],
  client: [
    { label: 'Dashboard', href: '/client/dashboard', icon: FiHome },
    { label: 'My Plan', href: '/client/plan', icon: FiClipboard },
    { label: 'Progress', href: '/client/progress', icon: FiActivity },
    { label: 'Courses', href: '/client/courses', icon: FiPlay },
    { label: 'Tips', href: '/client/tips', icon: FiAward },
    { label: 'Chat', href: '/client/chat', icon: FiMessageCircle },
    { label: 'Notifications', href: '/client/notifications', icon: FiBell }
  ]
};

export default function Sidebar({ role, onToggleDarkMode, darkMode }: SidebarProps) {
  const pathname = usePathname();

  const items = role ? routesByRole[role] || [] : [];

  return (
    <aside className="h-full w-72 min-w-[280px] border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Ultimate Gym</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{role?.toUpperCase() || 'Guest'}</p>
      </div>
      <nav className="space-y-2">
        {items.map(item => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-2 rounded-lg px-3 py-2 transition ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'}`}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={onToggleDarkMode}
        className="mt-6 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {darkMode ? 'Disable Dark Mode' : 'Enable Dark Mode'}
      </button>
    </aside>
  );
}
