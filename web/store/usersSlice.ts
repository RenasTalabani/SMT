import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (params: any, thunkAPI) => {
  try {
    const data = await userService.getAllUsers(params);
    return data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch users');
  }
});

export const approveCoach = createAsyncThunk('users/approveCoach', async (userId: string, thunkAPI) => {
  try {
    const data = await userService.approveCoach(userId);
    return data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to approve coach');
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
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.users = action.payload.users || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(approveCoach.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveCoach.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.loading = false;
        state.users = state.users.map(user => (user._id === action.payload._id ? action.payload : user));
      })
      .addCase(approveCoach.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default usersSlice.reducer;
