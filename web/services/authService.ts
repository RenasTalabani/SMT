import api from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'coach' | 'client';
}

export async function login(payload: LoginPayload) {
  const res = await api.post('/auth/login', payload);
  return res.data.data;
}

export async function register(payload: RegisterPayload) {
  const res = await api.post('/auth/register', payload);
  return res.data.data;
}

export async function getProfile() {
  const res = await api.get('/auth/me');
  return res.data.data.user;
}
