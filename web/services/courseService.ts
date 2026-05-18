import api from './api';

export interface CourseFilters {
  category?: string;
  level?: string;
  instructor?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'oldest' | 'rating' | 'price-low' | 'price-high' | 'popular';
  page?: number;
  limit?: number;
}

export interface CourseEnrollment {
  courseId: string;
  enrolledAt: Date;
  progress: {
    week: number;
    material: number;
    completed: boolean;
    completedAt?: Date;
  }[];
  completedWeeks: number[];
  overallProgress: number;
  completedAt?: Date;
  certificateUrl?: string;
}

export async function getCourses(filters: CourseFilters = {}) {
  const params = { ...filters };
  const res = await api.get('/courses', { params });
  return res.data.data;
}

export async function getCourseById(courseId: string) {
  const res = await api.get(`/courses/${courseId}`);
  return res.data.data.course;
}

export async function createCourse(courseData: Record<string, unknown>) {
  const res = await api.post('/courses', courseData);
  return res.data.data.course;
}

export async function updateCourse(courseId: string, updates: Record<string, unknown>) {
  const res = await api.put(`/courses/${courseId}`, updates);
  return res.data.data.course;
}

export async function deleteCourse(courseId: string) {
  const res = await api.delete(`/courses/${courseId}`);
  return res.data;
}

export async function enrollInCourse(courseId: string) {
  const res = await api.post(`/courses/${courseId}/enroll`);
  return res.data.data.enrollment;
}

export async function updateCourseProgress(courseId: string, progress: Record<string, unknown>) {
  const res = await api.put(`/courses/${courseId}/progress`, progress);
  return res.data.data.progress;
}

export async function getMyCourses() {
  const res = await api.get('/courses/my-courses');
  return res.data.data.courses;
}

export async function getMyProgress() {
  const res = await api.get('/courses/my-progress');
  return res.data.data.progress;
}

export async function getCourseCategories() {
  const res = await api.get('/courses/categories');
  return res.data.data.categories;
}

export async function uploadCourseThumbnail(courseId: string, file: File) {
  const formData = new FormData();
  formData.append('thumbnail', file);

  const res = await api.post(`/courses/${courseId}/thumbnail`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.data.thumbnail;
}

export async function publishCourse(courseId: string, isPublished: boolean) {
  const res = await api.put(`/courses/${courseId}/publish`, { isPublished });
  return res.data;
}

export async function getInstructorCourses(instructorId: string) {
  const res = await api.get(`/courses/instructor/${instructorId}`);
  return res.data.data.courses;
}