import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/services/api';

export interface Course {
  _id: string;
  title: string;
  titleAr: string;
  titleKu: string;
  description: string;
  descriptionAr: string;
  descriptionKu: string;
  instructor: {
    _id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  price: number;
  currency?: string;
  thumbnail?: string;
  content: {
    weeks: {
      title: string;
      titleAr: string;
      titleKu: string;
      description: string;
      descriptionAr: string;
      descriptionKu: string;
      materials: {
        type: 'video' | 'document' | 'exercise';
        title: string;
        titleAr: string;
        titleKu: string;
        url: string;
        duration?: number;
      }[];
      exercises: string[]; // Exercise IDs
    }[];
  };
  enrolledStudents: string[];
  enrollmentCount: number;
  ratings: {
    user: string;
    rating: number;
    review?: string;
    createdAt: Date;
  }[];
  averageRating: number;
  totalRatings: number;
  tags: string[];
  prerequisites: string[];
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  myCourses: Course[];
  enrolledCourses: CourseEnrollment[];
  categories: string[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: CourseFilters;
}

// Async thunks
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (filters: CourseFilters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get(`/courses?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch courses';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  'courses/fetchCourseById',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      return response.data.data.course;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch course';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const createCourse = createAsyncThunk(
  'courses/createCourse',
  async (courseData: Partial<Course>, { rejectWithValue }) => {
    try {
      const response = await api.post('/courses', courseData);
      return response.data.data.course;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create course';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const updateCourse = createAsyncThunk(
  'courses/updateCourse',
  async ({ courseId, updates }: { courseId: string; updates: Partial<Course> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/courses/${courseId}`, updates);
      return response.data.data.course;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update course';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const deleteCourse = createAsyncThunk(
  'courses/deleteCourse',
  async (courseId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/courses/${courseId}`);
      return courseId;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to delete course';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const enrollInCourse = createAsyncThunk(
  'courses/enrollInCourse',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/courses/${courseId}/enroll`);
      return response.data.data.enrollment;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to enroll in course';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const updateProgress = createAsyncThunk(
  'courses/updateProgress',
  async ({ courseId, progress }: { courseId: string; progress: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/courses/${courseId}/progress`, progress);
      return response.data.data.progress;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update progress';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const fetchMyCourses = createAsyncThunk(
  'courses/fetchMyCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/courses/my-courses');
      return response.data.data.courses;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch my courses';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const fetchMyProgress = createAsyncThunk(
  'courses/fetchMyProgress',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/courses/my-progress');
      return response.data.data.progress;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch progress';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'courses/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/courses/categories');
      return response.data.data.categories;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch categories';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const uploadCourseThumbnail = createAsyncThunk(
  'courses/uploadThumbnail',
  async ({ courseId, file }: { courseId: string; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);

      const response = await api.post(`/courses/${courseId}/thumbnail`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data.thumbnail;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to upload thumbnail';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

export const publishCourse = createAsyncThunk(
  'courses/publishCourse',
  async ({ courseId, isPublished }: { courseId: string; isPublished: boolean }, { rejectWithValue }) => {
    try {
      await api.put(`/courses/${courseId}/publish`, { isPublished });
      return { courseId, isPublished };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to publish course';
      return rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
    }
  }
);

const initialState: CourseState = {
  courses: [],
  currentCourse: null,
  myCourses: [],
  enrolledCourses: [],
  categories: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  },
  filters: {
    page: 1,
    limit: 12,
    sortBy: 'newest',
  },
};

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<CourseFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 12,
        sortBy: 'newest',
      };
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch courses
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.courses;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch course by ID
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create course
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses.unshift(action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update course
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.courses.findIndex(course => course._id === action.payload._id);
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
        if (state.currentCourse?._id === action.payload._id) {
          state.currentCourse = action.payload;
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete course
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = state.courses.filter(course => course._id !== action.payload);
        state.myCourses = state.myCourses.filter(course => course._id !== action.payload);
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Enroll in course
      .addCase(enrollInCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.enrolledCourses.push(action.payload);
        if (state.currentCourse) {
          state.currentCourse.enrolledStudents.push(action.payload.courseId);
          state.currentCourse.enrollmentCount += 1;
        }
      })
      .addCase(enrollInCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update progress
      .addCase(updateProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.enrolledCourses.findIndex(ec => ec.courseId === action.payload.courseId);
        if (index !== -1) {
          state.enrolledCourses[index] = action.payload;
        }
      })
      .addCase(updateProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch my courses
      .addCase(fetchMyCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.myCourses = action.payload;
      })
      .addCase(fetchMyCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch my progress
      .addCase(fetchMyProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.enrolledCourses = action.payload;
      })
      .addCase(fetchMyProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Upload thumbnail
      .addCase(uploadCourseThumbnail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadCourseThumbnail.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentCourse) {
          state.currentCourse.thumbnail = action.payload;
        }
      })
      .addCase(uploadCourseThumbnail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Publish course
      .addCase(publishCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(publishCourse.fulfilled, (state, action) => {
        state.loading = false;
        const { courseId, isPublished } = action.payload;
        const course = state.courses.find(c => c._id === courseId);
        if (course) {
          course.isPublished = isPublished;
          if (isPublished) {
            course.publishedAt = new Date();
          }
        }
        if (state.currentCourse?._id === courseId) {
          state.currentCourse.isPublished = isPublished;
          if (isPublished) {
            state.currentCourse.publishedAt = new Date();
          }
        }
      })
      .addCase(publishCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, resetFilters, clearCurrentCourse } = coursesSlice.actions;
export default coursesSlice.reducer;