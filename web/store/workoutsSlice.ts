import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as workoutService from '@/services/workoutService';

interface WorkoutPlan {
  _id: string;
  title: string;
  description: string;
  difficulty?: string;
  category?: string;
  status?: string;
  assignedTo?: any;
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

export const getWorkouts = createAsyncThunk('workouts/getWorkouts', async (params: any, thunkAPI) => {
  try {
    const data = await workoutService.getWorkouts(params);
    return data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to get workouts');
  }
});

export const createWorkout = createAsyncThunk('workouts/createWorkout', async (payload: any, thunkAPI) => {
  try {
    const workout = await workoutService.createWorkout(payload);
    return workout;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to create workout');
  }
});

export const requestPlan = createAsyncThunk(
  'workouts/requestPlan',
  async (payload: { coachId: string; planType: string; notes?: string }, thunkAPI) => {
    try {
      return await workoutService.requestPlan(payload);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to send request');
    }
  }
);

export const assignWorkout = createAsyncThunk('workouts/assignWorkout', async ({ workoutId, clientId }: { workoutId: string; clientId: string }, thunkAPI) => {
  try {
    const plan = await workoutService.assignWorkout(workoutId, clientId);
    return plan;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to assign workout');
  }
});

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
      .addCase(getWorkouts.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.plans = action.payload.workoutPlans || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(getWorkouts.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createWorkout.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWorkout.fulfilled, (state, action: PayloadAction<WorkoutPlan>) => {
        state.loading = false;
        state.plans.unshift(action.payload);
      })
      .addCase(createWorkout.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
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
      .addCase(assignWorkout.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(requestPlan.pending, state => {
        state.requestLoading = true;
        state.requestError = null;
      })
      .addCase(requestPlan.fulfilled, state => {
        state.requestLoading = false;
        state.requestSent = true;
      })
      .addCase(requestPlan.rejected, (state, action: PayloadAction<any>) => {
        state.requestLoading = false;
        state.requestError = action.payload;
      });
  }
});

export default workoutsSlice.reducer;
