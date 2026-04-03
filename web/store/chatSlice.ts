import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/services/api';

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file';
  attachments?: any[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  isGroup: boolean;
  groupName?: string;
  groupPhoto?: string;
  members: any[];
  lastMessage?: Message;
  lastMessageText?: string;
  lastMessageSender?: any;
  unreadCounts?: Array<{ userId: string; unreadCount: number }>;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  typingUsers: { [key: string]: boolean };
  loading: boolean;
  error: string | null;
  unreadCount: number;
  hasMore: boolean;
  currentPage: number;
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  typingUsers: {},
  loading: false,
  error: null,
  unreadCount: 0,
  hasMore: true,
  currentPage: 1
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (
    { page = 1, limit = 50 }: { page?: number; limit?: number } = {},
    thunkAPI
  ) => {
    try {
      const { data } = await api.get('/chat/conversation/list', {
        params: { page, limit }
      });
      return data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch conversations'
      );
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (
    {
      conversationId,
      page = 1,
      limit = 50
    }: { conversationId: string; page?: number; limit?: number },
    thunkAPI
  ) => {
    try {
      const { data } = await api.get(
        `/chat/conversation/${conversationId}/messages`,
        {
          params: { page, limit }
        }
      );
      return { messages: data.data.messages, pagination: data.data.pagination };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch messages'
      );
    }
  }
);

export const createDirectConversation = createAsyncThunk(
  'chat/createDirectConversation',
  async ({ otherUserId }: { otherUserId: string }, thunkAPI) => {
    try {
      const { data } = await api.post('/chat/conversation/create-direct', {
        otherUserId
      });
      return data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to create conversation'
      );
    }
  }
);

export const createGroupConversation = createAsyncThunk(
  'chat/createGroupConversation',
  async (
    { groupName, memberIds }: { groupName: string; memberIds: string[] },
    thunkAPI
  ) => {
    try {
      const { data } = await api.post('/chat/conversation/create-group', {
        groupName,
        memberIds
      });
      return data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to create group'
      );
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  'chat/markConversationAsRead',
  async ({ conversationId }: { conversationId: string }, thunkAPI) => {
    try {
      await api.put(`/chat/conversation/${conversationId}/mark-read`);
      return conversationId;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to mark as read'
      );
    }
  }
);

export const toggleConversationMute = createAsyncThunk(
  'chat/toggleConversationMute',
  async ({ conversationId }: { conversationId: string }, thunkAPI) => {
    try {
      await api.put(`/chat/conversation/${conversationId}/mute`);
      return conversationId;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to toggle mute'
      );
    }
  }
);

export const leaveConversation = createAsyncThunk(
  'chat/leaveConversation',
  async ({ conversationId }: { conversationId: string }, thunkAPI) => {
    try {
      await api.delete(`/chat/conversation/${conversationId}`);
      return conversationId;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to leave'
      );
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Add new message to current conversation
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },

    // Add received message
    receiveMessage: (state, action: PayloadAction<Message>) => {
      const { conversationId } = action.payload;
      if (
        state.currentConversation &&
        state.currentConversation._id === conversationId
      ) {
        state.messages.push(action.payload);
      }

      // Update conversation in list
      const conv = state.conversations.find(c => c._id === conversationId);
      if (conv) {
        conv.lastMessage = action.payload;
        conv.lastMessageText = action.payload.content;
        conv.lastMessageSender = action.payload.sender;
        // Move to top
        state.conversations = [
          conv,
          ...state.conversations.filter(c => c._id !== conversationId)
        ];
      }
    },

    // Set current conversation
    setCurrentConversation: (state, action: PayloadAction<Conversation>) => {
      state.currentConversation = action.payload;
      state.messages = [];
      state.currentPage = 1;
    },

    // Clear current conversation
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
      state.messages = [];
    },

    // Add typing user
    addTypingUser: (state, action: PayloadAction<string>) => {
      state.typingUsers[action.payload] = true;
    },

    // Remove typing user
    removeTypingUser: (state, action: PayloadAction<string>) => {
      delete state.typingUsers[action.payload];
    },

    // Clear typing users
    clearTypingUsers: (state) => {
      state.typingUsers = {};
    },

    // Update message read status
    markMessageAsRead: (state, action: PayloadAction<string>) => {
      const message = state.messages.find(m => m._id === action.payload);
      if (message) {
        message.isRead = true;
      }
    },

    // Reset chat state
    resetChat: (state) => {
      state.conversations = [];
      state.currentConversation = null;
      state.messages = [];
      state.typingUsers = {};
      state.unreadCount = 0;
      state.hasMore = true;
      state.currentPage = 1;
    }
  },
  extraReducers: (builder) => {
    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchConversations.fulfilled,
        (
          state,
          action: PayloadAction<{
            conversations: Conversation[];
            pagination: any;
          }>
        ) => {
          state.loading = false;
          state.conversations = action.payload.conversations;
          state.hasMore =
            action.payload.pagination.page <
            action.payload.pagination.pages;
        }
      )
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMessages.fulfilled,
        (
          state,
          action: PayloadAction<{ messages: Message[]; pagination: any }>
        ) => {
          state.loading = false;
          state.messages = action.payload.messages;
          state.currentPage = action.payload.pagination.page;
          state.hasMore =
            action.payload.pagination.page <
            action.payload.pagination.pages;
        }
      )
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create direct conversation
    builder
      .addCase(createDirectConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createDirectConversation.fulfilled,
        (state, action: PayloadAction<{ conversation: Conversation }>) => {
          state.loading = false;
          state.currentConversation = action.payload.conversation;
          // Check if already in list
          if (
            !state.conversations.find(c => c._id === action.payload.conversation._id)
          ) {
            state.conversations.unshift(action.payload.conversation);
          }
        }
      )
      .addCase(createDirectConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create group conversation
    builder
      .addCase(createGroupConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createGroupConversation.fulfilled,
        (state, action: PayloadAction<{ conversation: Conversation }>) => {
          state.loading = false;
          state.conversations.unshift(action.payload.conversation);
          state.currentConversation = action.payload.conversation;
        }
      )
      .addCase(createGroupConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Mark conversation as read
    builder
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const conv = state.conversations.find(c => c._id === action.payload);
        if (conv && conv.unreadCounts) {
          conv.unreadCounts = conv.unreadCounts.filter(
            u => u.userId !== action.payload
          );
        }
      });

    // Leave conversation
    builder
      .addCase(leaveConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          c => c._id !== action.payload
        );
        if (state.currentConversation?._id === action.payload) {
          state.currentConversation = null;
          state.messages = [];
        }
      });
  }
});

export const {
  addMessage,
  receiveMessage,
  setCurrentConversation,
  clearCurrentConversation,
  addTypingUser,
  removeTypingUser,
  clearTypingUsers,
  markMessageAsRead,
  resetChat
} = chatSlice.actions;

export default chatSlice.reducer;
