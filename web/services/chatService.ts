import api from './api';

const BASE_URL = '/chat';

// Conversations
export const chatService = {
  // Get conversations
  getConversations: async (page = 1, limit = 50) => {
    const { data } = await api.get(`${BASE_URL}/conversation/list`, {
      params: { page, limit }
    });
    return data.data;
  },

  // Get messages in conversation
  getMessages: async (conversationId: string, page = 1, limit = 50) => {
    const { data } = await api.get(
      `${BASE_URL}/conversation/${conversationId}/messages`,
      {
        params: { page, limit }
      }
    );
    return data.data;
  },

  // Create direct conversation
  createDirectConversation: async (otherUserId: string) => {
    const { data } = await api.post(`${BASE_URL}/conversation/create-direct`, {
      otherUserId
    });
    return data.data;
  },

  // Create group conversation
  createGroup: async (groupName: string, memberIds: string[]) => {
    const { data } = await api.post(`${BASE_URL}/conversation/create-group`, {
      groupName,
      memberIds
    });
    return data.data;
  },

  // Mark conversation as read
  markConversationRead: async (conversationId: string) => {
    const { data } = await api.put(
      `${BASE_URL}/conversation/${conversationId}/mark-read`
    );
    return data;
  },

  // Toggle mute
  toggleMute: async (conversationId: string) => {
    const { data } = await api.put(
      `${BASE_URL}/conversation/${conversationId}/mute`
    );
    return data;
  },

  // Leave conversation
  leaveConversation: async (conversationId: string) => {
    const { data } = await api.delete(
      `${BASE_URL}/conversation/${conversationId}`
    );
    return data;
  },

  // Old direct message endpoints (backward compatibility)
  getConversationMessages: async (userId: string, page = 1, limit = 50) => {
    const { data } = await api.get(`${BASE_URL}/messages/${userId}`, {
      params: { page, limit }
    });
    return data.data;
  },

  sendDirectMessage: async (receiver: string, content: string) => {
    const { data } = await api.post(`${BASE_URL}/messages`, {
      receiver,
      content,
      messageType: 'text'
    });
    return data.data;
  },

  markMessageRead: async (messageId: string) => {
    const { data } = await api.put(`${BASE_URL}/messages/${messageId}/read`);
    return data;
  },

  deleteMessage: async (messageId: string) => {
    const { data } = await api.delete(`${BASE_URL}/messages/${messageId}`);
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get(`${BASE_URL}/unread-count`);
    return data.data;
  }
};
