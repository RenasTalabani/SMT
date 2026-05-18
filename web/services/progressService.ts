import api from './api';

export async function getProgress(page = 1, limit = 20) {
  const res = await api.get('/progress', { params: { page, limit } });
  return res.data.data;
}

export async function addProgress(payload: Record<string, unknown>) {
  const res = await api.post('/progress', payload);
  return res.data.data.progress;
}
