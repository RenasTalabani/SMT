import api from './api';

export interface UserFilterOptions {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  isApproved?: boolean;
}

export async function getAllUsers(options: UserFilterOptions = {}) {
  const params: Record<string, unknown> = {};
  if (options.page) params.page = options.page;
  if (options.limit) params.limit = options.limit;
  if (options.role) params.role = options.role;
  if (options.isActive !== undefined) params.isActive = options.isActive;
  if (options.isApproved !== undefined) params.isApproved = options.isApproved;

  const res = await api.get('/users', { params });
  return res.data.data;
}

export async function approveCoach(userId: string) {
  const res = await api.put(`/users/${userId}`, { isApproved: true });
  return res.data.data.user;
}
