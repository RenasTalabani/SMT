"use client";

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { localized, useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { BodyPart, errorMessage, listBodyParts } from '@/services/gymApi';

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), { ssr: false });

const TYPES = ['all', 'muscle', 'joint', 'artery', 'nerve'] as const;
const REGIONS = ['all', 'upper_body', 'core', 'lower_body', 'head_neck'] as const;
const MODELS = [
  { key: 'muscular', src: '/models/male-muscular.glb', label: 'anatomy.model.muscular' },
  { key: 'ecorche', src: '/models/ecorche.glb', label: 'anatomy.model.ecorche' },
] as const;

const TYPE_COLOR: Record<string, string> = {
  muscle: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
  joint: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  artery: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  nerve: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  organ: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200',
};

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
      <ul className="list-disc space-y-0.5 ps-5 text-sm text-slate-600 dark:text-slate-300">
        {items.map(i => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}

function Fact({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-700 dark:text-slate-200">{value}</dd>
    </div>
  );
}

export default function AnatomyPage() {
  const { t, lang } = useI18n();
  const [parts, setParts] = useState<BodyPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<(typeof TYPES)[number]>('all');
  const [region, setRegion] = useState<(typeof REGIONS)[number]>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<BodyPart | null>(null);
  const [model, setModel] = useState<(typeof MODELS)[number]['key']>('muscular');

  const fetchParts = () =>
    listBodyParts()
      .then(p => { setParts(p); setError(null); })
      .catch(e => setError(errorMessage(e, t('common.error'))))
      .finally(() => setLoading(false));

  const load = () => {
    setLoading(true);
    setError(null);
    fetchParts();
  };

  useEffect(() => { fetchParts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parts.filter(p =>
      (type === 'all' || p.type === type) &&
      (region === 'all' || p.region === region) &&
      (!q || [p.name, p.nameAr, p.nameKu, p.description].some(v => v?.toLowerCase().includes(q))),
    );
  }, [parts, type, region, query]);

  const modelSrc = MODELS.find(m => m.key === model)!.src;

  return (
    <ProtectedRoute allowedRoles={['client', 'coach', 'admin']}>
      <AppShell>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{t('anatomy.title')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('anatomy.subtitle')}</p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-900 to-slate-800 p-3 text-white dark:border-slate-800">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1 rounded-full bg-white/10 p-1 text-xs">
                  {MODELS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setModel(m.key)}
                      className={`rounded-full px-3 py-1 ${model === m.key ? 'bg-orange-500 text-white' : 'text-slate-200 hover:bg-white/10'}`}
                    >
                      {t(m.label)}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-300">{t('anatomy.arHint')}</span>
              </div>
              <div className="relative h-[420px] sm:h-[520px]">
                <ModelViewer
                  key={modelSrc}
                  src={modelSrc}
                  alt={t('anatomy.title')}
                  arLabel={t('anatomy.ar')}
                  loadingLabel={t('anatomy.loadingModel')}
                />
                {selected && (
                  <div className="pointer-events-none absolute end-3 top-3 max-w-[60%] rounded-xl bg-black/60 px-3 py-2 text-sm backdrop-blur">
                    <div className="font-semibold">{localized(selected, 'name', lang)}</div>
                    {selected.relatedExercises?.length ? (
                      <div className="text-xs text-slate-200">{selected.relatedExercises.slice(0, 3).join(' · ')}</div>
                    ) : null}
                  </div>
                )}
              </div>
            </section>

            <section className="flex min-h-[420px] flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('common.search')}
                  className="min-w-[160px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value as (typeof REGIONS)[number])}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  {REGIONS.map(r => (
                    <option key={r} value={r}>{r === 'all' ? t('common.all') : t(`anatomy.region.${r}` as TranslationKey)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-1">
                {TYPES.map(ty => (
                  <button
                    key={ty}
                    onClick={() => setType(ty)}
                    className={`rounded-full px-3 py-1 text-sm ${type === ty ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}
                  >
                    {ty === 'all' ? t('common.all') : t(`anatomy.type.${ty}` as TranslationKey)}
                  </button>
                ))}
              </div>

              {loading && <p className="text-sm text-slate-500">{t('common.loading')}</p>}
              {error && (
                <p className="text-sm text-red-600">
                  {error} <button className="underline" onClick={load}>{t('common.retry')}</button>
                </p>
              )}

              <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <ul className="max-h-[440px] space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                  {!loading && filtered.length === 0 && (
                    <li className="p-3 text-sm text-slate-500">{t('common.empty')}</li>
                  )}
                  {filtered.map(p => (
                    <li key={p._id}>
                      <button
                        onClick={() => setSelected(p)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm ${selected?._id === p._id ? 'bg-orange-50 ring-1 ring-orange-300 dark:bg-orange-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <span className="font-medium">{localized(p, 'name', lang)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${TYPE_COLOR[p.type] ?? ''}`}>
                          {t(`anatomy.type.${p.type}` as TranslationKey)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <article className="max-h-[440px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  {!selected ? (
                    <p className="text-sm text-slate-500">{t('anatomy.pick')}</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-xl font-bold">{localized(selected, 'name', lang)}</h2>
                        {lang !== 'en' && <p className="text-xs text-slate-500">{selected.name}</p>}
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selected.description}</p>
                      </div>
                      <dl className="grid gap-2 sm:grid-cols-2">
                        <Fact label={t('anatomy.function')} value={selected.function} />
                        <Fact label={t('anatomy.innervation')} value={selected.innervation} />
                        <Fact label={t('anatomy.origin')} value={selected.origin} />
                        <Fact label={t('anatomy.insertion')} value={selected.insertion} />
                      </dl>
                      <Section title={t('anatomy.exercises')} items={selected.relatedExercises} />
                      <Section title={t('anatomy.synergists')} items={selected.synergistMuscles} />
                      <Section title={t('anatomy.antagonists')} items={selected.antagonistMuscles} />
                      <Section title={t('anatomy.warmup')} items={selected.warmUpTips} />
                      <Section title={t('anatomy.injuries')} items={selected.injuryRisks} />
                      <Section title={t('anatomy.recovery')} items={selected.recoveryTips} />
                      {selected.videoUrl && (
                        <a href={selected.videoUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-orange-600 underline">
                          ▶ Video
                        </a>
                      )}
                    </div>
                  )}
                </article>
              </div>
            </section>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
