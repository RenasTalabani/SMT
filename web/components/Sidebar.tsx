"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconType } from 'react-icons';
import {
  FiActivity, FiUsers, FiBookOpen, FiClipboard, FiMessageCircle, FiHome, FiBell, FiPlay, FiAward,
  FiCalendar, FiClock, FiCpu, FiHeart, FiUser, FiCheckSquare, FiTarget, FiSearch, FiShoppingBag, FiGrid,
} from 'react-icons/fi';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';

interface MenuItem {
  label: TranslationKey;
  href: string;
  icon: IconType;
}

interface SidebarProps {
  role: 'admin' | 'coach' | 'client' | null;
  open: boolean;
  onNavigate: () => void;
}

export const routesByRole: Record<string, MenuItem[]> = {
  admin: [
    { label: 'nav.dashboard', href: '/admin/dashboard', icon: FiHome },
    { label: 'nav.users', href: '/admin/users', icon: FiUsers },
    { label: 'nav.content', href: '/admin/content', icon: FiCheckSquare },
    { label: 'nav.shopAdmin', href: '/admin/shop', icon: FiShoppingBag },
    { label: 'nav.classes', href: '/coach/classes', icon: FiGrid },
    { label: 'nav.analytics', href: '/admin/analytics', icon: FiActivity },
    { label: 'nav.anatomy', href: '/client/anatomy', icon: FiTarget },
  ],
  coach: [
    { label: 'nav.dashboard', href: '/coach/dashboard', icon: FiHome },
    { label: 'nav.bookings', href: '/coach/bookings', icon: FiCalendar },
    { label: 'nav.schedule', href: '/coach/schedule', icon: FiClock },
    { label: 'nav.classes', href: '/coach/classes', icon: FiGrid },
    { label: 'nav.clients', href: '/coach/clients', icon: FiUsers },
    { label: 'nav.workouts', href: '/coach/workouts', icon: FiClipboard },
    { label: 'nav.exercises', href: '/coach/exercises', icon: FiBookOpen },
    { label: 'nav.anatomy', href: '/client/anatomy', icon: FiTarget },
    { label: 'nav.chat', href: '/client/chat', icon: FiMessageCircle },
    { label: 'nav.profile', href: '/client/profile', icon: FiUser },
  ],
  client: [
    { label: 'nav.dashboard', href: '/client/dashboard', icon: FiHome },
    { label: 'nav.myPlan', href: '/client/plan', icon: FiClipboard },
    { label: 'nav.anatomy', href: '/client/anatomy', icon: FiTarget },
    { label: 'nav.aiCoach', href: '/client/ai', icon: FiCpu },
    { label: 'nav.coaches', href: '/client/coaches', icon: FiSearch },
    { label: 'nav.bookings', href: '/client/bookings', icon: FiCalendar },
    { label: 'nav.classes', href: '/client/classes', icon: FiGrid },
    { label: 'nav.shop', href: '/client/shop', icon: FiShoppingBag },
    { label: 'nav.progress', href: '/client/progress', icon: FiActivity },
    { label: 'nav.health', href: '/client/health', icon: FiHeart },
    { label: 'nav.courses', href: '/client/courses', icon: FiPlay },
    { label: 'nav.tips', href: '/client/tips', icon: FiAward },
    { label: 'nav.chat', href: '/client/chat', icon: FiMessageCircle },
    { label: 'nav.notifications', href: '/client/notifications', icon: FiBell },
    { label: 'nav.profile', href: '/client/profile', icon: FiUser },
  ],
};

export default function Sidebar({ role, open, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const items = role ? routesByRole[role] || [] : [];

  return (
    <aside
      className={`fixed inset-y-0 start-0 z-40 w-72 transform overflow-y-auto border-e border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
        open ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
      }`}
    >
      <Link href="/" className="mb-6 flex items-center gap-3" onClick={onNavigate}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-lg font-black text-white">CG</span>
        <span>
          <span className="block text-lg font-bold text-slate-900 dark:text-slate-50">{t('brand.name')}</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            {role ? t(`role.${role}` as TranslationKey) : t('brand.tagline')}
          </span>
        </span>
      </Link>
      <nav className="space-y-1">
        {items.map(item => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(item.label)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
