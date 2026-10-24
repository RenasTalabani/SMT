"use client";

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useI18n } from '@/lib/i18n';
import { ContentItem, adminContent, adminDeleteContent, adminPublish, errorMessage } from '@/services/gymApi';

export default function AdminContentPage() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'course' | 'tip'>('all');
  const [error, setError] = useState<string | null>(null);

  const load = () => adminContent().then(setItems).catch(e => setError(errorMessage(e, t('common.error'))));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (c: ContentItem) => {
    try {
      await adminPublish(c.type, c._id, !c.isPublished);
      toast.success(t('common.saved'));
      load();
    } catch (e) {
      toast.error(errorMessage(e, t('common.error')));
    }
  };

  const remove = async (c: ContentItem) => {
    if (!window.confirm(`${t('admin.delete')}: ${c.title}?`)) return;
    try {
      await adminDeleteContent(c.type, c._id);
      load();
    } catch (e) {
      toast.error(errorMessage(e, t('common.error')));
    }
  };

  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';
  const shown = (items ?? []).filter(i => filter === 'all' || i.type === filter);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">{t('admin.contentTitle')}</h1>
            <div className="flex gap-1">
              {(['all', 'course', 'tip'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-sm ${filter === f ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {f === 'all' ? t('common.all') : f === 'course' ? t('admin.courses') : t('admin.tips')}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-600">{error}</p>}
          {!items && !error && <p className="text-slate-500">{t('common.loading')}</p>}
          {items && shown.length === 0 && <p className="text-slate-500">{t('common.empty')}</p>}
          <ul className="space-y-2">
            {shown.map(c => (
              <li key={`${c.type}-${c._id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="min-w-0">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-slate-500">
                    {c.type === 'course' ? t('admin.courses') : t('admin.tips')} · {(c.instructor ?? c.author)?.name ?? '—'} · {new Date(c.createdAt).toLocaleDateString(locale)} ·{' '}
                    <span className={c.isPublished ? 'text-emerald-600' : 'text-amber-600'}>{c.isPublished ? t('admin.published') : t('admin.draft')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggle(c)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${c.isPublished ? 'border border-slate-300 dark:border-slate-700' : 'bg-emerald-600 text-white'}`}>
                    {c.isPublished ? t('admin.unpublish') : t('admin.publish')}
                  </button>
                  <button onClick={() => remove(c)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 dark:border-red-800">{t('admin.delete')}</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
