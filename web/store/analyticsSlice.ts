import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

export interface AnalyticsData {
  overview: any;
  distribution: any;
  growth: any[];
  topItems?: any[];
  period: number;
}

export interface AnalyticsState {
  users: {
    data: AnalyticsData | null;
    loading: boolean;
    error: string | null;
  };
  courses: {
    data: AnalyticsData | null;
    loading: boolean;
    error: string | null;
  };
  tips: {
    data: AnalyticsData | null;
    loading: boolean;
    error: string | null;
  };
  workouts: {
    data: AnalyticsData | null;
    loading: boolean;
    error: string | null;
  };
  revenue: {
    data: AnalyticsData | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: AnalyticsState = {
  users: { data: null, loading: false, error: null },
  courses: { data: null, loading: false, error: null },
  tips: { data: null, loading: false, error: null },
  workouts: { data: null, loading: false, error: null },
  revenue: { data: null, loading: false, error: null },
};

// Async thunks for fetching analytics data
export const fetchUsersAnalytics = createAsyncThunk(
  'analytics/fetchUsers',
  async (period: number = 30) => {
    const response = await api.get(`/admin/analytics/users?period=${period}`);
    return response.data.data;
  }
);

export const fetchCoursesAnalytics = createAsyncThunk(
  'analytics/fetchCourses',
  async (period: number = 30) => {
    const response = await api.get(`/admin/analytics/courses?period=${period}`);
    return response.data.data;
  }
);

export const fetchTipsAnalytics = createAsyncThunk(
  'analytics/fetchTips',
  async (period: number = 30) => {
    const response = await api.get(`/admin/analytics/tips?period=${period}`);
    return response.data.data;
  }
);

export const fetchWorkoutsAnalytics = createAsyncThunk(
  'analytics/fetchWorkouts',
  async (period: number = 30) => {
    const response = await api.get(`/admin/analytics/workouts?period=${period}`);
    return response.data.data;
  }
);

export const fetchRevenueAnalytics = createAsyncThunk(
  'analytics/fetchRevenue',
  async (period: number = 30) => {
    const response = await api.get(`/admin/analytics/revenue?period=${period}`);
    return response.data.data;
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsError: (state, action) => {
      const type = action.payload;
      if (state[type as keyof AnalyticsState]) {
        (state[type as keyof AnalyticsState] as any).error = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Users analytics
    builder
      .addCase(fetchUsersAnalytics.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchUsersAnalytics.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.data = action.payload;
      })
      .addCase(fetchUsersAnalytics.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.error.message || 'Failed to fetch users analytics';
      })

    // Courses analytics
    builder
      .addCase(fetchCoursesAnalytics.pending, (state) => {
        state.courses.loading = true;
        state.courses.error = null;
      })
      .addCase(fetchCoursesAnalytics.fulfilled, (state, action) => {
        state.courses.loading = false;
        state.courses.data = action.payload;
      })
      .addCase(fetchCoursesAnalytics.rejected, (state, action) => {
        state.courses.loading = false;
        state.courses.error = action.error.message || 'Failed to fetch courses analytics';
      })

    // Tips analytics
    builder
      .addCase(fetchTipsAnalytics.pending, (state) => {
        state.tips.loading = true;
        state.tips.error = null;
      })
      .addCase(fetchTipsAnalytics.fulfilled, (state, action) => {
        state.tips.loading = false;
        state.tips.data = action.payload;
      })
      .addCase(fetchTipsAnalytics.rejected, (state, action) => {
        state.tips.loading = false;
        state.tips.error = action.error.message || 'Failed to fetch tips analytics';
      })

    // Workouts analytics
    builder
      .addCase(fetchWorkoutsAnalytics.pending, (state) => {
        state.workouts.loading = true;
        state.workouts.error = null;
      })
      .addCase(fetchWorkoutsAnalytics.fulfilled, (state, action) => {
        state.workouts.loading = false;
        state.workouts.data = action.payload;
      })
      .addCase(fetchWorkoutsAnalytics.rejected, (state, action) => {
        state.workouts.loading = false;
        state.workouts.error = action.error.message || 'Failed to fetch workouts analytics';
      })

    // Revenue analytics
    builder
      .addCase(fetchRevenueAnalytics.pending, (state) => {
        state.revenue.loading = true;
        state.revenue.error = null;
      })
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        state.revenue.loading = false;
        state.revenue.data = action.payload;
      })
      .addCase(fetchRevenueAnalytics.rejected, (state, action) => {
        state.revenue.loading = false;
        state.revenue.error = action.error.message || 'Failed to fetch revenue analytics';
      });
  },
});

export const { clearAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer;