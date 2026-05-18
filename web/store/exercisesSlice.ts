import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as exerciseService from '@/services/exerciseService';

interface Exercise {
  _id: string;
  name: string;
  description: string;
  category?: string;
  difficulty?: string;
}

interface ExercisesState {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number; pages: number };
}

const initialState: ExercisesState = {
  exercises: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 }
};

export const fetchExercises = createAsyncThunk('exercises/fetchExercises', async (params: { page?: number; limit?: number }, thunkAPI) => {
  try {
    const data = await exerciseService.getExercises(params.page || 1, params.limit || 20);
    return data;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch exercises';
    return thunkAPI.rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
  }
});

export const createExercise = createAsyncThunk('exercises/createExercise', async (payload: Partial<Exercise>, thunkAPI) => {
  try {
    const data = await exerciseService.createExercise(payload);
    return data;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create exercise';
    return thunkAPI.rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
  }
});

const exercisesSlice = createSlice({
  name: 'exercises',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchExercises.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExercises.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as { exercises?: Exercise[]; pagination?: ExercisesState['pagination'] };
        state.exercises = payload.exercises || [];
        state.pagination = payload.pagination || initialState.pagination;
      })
      .addCase(fetchExercises.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createExercise.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExercise.fulfilled, (state, action) => {
        state.loading = false;
        state.exercises.unshift(action.payload as Exercise);
      })
      .addCase(createExercise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export default exercisesSlice.reducer;
