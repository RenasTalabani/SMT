import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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

export const fetchExercises = createAsyncThunk('exercises/fetchExercises', async (params: any, thunkAPI) => {
  try {
    const data = await exerciseService.getExercises(params.page || 1, params.limit || 20);
    return data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch exercises');
  }
});

export const createExercise = createAsyncThunk('exercises/createExercise', async (payload: any, thunkAPI) => {
  try {
    const data = await exerciseService.createExercise(payload);
    return data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to create exercise');
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
      .addCase(fetchExercises.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.exercises = action.payload.exercises || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchExercises.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createExercise.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExercise.fulfilled, (state, action: PayloadAction<Exercise>) => {
        state.loading = false;
        state.exercises.unshift(action.payload);
      })
      .addCase(createExercise.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default exercisesSlice.reducer;
