"use client";

import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import FileUpload from '@/components/FileUpload';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/store/authSlice';
import { changePassword, errorMessage, updateMe } from '@/services/gymApi';

const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800';
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export default function ProfilePage() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    height: user?.height ?? '',
    weight: user?.weight ?? '',
    experienceLevel: user?.experienceLevel ?? 'beginner',
    bio: user?.bio ?? '',
    specialization: Array.isArray(user?.specialization) ? user?.specialization.join(', ') : (user?.specialization ?? ''),
  });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const isCoach = user.role === 'coach';

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone || undefined,
        height: form.height === '' ? undefined : Number(form.height),
        weight: form.weight === '' ? undefined : Number(form.weight),
        experienceLevel: form.experienceLevel,
        bio: form.bio,
      };
      if (isCoach) payload.specialization = String(form.specialization).split(',').map(s => s.trim()).filter(Boolean);
      const updated = await updateMe(user._id, payload);
      dispatch(updateUser(updated ?? payload));
      toast.success(t('common.saved'));
    } catch (err) {
      toast.error(errorMessage(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  const savePw = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: '', next: '' });
      toast.success(t('profile.passwordChanged'));
    } catch (err) {
      toast.error(errorMessage(err, t('common.error')));
    }
  };

  return (
    <ProtectedRoute allowedRoles={['client', 'coach', 'admin']}>
      <AppShell>
        <div className="max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold">{t('profile.title')}</h1>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-2xl font-bold dark:bg-slate-700">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-semibold">{user.name}</div>
              <div className="text-sm text-slate-500">{user.email} · {t(`role.${user.role}` as TranslationKey)}</div>
              <FileUpload
                onUpload={url => dispatch(updateUser({ avatar: url }))}
                label={t('profile.avatar')}
                endpoint={`/users/${user._id}/avatar`}
                fieldName="avatar"
                className="mt-2"
              />
            </div>
          </div>

          <form onSubmit={save} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
            <label className="text-sm">{t('auth.name')}<input required minLength={2} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} /></label>
            <label className="text-sm">{t('profile.phone')}<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} dir="ltr" /></label>
            <label className="text-sm">{t('profile.height')}<input type="number" min={50} max={300} value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} className={inputCls} /></label>
            <label className="text-sm">{t('profile.weight')}<input type="number" min={20} max={500} step={0.1} value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className={inputCls} /></label>
            <label className="text-sm">{t('profile.level')}
              <select value={form.experienceLevel} onChange={e => setForm({ ...form, experienceLevel: e.target.value })} className={inputCls}>
                {LEVELS.map(l => <option key={l} value={l}>{t(`ai.level.${l}` as TranslationKey)}</option>)}
              </select>
            </label>
            {isCoach && (
              <label className="text-sm">{t('profile.specialization')}<input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} className={inputCls} placeholder="Strength, Nutrition" /></label>
            )}
            <label className="text-sm sm:col-span-2">{t('profile.bio')}<textarea rows={3} maxLength={500} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className={inputCls} /></label>
            <div className="sm:col-span-2">
              <button disabled={saving} className="rounded-lg bg-orange-600 px-6 py-2 font-semibold text-white disabled:opacity-50">{saving ? t('common.loading') : t('common.save')}</button>
            </div>
          </form>

          <form onSubmit={savePw} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
            <h2 className="font-semibold sm:col-span-3">{t('profile.changePassword')}</h2>
            <label className="text-sm">{t('profile.currentPassword')}<input type="password" required value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} className={inputCls} /></label>
            <label className="text-sm">{t('profile.newPassword')}<input type="password" required minLength={8} value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} className={inputCls} /></label>
            <div className="flex items-end"><button className="w-full rounded-lg border border-orange-500 px-4 py-2 font-semibold text-orange-600">{t('common.save')}</button></div>
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
