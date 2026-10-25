// Typed API calls for the features added in the overnight build:
// anatomy, coaches & bookings, coach schedule, AI coach, progress, admin.

import api from './api';

// ── Types ────────────────────────────────────────────────────────────────────
export interface BodyPart {
  _id: string;
  partId: string;
  name: string;
  nameAr?: string;
  nameKu?: string;
  type: 'muscle' | 'joint' | 'artery' | 'nerve' | 'organ';
  region?: string;
  description?: string;
  function?: string;
  origin?: string;
  insertion?: string;
  innervation?: string;
  relatedExercises?: string[];
  antagonistMuscles?: string[];
  synergistMuscles?: string[];
  injuryRisks?: string[];
  recoveryTips?: string[];
  warmUpTips?: string[];
  videoUrl?: string;
  [key: string]: unknown;
}

export interface Coach {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  specialization?: string[] | string;
  experience?: number;
  rating?: number;
}

export interface Slot { startTime: string; endTime: string }
export interface DaySlots { date: string; slots: Slot[] }

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export interface Booking {
  _id: string;
  coach?: { _id: string; name: string; avatar?: string } | string;
  client?: { _id: string; name: string; avatar?: string } | string;
  slot: { date: string; startTime: string; endTime: string; durationMin?: number };
  type: string;
  status: BookingStatus;
  price?: number;
  notes?: string;
  rating?: { score?: number; review?: string };
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export const WEEKDAYS: Weekday[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
export interface Availability {
  weeklySchedule: Record<Weekday, { enabled: boolean; slots: Slot[] }>;
  sessionDurationMin: number;
  bufferMin: number;
  sessionPrice: number;
  currency?: string;
}

export interface ProgressStats {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  workoutStreak: number;
  weightChange: number;
  averageMood?: number;
  averageEnergy?: number;
}

// ── Anatomy ──────────────────────────────────────────────────────────────────
export async function listBodyParts(): Promise<BodyPart[]> {
  const res = await api.get('/anatomy', { params: { limit: 200 } });
  return res.data.data.items ?? [];
}

// ── Coaches & bookings ───────────────────────────────────────────────────────
export async function listCoaches(): Promise<Coach[]> {
  const res = await api.get('/users/coaches');
  return res.data.data.coaches ?? [];
}

export async function getSlots(coachId: string, days = 14): Promise<DaySlots[]> {
  const from = new Date(Date.now() + 60_000);
  const to = new Date(Date.now() + days * 86_400_000);
  const res = await api.get('/bookings/slots', {
    params: { coachId, from: from.toISOString(), to: to.toISOString() },
  });
  return res.data.data.slots ?? [];
}

export async function createBooking(payload: {
  coachId: string; date: string; startTime: string; endTime: string; type: string; notes?: string;
}): Promise<Booking> {
  const res = await api.post('/bookings', payload);
  return res.data.data.booking;
}

export async function myBookings(): Promise<Booking[]> {
  const res = await api.get('/bookings/my', { params: { limit: 50 } });
  return res.data.data.items ?? [];
}

export async function coachBookings(status?: string): Promise<Booking[]> {
  const res = await api.get('/bookings/coach', { params: { limit: 50, ...(status ? { status } : {}) } });
  return res.data.data.items ?? [];
}

export async function setBookingStatus(id: string, status: BookingStatus, cancelReason?: string): Promise<Booking> {
  const res = await api.put(`/bookings/${id}/status`, { status, ...(cancelReason ? { cancelReason } : {}) });
  return res.data.data.booking;
}

export async function rateBooking(id: string, score: number, review?: string): Promise<Booking> {
  const res = await api.post(`/bookings/${id}/rate`, { score, review });
  return res.data.data.booking;
}

export async function getMyAvailability(): Promise<Availability | null> {
  const res = await api.get('/bookings/availability/me');
  return res.data.data.availability;
}

export async function saveAvailability(a: Availability): Promise<Availability> {
  const res = await api.put('/bookings/availability', {
    weeklySchedule: a.weeklySchedule,
    sessionDurationMin: a.sessionDurationMin,
    bufferMin: a.bufferMin,
    sessionPrice: a.sessionPrice,
  });
  return res.data.data.availability;
}

// ── AI coach ─────────────────────────────────────────────────────────────────
export interface ChatMsg { role: 'user' | 'assistant'; content: string }

export async function aiHistory(): Promise<ChatMsg[]> {
  const res = await api.get('/ai/chat/history');
  return (res.data.data.messages ?? []).map((m: { role: string; content: string }) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));
}

export async function aiChat(message: string): Promise<string> {
  const res = await api.post('/ai/chat', { message });
  return res.data.data.reply;
}

export async function aiClear(): Promise<void> {
  await api.delete('/ai/chat/history');
}

export async function aiWorkout(goal: string, level: string, daysPerWeek: number) {
  const res = await api.post('/ai/generate-workout', { goal, level, daysPerWeek });
  return res.data.data as {
    plan: { _id: string; title: string; description?: string; workouts: { day: number; name: string; exercises: { name?: string; sets: number; reps: number; restTime?: number; notes?: string }[] }[] };
  };
}

export async function aiNutrition(input: { weight: number; height: number; age?: number; gender: string; goal: string; activityLevel: string }) {
  const res = await api.post('/ai/nutrition', input);
  return res.data.data as { plan: string; calories?: number; tdee?: number; macros?: { protein: number; carbs: number; fats: number } };
}

export async function aiAnalyze() {
  const res = await api.post('/ai/analyze-progress', {});
  return res.data.data as { analysis: string; suggestions: string[] };
}

export async function aiDailyTip(): Promise<string> {
  const res = await api.get('/ai/daily-tip');
  return res.data.data.tip;
}

// ── Progress / plans / profile ──────────────────────────────────────────────
export async function progressStats(period = 30): Promise<ProgressStats> {
  const res = await api.get('/progress/stats/overview', { params: { period } });
  return res.data.data.stats;
}

export async function myPlans() {
  const res = await api.get('/workouts', { params: { limit: 5 } });
  const d = res.data.data;
  return (d.workoutPlans ?? d.workouts ?? d.items ?? []) as { _id: string; title: string; difficulty?: string; status?: string }[];
}

export async function updateMe(userId: string, payload: Record<string, unknown>) {
  const res = await api.put(`/users/${userId}`, payload);
  return res.data.data.user;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await api.put('/auth/change-password', { currentPassword, newPassword });
}

export async function coachClients(coachId: string) {
  const res = await api.get(`/users/${coachId}/clients`);
  return (res.data.data.clients ?? []) as { _id: string; name: string; email: string; avatar?: string; lastLogin?: string }[];
}

// ── Admin ────────────────────────────────────────────────────────────────────
export async function adminStats() {
  const res = await api.get('/admin/dashboard/stats');
  return res.data.data as {
    overview: Record<string, number>;
    growth: { userGrowth: number; courseGrowth: number };
    recent: { users: { _id: string; name: string; email: string; role: string; createdAt: string; isApproved?: boolean }[] };
  };
}

export interface ContentItem {
  _id: string;
  title: string;
  type: 'course' | 'tip';
  isPublished: boolean;
  createdAt: string;
  author?: { name: string };
  instructor?: { name: string };
}

export async function adminContent(): Promise<ContentItem[]> {
  const [courses, tips] = await Promise.all(
    (['courses', 'tips'] as const).map(type =>
      api.get('/admin/content', { params: { type, limit: 50 } }).then(r => r.data.data.content ?? []),
    ),
  );
  return [
    ...courses.map((c: ContentItem) => ({ ...c, type: 'course' as const })),
    ...tips.map((c: ContentItem) => ({ ...c, type: 'tip' as const })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

const pluralType = (type: 'course' | 'tip') => (type === 'course' ? 'courses' : 'tips');

export async function adminPublish(type: 'course' | 'tip', id: string, isPublished: boolean) {
  await api.put(`/admin/content/${pluralType(type)}/${id}/publish`, { isPublished });
}

export async function adminDeleteContent(type: 'course' | 'tip', id: string) {
  await api.delete(`/admin/content/${pluralType(type)}/${id}`);
}

export async function adminAnnouncement(title: string, message: string) {
  await api.post('/admin/system-announcement', { title, message });
}

export async function approveUser(id: string) {
  await api.put(`/users/${id}/approve`, { isApproved: true });
}

// ── Shop ─────────────────────────────────────────────────────────────────────
export type ProductCategory = 'supplement' | 'drink' | 'gear' | 'apparel' | 'membership' | 'other';
export interface Product {
  _id: string; name: string; nameAr?: string; nameKu?: string; description?: string;
  category: ProductCategory; price: number; stock: number; imageUrl?: string; isActive?: boolean;
  [key: string]: unknown;
}
export type OrderStatus = 'pending' | 'ready' | 'completed' | 'cancelled';
export interface ShopOrder {
  _id: string; items: { product: string; name: string; price: number; quantity: number }[];
  total: number; status: OrderStatus; createdAt: string; note?: string;
  user?: { name: string; email?: string; phone?: string };
}

export async function listProducts(): Promise<Product[]> {
  return (await api.get('/shop/products')).data.data.products;
}
export async function listAllProducts(): Promise<Product[]> {
  return (await api.get('/shop/products/all')).data.data.products;
}
export async function saveProduct(p: Partial<Product>, id?: string): Promise<Product> {
  const body = { name: p.name, nameAr: p.nameAr || '', nameKu: p.nameKu || '', description: p.description || '', category: p.category, price: Number(p.price), stock: Number(p.stock), isActive: p.isActive ?? true, ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}) };
  const res = id ? await api.put(`/shop/products/${id}`, body) : await api.post('/shop/products', body);
  return res.data.data.product;
}
export async function hideProduct(id: string) { await api.delete(`/shop/products/${id}`); }
export async function placeOrder(items: { productId: string; quantity: number }[], note?: string): Promise<ShopOrder> {
  return (await api.post('/shop/orders', { items, ...(note ? { note } : {}) })).data.data.order;
}
export async function myOrders(): Promise<ShopOrder[]> {
  return (await api.get('/shop/orders/my')).data.data.orders;
}
export async function allOrders(): Promise<ShopOrder[]> {
  return (await api.get('/shop/orders')).data.data.orders;
}
export async function setOrderStatus(id: string, status: OrderStatus) {
  await api.put(`/shop/orders/${id}/status`, { status });
}

// ── Group classes ────────────────────────────────────────────────────────────
export interface GymClass {
  _id: string; title: string; titleAr?: string; titleKu?: string; description?: string;
  category: string; coach: { _id: string; name: string } | string; startsAt: string;
  durationMin: number; capacity: number; location?: string;
  attendees: (string | { _id: string; name: string; email?: string; phone?: string })[];
  attended: string[]; spotsLeft?: number;
  [key: string]: unknown;
}
export async function listClasses(mine = false): Promise<GymClass[]> {
  return (await api.get('/classes', { params: mine ? { mine: 'true' } : {} })).data.data.classes;
}
export async function createClass(body: Record<string, unknown>): Promise<GymClass[]> {
  return (await api.post('/classes', body)).data.data.classes;
}
export async function joinClass(id: string) { await api.post(`/classes/${id}/join`); }
export async function leaveClass(id: string) { await api.post(`/classes/${id}/leave`); }
export async function cancelClass(id: string) { await api.delete(`/classes/${id}`); }
export async function classRoster(id: string): Promise<GymClass> {
  return (await api.get(`/classes/${id}/roster`)).data.data.class;
}
export async function markAttendance(id: string, userId: string, present: boolean): Promise<GymClass> {
  return (await api.put(`/classes/${id}/attendance`, { userId, present })).data.data.class;
}

export function errorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string; errors?: { message: string }[] } } };
  const d = e?.response?.data;
  if (d?.errors?.length) return d.errors.map(x => x.message).join(', ');
  return d?.message || fallback;
}
