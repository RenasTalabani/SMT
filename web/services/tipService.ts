import api from './api';

export interface TipFilters {
  category?: string;
  type?: string;
  difficulty?: string;
  author?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'likes' | 'views';
  page?: number;
  limit?: number;
}

export async function getTips(filters: TipFilters = {}) {
  const params = { ...filters };
  const res = await api.get('/tips', { params });
  return res.data.data;
}

export async function getTipById(tipId: string) {
  const res = await api.get(`/tips/${tipId}`);
  return res.data.data.tip;
}

export async function createTip(tipData: Record<string, unknown>) {
  const res = await api.post('/tips', tipData);
  return res.data.data.tip;
}

export async function updateTip(tipId: string, updates: Record<string, unknown>) {
  const res = await api.put(`/tips/${tipId}`, updates);
  return res.data.data.tip;
}

export async function deleteTip(tipId: string) {
  const res = await api.delete(`/tips/${tipId}`);
  return res.data;
}

export async function likeTip(tipId: string) {
  const res = await api.post(`/tips/${tipId}/like`);
  return res.data.data;
}

export async function bookmarkTip(tipId: string) {
  const res = await api.post(`/tips/${tipId}/bookmark`);
  return res.data.data;
}

export async function getTipComments(tipId: string) {
  const res = await api.get(`/tips/${tipId}/comments`);
  return res.data.data.comments;
}

export async function addTipComment(tipId: string, content: string) {
  const res = await api.post(`/tips/${tipId}/comments`, { content });
  return res.data.data.comment;
}

export async function getMyTips() {
  const res = await api.get('/tips/my-tips');
  return res.data.data.tips;
}

export async function getBookmarkedTips() {
  const res = await api.get('/tips/bookmarked');
  return res.data.data.tips;
}

export async function getTipCategories() {
  const res = await api.get('/tips/categories');
  return res.data.data.categories;
}

export async function uploadTipMedia(tipId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('media', file);
  });

  const res = await api.post(`/tips/${tipId}/media`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.data.media;
}

export async function publishTip(tipId: string, isPublished: boolean) {
  const res = await api.put(`/tips/${tipId}/publish`, { isPublished });
  return res.data;
}

export async function getAuthorTips(authorId: string) {
  const res = await api.get(`/tips/author/${authorId}`);
  return res.data.data.tips;
}