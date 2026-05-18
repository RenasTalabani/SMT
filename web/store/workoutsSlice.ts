import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as workoutService from '@/services/workoutService';
import { WorkoutQueryOptions } from '@/services/workoutService';

interface WorkoutPlan {
  _id: string;
  title: string;
  description: string;
  difficulty?: string;
  category?: string;
  status?: string;
  assignedTo?: string | null;
}

interface WorkoutsState {
  plans: WorkoutPlan[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number; pages: number };
  requestLoading: boolean;
  requestSent: boolean;
  requestError: string | null;
}

const initialState: WorkoutsState = {
  plans: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  requestLoading: false,
  requestSent: false,
  requestError: null
};

export const getWorkouts = createAsyncThunk(
  'workouts/getWorkouts',
  async (params: WorkoutQueryOptions, thunkAPI) => {
    try {
      return await workoutService.getWorkouts(params);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to get workouts';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const createWorkout = createAsyncThunk(
  'workouts/createWorkout',
  async (payload: Record<string, unknown>, thunkAPI) => {
    try {
      return await workoutService.createWorkout(payload);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create workout';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const requestPlan = createAsyncThunk(
  'workouts/requestPlan',
  async (payload: { coachId: string; planType: string; notes?: string }, thunkAPI) => {
    try {
      return await workoutService.requestPlan(payload);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to send request';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const assignWorkout = createAsyncThunk(
  'workouts/assignWorkout',
  async ({ workoutId, clientId }: { workoutId: string; clientId: string }, thunkAPI) => {
    try {
      return await workoutService.assignWorkout(workoutId, clientId);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to assign workout';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const workoutsSlice = createSlice({
  name: 'workouts',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getWorkouts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWorkouts.fulfilled, (state, action: PayloadAction<{ workoutPlans: WorkoutPlan[]; pagination: WorkoutsState['pagination'] }>) => {
        state.loading = false;
        state.plans = action.payload.workoutPlans || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(getWorkouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createWorkout.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWorkout.fulfilled, (state, action: PayloadAction<WorkoutPlan>) => {
        state.loading = false;
        state.plans.unshift(action.payload);
      })
      .addCase(createWorkout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(assignWorkout.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignWorkout.fulfilled, (state, action: PayloadAction<WorkoutPlan>) => {
        state.loading = false;
        const idx = state.plans.findIndex(p => p._id === action.payload._id);
        if (idx >= 0) state.plans[idx] = action.payload;
      })
      .addCase(assignWorkout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(requestPlan.pending, state => {
        state.requestLoading = true;
        state.requestError = null;
      })
      .addCase(requestPlan.fulfilled, state => {
        state.requestLoading = false;
        state.requestSent = true;
      })
      .addCase(requestPlan.rejected, (state, action) => {
        state.requestLoading = false;
        state.requestError = action.payload as string;
      });
  }
});

export default workoutsSlice.reducer;
