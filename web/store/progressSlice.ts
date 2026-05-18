import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as progressService from '@/services/progressService';

interface ProgressEntry {
  _id: string;
  workoutPlan?: string;
  date: string;
  notes?: string;
}

interface ProgressState {
  entries: ProgressEntry[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number; pages: number };
}

const initialState: ProgressState = {
  entries: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 }
};

export const fetchProgress = createAsyncThunk('progress/fetchProgress', async (params: { page?: number; limit?: number }, thunkAPI) => {
  try {
    const data = await progressService.getProgress(params.page || 1, params.limit || 20);
    return data;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch progress';
    return thunkAPI.rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
  }
});

export const addProgress = createAsyncThunk('progress/addProgress', async (payload: Partial<ProgressEntry> & { type?: string }, thunkAPI) => {
  try {
    const data = await progressService.addProgress(payload);
    return data;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to add progress';
    return thunkAPI.rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
  }
});

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchProgress.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as { progress?: ProgressEntry[]; pagination?: ProgressState['pagination'] };
        state.entries = payload.progress || [];
        state.pagination = payload.pagination || initialState.pagination;
      })
      .addCase(fetchProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addProgress.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.entries.unshift(action.payload as ProgressEntry);
      })
      .addCase(addProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export default progressSlice.reducer;
