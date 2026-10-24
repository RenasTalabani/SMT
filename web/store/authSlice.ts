import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { saveSession, saveUser, removeAuthToken, loadSession } from '@/lib/auth';
import * as authService from '@/services/authService';

type UserRole = 'admin' | 'coach' | 'client' | null;

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isApproved?: boolean;
  phone?: string;
  height?: number;
  weight?: number;
  gender?: string;
  experienceLevel?: string;
  fitnessGoals?: string[];
  bio?: string;
  specialization?: string[] | string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  role: UserRole;
  loading: boolean;
  error: string | null;
  /** true once the saved session (if any) has been read from storage */
  hydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  role: null,
  loading: false,
  error: null,
  hydrated: false,
};

function extractMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: { message: string }[] } | undefined;
    if (data?.errors?.length) return data.errors.map(e => e.message).join(', ');
    return data?.message ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function normalizeUser(u: UserProfile & { id?: string }): UserProfile {
  return { ...u, _id: u._id || u.id || '' };
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, thunkAPI) => {
    try {
      const data = await authService.login({ email, password });
      const user = normalizeUser(data.user);
      saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user });
      return { token: data.accessToken as string, user };
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(extractMessage(error, 'Login failed'));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: { name: string; email: string; password: string; role: 'client' | 'coach' }, thunkAPI) => {
    try {
      const data = await authService.register(payload);
      const user = normalizeUser(data.user);
      saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user });
      return { token: data.accessToken as string, user };
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(extractMessage(error, 'Registration failed'));
    }
  }
);

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, thunkAPI) => {
  try {
    const profile = normalizeUser(await authService.getProfile());
    saveUser(profile);
    return profile;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(extractMessage(error, 'Fetch profile failed'));
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Restore the session saved in localStorage (called once on app start). */
    hydrate(state) {
      const saved = loadSession<UserProfile>();
      if (saved) {
        state.token = saved.token;
        state.user = saved.user;
        state.role = saved.user.role;
      }
      state.hydrated = true;
    },
    updateUser(state, action: PayloadAction<Partial<UserProfile>>) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      saveUser(state.user);
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.role = null;
      state.loading = false;
      state.error = null;
      removeAuthToken();
    }
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.user = action.payload;
        state.role = action.payload.role;
      });
  }
});

export const { logout, hydrate, updateUser } = authSlice.actions;
export default authSlice.reducer;
