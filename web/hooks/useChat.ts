import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  receiveMessage,
  markMessageAsRead,
  Message
} from '@/store/chatSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

interface TypingEvent { userId: string; userName: string }
interface ReadEvent { messageId: string }
interface MessageEvent { message: Message }

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

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

  return { socket, isConnected };
};

export const useChat = (conversationId?: string) => {
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<
    { userId: string; userName: string }[]
  >([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const conversationTypingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const messages = useAppSelector(state => state.chat.messages);

  useEffect(() => {
    if (socket && isConnected && conversationId) {
      socket.emit('join_conversation', { conversationId });

      return () => {
        socket?.emit('leave_conversation', { conversationId });
      };
    }
  }, [socket, isConnected, conversationId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: MessageEvent) => {
      dispatch(receiveMessage(data.message));
    };

    const handleTypingStarted = (data: TypingEvent) => {
      setTypingUsers((prev) => {
        if (prev.find((u) => u.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, userName: data.userName }];
      });
    };

    const handleTypingStopped = (data: TypingEvent) => {
      setTypingUsers((prev) =>
        prev.filter((u) => u.userId !== data.userId)
      );
    };

    const handleMessageRead = (data: ReadEvent) => {
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

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      dispatch(receiveMessage(message));
    };

    const handleTypingStarted = (data: TypingEvent) => {
      setTypingUsers((prev) => {
        if (prev.find((u) => u.userId === data.userId)) return prev;
        return [
          ...prev,
          { userId: data.userId, userName: data.userName }
        ];
      });
    };

    const handleTypingStopped = (data: TypingEvent) => {
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

  const sendConversationMessage = useCallback(
    (content: string, messageType = 'text', attachments: unknown[] = []) => {
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
