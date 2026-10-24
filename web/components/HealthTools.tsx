"use client";

// BMI, BMR/TDEE, protein and water calculators (ported from the old
// CityGym website's health-tools page). Pure client-side maths.

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';

const ACTIVITY = [
  { key: 'sedentary', mult: 1.2 },
  { key: 'light', mult: 1.375 },
  { key: 'moderate', mult: 1.55 },
  { key: 'active', mult: 1.725 },
  { key: 'very active', mult: 1.9 },
] as const;

export function bmi(weightKg: number, heightCm: number) {
  const m = heightCm / 100;
  return m > 0 ? weightKg / (m * m) : 0;
}

export function bmiCategory(value: number): TranslationKey {
  if (value < 18.5) return 'health.bmi.under';
  if (value < 25) return 'health.bmi.normal';
  if (value < 30) return 'health.bmi.over';
  return 'health.bmi.obese';
}

/** Mifflin–St Jeor */
export function bmr(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female') {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161);
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={Number.isFinite(value) ? value : ''}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
      />
    </label>
  );
}

function Result({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-orange-50 p-3 text-sm font-medium text-orange-900 dark:bg-orange-900/30 dark:text-orange-100">{children}</div>;
}

export default function HealthTools() {
  const { t } = useI18n();
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activity, setActivity] = useState<(typeof ACTIVITY)[number]['key']>('moderate');
  const [hours, setHours] = useState(1);

  const valid = weight > 0 && height > 0;
  const b = valid ? bmi(weight, height) : 0;
  const rest = valid && age > 0 ? Math.round(bmr(weight, height, age, gender)) : 0;
  const tdee = Math.round(rest * (ACTIVITY.find(a => a.key === activity)?.mult ?? 1.55));
  const proteinMin = Math.round(weight * 1.6);
  const proteinMax = Math.round(weight * 2.2);
  const water = valid ? Math.round((weight * 0.035 + (hours || 0) * 0.5) * 10) / 10 : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3 lg:grid-cols-6">
        <Num label={t('ai.weight')} value={weight} onChange={setWeight} step={0.5} />
        <Num label={t('ai.height')} value={height} onChange={setHeight} />
        <Num label={t('ai.age')} value={age} onChange={setAge} />
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-300">{t('ai.gender')}</span>
          <select value={gender} onChange={e => setGender(e.target.value as 'male' | 'female')} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
            <option value="male">{t('ai.male')}</option>
            <option value="female">{t('ai.female')}</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-300">{t('ai.activity')}</span>
          <select value={activity} onChange={e => setActivity(e.target.value as (typeof ACTIVITY)[number]['key'])} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
            {ACTIVITY.map(a => <option key={a.key} value={a.key}>{t(`ai.act.${a.key}` as TranslationKey)}</option>)}
          </select>
        </label>
        <Num label={t('health.trainingHours')} value={hours} onChange={setHours} step={0.5} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title={t('health.bmi')}>
          <Result>
            {valid ? <>{b.toFixed(1)} — {t(bmiCategory(b))}</> : '—'}
          </Result>
          <div className="flex h-2 overflow-hidden rounded-full">
            <div className="flex-[18.5] bg-sky-400" />
            <div className="flex-[6.5] bg-emerald-500" />
            <div className="flex-[5] bg-amber-400" />
            <div className="flex-[10] bg-red-500" />
          </div>
        </Card>
        <Card title={t('health.bmr')}>
          <Result>{rest ? t('health.bmrText', { bmr: rest, tdee }) : '—'}</Result>
        </Card>
        <Card title={t('health.protein')}>
          <Result>{valid ? t('health.proteinText', { min: proteinMin, max: proteinMax }) : '—'}</Result>
        </Card>
        <Card title={t('health.water')}>
          <Result>{valid ? t('health.waterText', { l: water }) : '—'}</Result>
        </Card>
      </div>
    </div>
  );
}
