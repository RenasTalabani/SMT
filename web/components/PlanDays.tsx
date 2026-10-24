"use client";

// Expandable day-by-day view of a workout plan (loads the full plan on demand).

import { useState } from 'react';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';

interface PlanExercise {
  name?: string;
  exercise?: { name?: string } | string | null;
  sets: number;
  reps?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
}
interface PlanDay { day: number; name: string; estimatedDuration?: number; exercises: PlanExercise[]; warmUp?: string; coolDown?: string }

function exerciseName(e: PlanExercise, i: number) {
  if (e.exercise && typeof e.exercise === 'object' && e.exercise.name) return e.exercise.name;
  return e.name || e.notes || `Exercise ${i + 1}`;
}

export default function PlanDays({ planId }: { planId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<PlanDay[] | null>(null);
  const [error, setError] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !days) {
      try {
        const res = await api.get(`/workouts/${planId}`);
        const plan = res.data.data.workoutPlan ?? res.data.data.plan ?? res.data.data;
        setDays(plan.workouts ?? []);
      } catch {
        setError(true);
      }
    }
  };

  return (
    <div className="mt-2">
      <button onClick={toggle} className="text-sm font-medium text-orange-600 hover:underline">
        {open ? '▾' : '▸'} {t('nav.workouts')}
      </button>
      {open && (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {error && <p className="text-sm text-red-600">{t('common.error')}</p>}
          {!days && !error && <p className="text-sm text-slate-500">{t('common.loading')}</p>}
          {days?.map(d => (
            <div key={d.day} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <div className="mb-1 flex justify-between text-sm font-semibold">
                <span>{d.day}. {d.name}</span>
                {d.estimatedDuration ? <span className="text-xs text-slate-500">{d.estimatedDuration} {t('common.minutes')}</span> : null}
              </div>
              <ul className="space-y-0.5 text-sm">
                {d.exercises.map((e, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{exerciseName(e, i)}</span>
                    <span className="shrink-0 tabular-nums text-slate-500" dir="ltr">{e.sets}×{e.reps ?? (e.duration ? `${e.duration}s` : '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
