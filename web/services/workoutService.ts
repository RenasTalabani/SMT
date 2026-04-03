import api from './api';

export interface WorkoutQueryOptions {
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: string;
  search?: string;
  isTemplate?: boolean;
}

export async function getWorkouts(options: WorkoutQueryOptions = {}) {
  const params: any = { ...options };
  const res = await api.get('/workouts', { params });
  return res.data.data;
}

export async function createWorkout(payload: any) {
  const res = await api.post('/workouts', payload);
  return res.data.data.workoutPlan;
}

export async function assignWorkout(workoutId: string, clientId: string) {
  const res = await api.post(`/workouts/${workoutId}/assign`, { clientId });
  return res.data.data.workoutPlan;
}

export async function requestPlan(payload: { coachId: string; planType: string; notes?: string }) {
  const res = await api.post('/workouts/request', payload);
  return res.data;
}

export async function getCoaches() {
  const res = await api.get('/users/coaches');
  return res.data.data.coaches;
}
