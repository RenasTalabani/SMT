import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/services/api';

export interface TipComment {
  _id: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: Date;
}

export interface Tip {
  _id: string;
  title: string;
  titleAr: string;
  titleKu: string;
  content: string;
  contentAr: string;
  contentKu: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  type: 'article' | 'video' | 'infographic' | 'exercise';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  tags: string[];
  media: {
    type: 'image' | 'video';
    url: string;
    publicId: string;
  }[];
  likes: string[];
  likesCount: number;
  bookmarks: string[];
  bookmarksCount: number;
  comments: TipComment[];
  commentsCount: number;
  views: number;
  isPublished: boolean;
  publishedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TipFilters {
  category?: string;
  type?: string;
  difficulty?: string;
  author?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'likes' | 'views';
  page?: number;
  limit?: number;
}

export interface TipState {
  tips: Tip[];
  currentTip: Tip | null;
  myTips: Tip[];
  bookmarkedTips: Tip[];
  categories: string[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: TipFilters;
}

// Async thunks
export const fetchTips = createAsyncThunk(
  'tips/fetchTips',
  async (filters: TipFilters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get(`/tips?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tips');
    }
  }
);

export const fetchTipById = createAsyncThunk(
  'tips/fetchTipById',
  async (tipId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tips/${tipId}`);
      return response.data.data.tip;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tip');
    }
  }
);

export const createTip = createAsyncThunk(
  'tips/createTip',
  async (tipData: Partial<Tip>, { rejectWithValue }) => {
    try {
      const response = await api.post('/tips', tipData);
      return response.data.data.tip;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create tip');
    }
  }
);

export const updateTip = createAsyncThunk(
  'tips/updateTip',
  async ({ tipId, updates }: { tipId: string; updates: Partial<Tip> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/tips/${tipId}`, updates);
      return response.data.data.tip;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tip');
    }
  }
);

export const deleteTip = createAsyncThunk(
  'tips/deleteTip',
  async (tipId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/tips/${tipId}`);
      return tipId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tip');
    }
  }
);

export const likeTip = createAsyncThunk(
  'tips/likeTip',
  async (tipId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/tips/${tipId}/like`);
      return { tipId, ...response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like tip');
    }
  }
);

export const bookmarkTip = createAsyncThunk(
  'tips/bookmarkTip',
  async (tipId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/tips/${tipId}/bookmark`);
      return { tipId, ...response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bookmark tip');
    }
  }
);

export const fetchTipComments = createAsyncThunk(
  'tips/fetchTipComments',
  async (tipId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tips/${tipId}/comments`);
      return { tipId, comments: response.data.data.comments };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

export const addTipComment = createAsyncThunk(
  'tips/addTipComment',
  async ({ tipId, content }: { tipId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/tips/${tipId}/comments`, { content });
      return { tipId, comment: response.data.data.comment };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

export const fetchMyTips = createAsyncThunk(
  'tips/fetchMyTips',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tips/my-tips');
      return response.data.data.tips;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my tips');
    }
  }
);

export const fetchBookmarkedTips = createAsyncThunk(
  'tips/fetchBookmarkedTips',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tips/bookmarked');
      return response.data.data.tips;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookmarked tips');
    }
  }
);

export const fetchTipCategories = createAsyncThunk(
  'tips/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tips/categories');
      return response.data.data.categories;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const uploadTipMedia = createAsyncThunk(
  'tips/uploadMedia',
  async ({ tipId, files }: { tipId: string; files: File[] }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('media', file);
      });

      const response = await api.post(`/tips/${tipId}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { tipId, media: response.data.data.media };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload media');
    }
  }
);

export const publishTip = createAsyncThunk(
  'tips/publishTip',
  async ({ tipId, isPublished }: { tipId: string; isPublished: boolean }, { rejectWithValue }) => {
    try {
      await api.put(`/tips/${tipId}/publish`, { isPublished });
      return { tipId, isPublished };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to publish tip');
    }
  }
);

export const fetchAuthorTips = createAsyncThunk(
  'tips/fetchAuthorTips',
  async (authorId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tips/author/${authorId}`);
      return response.data.data.tips;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch author tips');
    }
  }
);

const initialState: TipState = {
  tips: [],
  currentTip: null,
  myTips: [],
  bookmarkedTips: [],
  categories: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  },
  filters: {
    page: 1,
    limit: 12,
    sortBy: 'newest',
  },
};

const tipsSlice = createSlice({
  name: 'tips',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<TipFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 12,
        sortBy: 'newest',
      };
    },
    clearCurrentTip: (state) => {
      state.currentTip = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tips
      .addCase(fetchTips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTips.fulfilled, (state, action) => {
        state.loading = false;
        state.tips = action.payload.tips;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch tip by ID
      .addCase(fetchTipById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTipById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTip = action.payload;
      })
      .addCase(fetchTipById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create tip
      .addCase(createTip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTip.fulfilled, (state, action) => {
        state.loading = false;
        state.tips.unshift(action.payload);
        state.myTips.unshift(action.payload);
      })
      .addCase(createTip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update tip
      .addCase(updateTip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTip.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tips.findIndex(tip => tip._id === action.payload._id);
        if (index !== -1) {
          state.tips[index] = action.payload;
        }
        const myIndex = state.myTips.findIndex(tip => tip._id === action.payload._id);
        if (myIndex !== -1) {
          state.myTips[myIndex] = action.payload;
        }
        if (state.currentTip?._id === action.payload._id) {
          state.currentTip = action.payload;
        }
      })
      .addCase(updateTip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete tip
      .addCase(deleteTip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTip.fulfilled, (state, action) => {
        state.loading = false;
        state.tips = state.tips.filter(tip => tip._id !== action.payload);
        state.myTips = state.myTips.filter(tip => tip._id !== action.payload);
        state.bookmarkedTips = state.bookmarkedTips.filter(tip => tip._id !== action.payload);
      })
      .addCase(deleteTip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Like tip
      .addCase(likeTip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(likeTip.fulfilled, (state, action) => {
        state.loading = false;
        const { tipId, liked, likesCount } = action.payload;
        const tip = state.tips.find(t => t._id === tipId);
        if (tip) {
          tip.likesCount = likesCount;
          if (liked) {
            tip.likes.push('currentUser'); // Placeholder for current user ID
          } else {
            tip.likes = tip.likes.filter(id => id !== 'currentUser');
          }
        }
        if (state.currentTip?._id === tipId) {
          state.currentTip.likesCount = likesCount;
          if (liked) {
            state.currentTip.likes.push('currentUser');
          } else {
            state.currentTip.likes = state.currentTip.likes.filter(id => id !== 'currentUser');
          }
        }
      })
      .addCase(likeTip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Bookmark tip
      .addCase(bookmarkTip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bookmarkTip.fulfilled, (state, action) => {
        state.loading = false;
        const { tipId, bookmarked, bookmarksCount } = action.payload;
        const tip = state.tips.find(t => t._id === tipId);
        if (tip) {
          tip.bookmarksCount = bookmarksCount;
          if (bookmarked) {
            tip.bookmarks.push('currentUser'); // Placeholder for current user ID
          } else {
            tip.bookmarks = tip.bookmarks.filter(id => id !== 'currentUser');
          }
        }
        if (state.currentTip?._id === tipId) {
          state.currentTip.bookmarksCount = bookmarksCount;
          if (bookmarked) {
            state.currentTip.bookmarks.push('currentUser');
          } else {
            state.currentTip.bookmarks = state.currentTip.bookmarks.filter(id => id !== 'currentUser');
          }
        }
      })
      .addCase(bookmarkTip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch tip comments
      .addCase(fetchTipComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTipComments.fulfilled, (state, action) => {
        state.loading = false;
        const { tipId, comments } = action.payload;
        if (state.currentTip?._id === tipId) {
          state.currentTip.comments = comments;
          state.currentTip.commentsCount = comments.length;
        }
      })
      .addCase(fetchTipComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Add tip comment
      .addCase(addTipComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTipComment.fulfilled, (state, action) => {
        state.loading = false;
        const { tipId, comment } = action.payload;
        if (state.currentTip?._id === tipId) {
          state.currentTip.comments.push(comment);
          state.currentTip.commentsCount += 1;
        }
      })
      .addCase(addTipComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch my tips
      .addCase(fetchMyTips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTips.fulfilled, (state, action) => {
        state.loading = false;
        state.myTips = action.payload;
      })
      .addCase(fetchMyTips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch bookmarked tips
      .addCase(fetchBookmarkedTips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookmarkedTips.fulfilled, (state, action) => {
        state.loading = false;
        state.bookmarkedTips = action.payload;
      })
      .addCase(fetchBookmarkedTips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch categories
      .addCase(fetchTipCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTipCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchTipCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Upload media
      .addCase(uploadTipMedia.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadTipMedia.fulfilled, (state, action) => {
        state.loading = false;
        const { tipId, media } = action.payload;
        if (state.currentTip?._id === tipId) {
          state.currentTip.media = media;
        }
      })
      .addCase(uploadTipMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Publish tip
      .addCase(publishTip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(publishTip.fulfilled, (state, action) => {
        state.loading = false;
        const { tipId, isPublished } = action.payload;
        const tip = state.tips.find(t => t._id === tipId);
        if (tip) {
          tip.isPublished = isPublished;
          if (isPublished) {
            tip.publishedAt = new Date();
          }
        }
        const myTip = state.myTips.find(t => t._id === tipId);
        if (myTip) {
          myTip.isPublished = isPublished;
          if (isPublished) {
            myTip.publishedAt = new Date();
          }
        }
        if (state.currentTip?._id === tipId) {
          state.currentTip.isPublished = isPublished;
          if (isPublished) {
            state.currentTip.publishedAt = new Date();
          }
        }
      })
      .addCase(publishTip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch author tips
      .addCase(fetchAuthorTips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuthorTips.fulfilled, (state, action) => {
        state.loading = false;
        // This could be used to show author tips in a separate section
      })
      .addCase(fetchAuthorTips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, resetFilters, clearCurrentTip } = tipsSlice.actions;
export default tipsSlice.reducer;