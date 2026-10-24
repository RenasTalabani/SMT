"use client";

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { useAppSelector } from '@/store/hooks';
import {
  ChatMsg, aiAnalyze, aiChat, aiClear, aiHistory, aiNutrition, aiWorkout, errorMessage,
} from '@/services/gymApi';

type Tab = 'chat' | 'workout' | 'nutrition' | 'progress';
const GOALS = ['muscle gain', 'fat loss', 'strength', 'endurance', 'general fitness'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const NGOALS = ['weight loss', 'muscle gain', 'maintenance'] as const;
const ACTS = ['sedentary', 'light', 'moderate', 'active', 'very active'] as const;

const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800';

function ChatTab() {
  const { t } = useI18n();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { aiHistory().then(setMsgs).catch(() => {}); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const m = text.trim();
    if (!m || busy) return;
    setText('');
    setMsgs(prev => [...prev, { role: 'user', content: m }]);
    setBusy(true);
    try {
      const reply = await aiChat(m);
      setMsgs(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      toast.error(errorMessage(err, t('common.error')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.length === 0 && <p className="text-sm text-slate-500">{t('ai.ask')}</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div className="text-sm text-slate-400">…</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <input value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder={t('ai.ask')} className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
        <button disabled={busy || !text.trim()} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{t('ai.send')}</button>
        <button type="button" onClick={() => aiClear().then(() => setMsgs([]))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">{t('ai.clear')}</button>
      </form>
    </div>
  );
}

function WorkoutTab() {
  const { t } = useI18n();
  const [goal, setGoal] = useState<(typeof GOALS)[number]>('muscle gain');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('beginner');
  const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof aiWorkout>>['plan'] | null>(null);

  const go = async () => {
    setBusy(true);
    try {
      const r = await aiWorkout(goal, level, days);
      setPlan(r.plan);
      toast.success(t('ai.planSaved'));
    } catch (e) {
      toast.error(errorMessage(e, t('common.error')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-4">
        <label className="text-sm">{t('ai.goal')}
          <select value={goal} onChange={e => setGoal(e.target.value as (typeof GOALS)[number])} className={inputCls}>
            {GOALS.map(g => <option key={g} value={g}>{t(`ai.goal.${g}` as TranslationKey)}</option>)}
          </select>
        </label>
        <label className="text-sm">{t('ai.level')}
          <select value={level} onChange={e => setLevel(e.target.value as (typeof LEVELS)[number])} className={inputCls}>
            {LEVELS.map(l => <option key={l} value={l}>{t(`ai.level.${l}` as TranslationKey)}</option>)}
          </select>
        </label>
        <label className="text-sm">{t('ai.days')}
          <input type="number" min={1} max={7} value={days} onChange={e => setDays(Math.min(7, Math.max(1, Number(e.target.value))))} className={inputCls} />
        </label>
        <div className="flex items-end">
          <button onClick={go} disabled={busy} className="w-full rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? t('ai.generating') : t('ai.generate')}</button>
        </div>
      </div>
      {plan && (
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-bold">{plan.title}</h3>
            {plan.description && <p className="text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>}
            <Link href="/client/plan" className="text-sm font-medium text-orange-600 underline">{t('nav.myPlan')} →</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {plan.workouts.map(w => (
              <div key={w.day} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h4 className="font-semibold">{w.day}. {w.name}</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  {w.exercises.map((ex, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span>{ex.name || ex.notes}</span>
                      <span className="shrink-0 tabular-nums text-slate-500" dir="ltr">{ex.sets}×{ex.reps}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NutritionTab() {
  const { t } = useI18n();
  const user = useAppSelector(s => s.auth.user);
  const [form, setForm] = useState({
    weight: user?.weight || 75, height: user?.height || 175, age: 28,
    gender: (user?.gender === 'female' ? 'female' : 'male') as 'male' | 'female',
    goal: 'maintenance' as (typeof NGOALS)[number], activityLevel: 'moderate' as (typeof ACTS)[number],
  });
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Awaited<ReturnType<typeof aiNutrition>> | null>(null);

  const go = async () => {
    setBusy(true);
    try {
      setRes(await aiNutrition(form));
    } catch (e) {
      toast.error(errorMessage(e, t('common.error')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3 lg:grid-cols-6">
        <label className="text-sm">{t('ai.weight')}<input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} className={inputCls} /></label>
        <label className="text-sm">{t('ai.height')}<input type="number" value={form.height} onChange={e => setForm({ ...form, height: Number(e.target.value) })} className={inputCls} /></label>
        <label className="text-sm">{t('ai.age')}<input type="number" value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })} className={inputCls} /></label>
        <label className="text-sm">{t('ai.gender')}
          <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as 'male' | 'female' })} className={inputCls}>
            <option value="male">{t('ai.male')}</option><option value="female">{t('ai.female')}</option>
          </select>
        </label>
        <label className="text-sm">{t('ai.goal')}
          <select value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value as (typeof NGOALS)[number] })} className={inputCls}>
            {NGOALS.map(g => <option key={g} value={g}>{t(`ai.ngoal.${g}` as TranslationKey)}</option>)}
          </select>
        </label>
        <label className="text-sm">{t('ai.activity')}
          <select value={form.activityLevel} onChange={e => setForm({ ...form, activityLevel: e.target.value as (typeof ACTS)[number] })} className={inputCls}>
            {ACTS.map(a => <option key={a} value={a}>{t(`ai.act.${a}` as TranslationKey)}</option>)}
          </select>
        </label>
      </div>
      <button onClick={go} disabled={busy} className="rounded-lg bg-orange-600 px-6 py-2 font-semibold text-white disabled:opacity-50">{busy ? t('ai.generating') : t('ai.generate')}</button>
      {res && (
        <div className="space-y-3">
          {res.macros && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [t('ai.calories'), `${res.calories}`],
                [t('ai.protein'), `${res.macros.protein} g`],
                [t('ai.carbs'), `${res.macros.carbs} g`],
                [t('ai.fats'), `${res.macros.fats} g`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-orange-50 p-3 text-center dark:bg-orange-900/30">
                  <div className="text-xs text-slate-500">{k}</div>
                  <div className="text-xl font-bold tabular-nums">{v}</div>
                </div>
              ))}
            </div>
          )}
          <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 font-sans text-sm dark:border-slate-800 dark:bg-slate-900">{res.plan}</pre>
        </div>
      )}
    </div>
  );
}

function ProgressTab() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Awaited<ReturnType<typeof aiAnalyze>> | null>(null);
  const go = async () => {
    setBusy(true);
    try { setRes(await aiAnalyze()); } catch (e) { toast.error(errorMessage(e, t('common.error'))); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <button onClick={go} disabled={busy} className="rounded-lg bg-orange-600 px-6 py-2 font-semibold text-white disabled:opacity-50">{busy ? t('ai.generating') : t('ai.analyze')}</button>
      {res && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="whitespace-pre-wrap text-sm">{res.analysis}</p>
          <ul className="list-disc space-y-1 ps-5 text-sm">{res.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

export default function AiCoachPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('chat');
  const tabs: Tab[] = ['chat', 'workout', 'nutrition', 'progress'];
  return (
    <ProtectedRoute allowedRoles={['client', 'coach']}>
      <AppShell>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{t('ai.title')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('ai.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map(x => (
              <button key={x} onClick={() => setTab(x)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === x ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                {t(`ai.tab.${x}` as TranslationKey)}
              </button>
            ))}
          </div>
          {tab === 'chat' && <ChatTab />}
          {tab === 'workout' && <WorkoutTab />}
          {tab === 'nutrition' && <NutritionTab />}
          {tab === 'progress' && <ProgressTab />}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
