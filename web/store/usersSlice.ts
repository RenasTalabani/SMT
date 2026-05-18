import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as userService from '@/services/userService';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  isApproved?: boolean;
}

interface UsersState {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number; pages: number };
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 }
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (params: { page?: number; limit?: number }, thunkAPI) => {
  try {
    const data = await userService.getAllUsers(params);
    return data;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch users';
    return thunkAPI.rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
  }
});

export const approveCoach = createAsyncThunk('users/approveCoach', async (userId: string, thunkAPI) => {
  try {
    const data = await userService.approveCoach(userId);
    return data;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to approve coach';
    return thunkAPI.rejectWithValue((error as { response?: { data?: { message?: string } } }).response?.data?.message || msg);
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchUsers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as { users?: UserProfile[]; pagination?: UsersState['pagination'] };
        state.users = payload.users || [];
        state.pagination = payload.pagination || initialState.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(approveCoach.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveCoach.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as UserProfile;
        state.users = state.users.map(user => (user._id === payload._id ? payload : user));
      })
      .addCase(approveCoach.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export default usersSlice.reducer;
