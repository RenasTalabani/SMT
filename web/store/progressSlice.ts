import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as progressService from '@/services/progressService';

interface ProgressEntry {
  _id: string;
  workoutPlan?: any;
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

export const fetchProgress = createAsyncThunk('progress/fetchProgress', async (params: any, thunkAPI) => {
  try {
    const data = await progressService.getProgress(params.page || 1, params.limit || 20);
    return data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch progress');
  }
});

export const addProgress = createAsyncThunk('progress/addProgress', async (payload: any, thunkAPI) => {
  try {
    const data = await progressService.addProgress(payload);
    return data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to add progress');
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
      .addCase(fetchProgress.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.entries = action.payload.progress || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchProgress.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addProgress.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProgress.fulfilled, (state, action: PayloadAction<ProgressEntry>) => {
        state.loading = false;
        state.entries.unshift(action.payload);
      })
      .addCase(addProgress.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default progressSlice.reducer;
