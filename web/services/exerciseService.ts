import api from './api';

export async function getExercises(page = 1, limit = 20) {
  const res = await api.get('/exercises', { params: { page, limit } });
  return res.data.data;
}

export async function createExercise(payload: Record<string, unknown>) {
  const res = await api.post('/exercises', payload);
  return res.data.data.exercise;
}
