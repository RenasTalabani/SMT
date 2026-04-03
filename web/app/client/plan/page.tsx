"use client";

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getWorkouts, requestPlan } from '@/store/workoutsSlice';
import * as workoutService from '@/services/workoutService';

const PLAN_TYPES = [
  { id: 'HIIT', label: 'HIIT', icon: '⚡', desc: 'High-intensity interval training for max calorie burn', category: 'cardio' },
  { id: 'Strength Training', label: 'Strength', icon: '🏋️', desc: 'Build raw strength with heavy compound lifts', category: 'strength' },
  { id: 'Muscle Building', label: 'Muscle Building', icon: '💪', desc: 'Hypertrophy-focused plan for muscle mass gains', category: 'muscle_gain' },
  { id: 'Cutting', label: 'Cutting', icon: '🔥', desc: 'Lean out and preserve muscle while losing fat', category: 'weight_loss' },
  { id: 'Bulking', label: 'Bulking', icon: '📈', desc: 'Caloric surplus training to pack on size', category: 'muscle_gain' },
  { id: 'Endurance', label: 'Endurance', icon: '🏃', desc: 'Build cardiovascular stamina and endurance', category: 'endurance' },
  { id: 'Flexibility', label: 'Flexibility', icon: '🧘', desc: 'Improve mobility, posture and recovery', category: 'flexibility' },
  { id: 'General Fitness', label: 'General Fitness', icon: '🌟', desc: 'Balanced program for overall health and fitness', category: 'mixed' },
];

interface Coach {
  _id: string;
  name: string;
  avatar?: string;
  specialization?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
}

export default function ClientPlan() {
  const dispatch = useAppDispatch();
  const { plans, loading, error, requestLoading, requestSent, requestError } = useAppSelector(state => state.workouts);

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachesLoading, setCoachesLoading] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedPlanType, setSelectedPlanType] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'coach' | 'plan' | 'confirm'>('coach');

  useEffect(() => {
    dispatch(getWorkouts({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    setCoachesLoading(true);
    workoutService.getCoaches()
      .then(data => setCoaches(data))
      .catch(() => setCoaches([]))
      .finally(() => setCoachesLoading(false));
  }, []);

  const handleSubmit = () => {
    if (!selectedCoach || !selectedPlanType) return;
    dispatch(requestPlan({ coachId: selectedCoach, planType: selectedPlanType, notes }));
  };

  const selectedCoachObj = coaches.find(c => c._id === selectedCoach);

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <AppShell>
        <div>
          <h1 className="text-2xl font-bold">My Plan</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">See your assigned workout plan and completion progress.</p>

          {loading && <p className="mt-4 text-blue-600">Loading assigned workouts...</p>}
          {error && <p className="mt-4 text-red-500">{error}</p>}

          {/* Assigned Plans */}
          {plans.length > 0 && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <ul className="space-y-3">
                {plans.map(plan => (
                  <li key={plan._id} className="rounded border border-slate-200 p-3 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{plan.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
                      </div>
                      {plan.status && (
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          plan.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {plan.status}
                        </span>
                      )}
                    </div>
                    {plan.category && (
                      <p className="mt-1 text-xs text-slate-500 capitalize dark:text-slate-400">
                        Category: {plan.category.replace('_', ' ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Request Plan Section */}
          {!loading && (
            <div className="mt-6">
              {requestSent ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-950">
                  <div className="mb-3 text-5xl">✅</div>
                  <h2 className="text-xl font-bold text-green-700 dark:text-green-300">Request Sent!</h2>
                  <p className="mt-2 text-green-600 dark:text-green-400">
                    Your plan request has been sent to <span className="font-semibold">{selectedCoachObj?.name}</span>.
                    They will create and assign your <span className="font-semibold">{selectedPlanType}</span> plan shortly.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                  {/* Header */}
                  <div className="border-b border-slate-200 p-5 dark:border-slate-700">
                    <h2 className="text-lg font-bold">
                      {plans.length === 0 ? 'Request a Plan' : 'Request Another Plan'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Choose a coach and plan type to get a personalised workout plan.
                    </p>

                    {/* Steps */}
                    <div className="mt-4 flex items-center gap-2">
                      {(['coach', 'plan', 'confirm'] as const).map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (s === 'plan' && !selectedCoach) return;
                              if (s === 'confirm' && (!selectedCoach || !selectedPlanType)) return;
                              setStep(s);
                            }}
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition ${
                              step === s
                                ? 'bg-blue-600 text-white'
                                : (s === 'plan' && selectedCoach) || (s === 'confirm' && selectedCoach && selectedPlanType)
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                            }`}
                          >
                            {i + 1}
                          </button>
                          <span className={`text-sm font-medium ${step === s ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                            {s === 'coach' ? 'Choose Coach' : s === 'plan' ? 'Plan Type' : 'Confirm'}
                          </span>
                          {i < 2 && <span className="text-slate-300 dark:text-slate-600">→</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Step 1: Choose Coach */}
                    {step === 'coach' && (
                      <div>
                        <h3 className="mb-3 font-semibold">Select a Coach</h3>
                        {coachesLoading && <p className="text-slate-500">Loading coaches...</p>}
                        {!coachesLoading && coaches.length === 0 && (
                          <p className="text-slate-500">No coaches available at the moment.</p>
                        )}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {coaches.map(coach => (
                            <button
                              key={coach._id}
                              onClick={() => setSelectedCoach(coach._id)}
                              className={`rounded-lg border-2 p-4 text-left transition hover:shadow-md ${
                                selectedCoach === coach._id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                  : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {coach.avatar ? (
                                  <img src={coach.avatar} alt={coach.name} className="h-12 w-12 rounded-full object-cover" />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600 dark:bg-blue-900">
                                    {coach.name[0]}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{coach.name}</p>
                                  {coach.specialization && (
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{coach.specialization}</p>
                                  )}
                                  {coach.rating != null && coach.rating > 0 && (
                                    <p className="text-xs text-yellow-500">{'★'.repeat(Math.round(coach.rating))} ({coach.reviewCount ?? 0})</p>
                                  )}
                                </div>
                              </div>
                              {coach.bio && (
                                <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{coach.bio}</p>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            disabled={!selectedCoach}
                            onClick={() => setStep('plan')}
                            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Next: Choose Plan Type →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Choose Plan Type */}
                    {step === 'plan' && (
                      <div>
                        <h3 className="mb-3 font-semibold">Select Plan Type</h3>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                          {PLAN_TYPES.map(pt => (
                            <button
                              key={pt.id}
                              onClick={() => setSelectedPlanType(pt.id)}
                              className={`rounded-lg border-2 p-4 text-left transition hover:shadow-md ${
                                selectedPlanType === pt.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                  : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800'
                              }`}
                            >
                              <div className="mb-2 text-3xl">{pt.icon}</div>
                              <p className="font-semibold">{pt.label}</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pt.desc}</p>
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-between">
                          <button
                            onClick={() => setStep('coach')}
                            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                          >
                            ← Back
                          </button>
                          <button
                            disabled={!selectedPlanType}
                            onClick={() => setStep('confirm')}
                            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Next: Confirm →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Confirm */}
                    {step === 'confirm' && (
                      <div>
                        <h3 className="mb-4 font-semibold">Review & Send Request</h3>

                        <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Coach</span>
                            <span className="font-semibold">{selectedCoachObj?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Plan Type</span>
                            <span className="font-semibold">
                              {PLAN_TYPES.find(p => p.id === selectedPlanType)?.icon}{' '}
                              {selectedPlanType}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Additional Notes <span className="text-slate-400">(optional)</span>
                          </label>
                          <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. I have a bad knee, prefer 4 days/week, goal is to lose 10kg..."
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          />
                        </div>

                        {requestError && <p className="mt-2 text-sm text-red-500">{requestError}</p>}

                        <div className="mt-4 flex justify-between">
                          <button
                            onClick={() => setStep('plan')}
                            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                          >
                            ← Back
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={requestLoading}
                            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {requestLoading ? 'Sending...' : 'Send Request'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
