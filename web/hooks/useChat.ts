import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addMessage,
  receiveMessage,
  addTypingUser,
  removeTypingUser,
  markMessageAsRead
} from '@/store/chatSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    if (!socket && token) {
      socket = io(API_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });
    }

    return () => {
      // Don't disconnect on unmount to keep connection alive
    };
  }, []);

  return { socket: socketRef.current || socket, isConnected };
};

export const useChat = (conversationId?: string) => {
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<
    { userId: string; userName: string }[]
  >([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const conversationTypingTimeoutRef = useRef<NodeJS.Timeout>();

  const messages = useAppSelector(state => state.chat.messages);
  const currentConversation = useAppSelector(state => state.chat.currentConversation);

  // Join conversation room
  useEffect(() => {
    if (socket && isConnected && conversationId) {
      socket.emit('join_conversation', { conversationId });

      return () => {
        socket?.emit('leave_conversation', { conversationId });
      };
    }
  }, [socket, isConnected, conversationId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      dispatch(receiveMessage(data.message));
    };

    const handleTypingStarted = (data: any) => {
      setTypingUsers((prev) => {
        if (prev.find((u) => u.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, userName: data.userName }];
      });
    };

    const handleTypingStopped = (data: any) => {
      setTypingUsers((prev) =>
        prev.filter((u) => u.userId !== data.userId)
      );
    };

    const handleMessageRead = (data: any) => {
      dispatch(markMessageAsRead(data.messageId));
    };

    socket.on('new_conversation_message', handleNewMessage);
    socket.on('user_typing', handleTypingStarted);
    socket.on('user_stopped_typing', handleTypingStopped);
    socket.on('conversation_marked_read', handleMessageRead);

    return () => {
      socket.off('new_conversation_message', handleNewMessage);
      socket.off('user_typing', handleTypingStarted);
      socket.off('user_stopped_typing', handleTypingStopped);
      socket.off('conversation_marked_read', handleMessageRead);
    };
  }, [socket, dispatch]);

  // Direct message events (for backward compatibility)
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      dispatch(receiveMessage(message));
    };

    const handleTypingStarted = (data: any) => {
      setTypingUsers((prev) => {
        if (prev.find((u) => u.userId === data.userId)) return prev;
        return [
          ...prev,
          { userId: data.userId, userName: data.userName }
        ];
      });
    };

    const handleTypingStopped = (data: any) => {
      setTypingUsers((prev) =>
        prev.filter((u) => u.userId !== data.userId)
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing_started', handleTypingStarted);
    socket.on('typing_stopped', handleTypingStopped);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing_started', handleTypingStarted);
      socket.off('typing_stopped', handleTypingStopped);
    };
  }, [socket, dispatch]);

  // Send conversation message
  const sendConversationMessage = useCallback(
    (content: string, messageType = 'text', attachments: any[] = []) => {
      if (!socket || !isConnected || !conversationId) {
        console.error('Socket not ready or no conversation');
        return;
      }

      socket.emit('send_conversation_message', {
        conversationId,
        content,
        messageType,
        attachments
      });
    },
    [socket, isConnected, conversationId]
  );

  // Send direct message (backward compatibility)
  const sendMessage = useCallback(
    (content: string, receiverId: string) => {
      if (!socket || !isConnected) {
        console.error('Socket not connected');
        return;
      }

      socket.emit('send_message', { receiverId, content });
    },
    [socket, isConnected]
  );

  // Typing indicator for conversation
  const emitTypingStart = useCallback(() => {
    if (!socket || !isConnected || !conversationId) return;

    socket.emit('typing_start_conversation', { conversationId });

    if (conversationTypingTimeoutRef.current) {
      clearTimeout(conversationTypingTimeoutRef.current);
    }

    conversationTypingTimeoutRef.current = setTimeout(() => {
      socket?.emit('typing_stop_conversation', { conversationId });
    }, 3000);
  }, [socket, isConnected, conversationId]);

  // Typing indicator for direct messages
  const emitDirectTyping = useCallback(
    (receiverId: string) => {
      if (!socket || !isConnected) return;

      socket.emit('typing_start', { receiverId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket?.emit('typing_stop', { receiverId });
      }, 3000);
    },
    [socket, isConnected]
  );

  // Mark messages as read
  const markAsRead = useCallback(() => {
    if (!socket || !isConnected || !conversationId) return;

    socket.emit('mark_conversation_read', { conversationId });
  }, [socket, isConnected, conversationId]);

  return {
    messages,
    typingUsers,
    isConnected,
    sendConversationMessage,
    sendMessage,
    emitTypingStart,
    emitDirectTyping,
    markAsRead
  };
};

