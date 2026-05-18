'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useChat } from '@/hooks/useChat';
import {
  fetchConversations,
  setCurrentConversation,
  fetchMessages,
  Conversation,
  Message
} from '@/store/chatSlice';
import { AiOutlineSend, AiOutlineSmile, AiOutlinePaperClip, AiOutlinePlus } from 'react-icons/ai';
import { BsSearch } from 'react-icons/bs';

export default function ClientChatPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);
  const {
    conversations,
    currentConversation,
    messages,
    loading
  } = useAppSelector(state => state.chat);

  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const {
    typingUsers,
    isConnected,
    sendConversationMessage,
    emitTypingStart,
    markAsRead
  } = useChat(currentConversation?._id);

  useEffect(() => {
    dispatch(fetchConversations({}));
  }, [dispatch]);

  useEffect(() => {
    if (currentConversation) {
      dispatch(
        fetchMessages({
          conversationId: currentConversation._id,
          page: 1,
          limit: 50
        })
      );
      markAsRead();
    }
  }, [currentConversation, dispatch, markAsRead]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentConversation || !isConnected) return;

    sendConversationMessage(messageInput, 'text', []);
    setMessageInput('');
  };

  // Handle typing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      emitTypingStart();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch(setCurrentConversation(conversation));
  };

  const filteredConversations = conversations.filter((conv: Conversation) => {
    const displayName = conv.isGroup
      ? conv.groupName
      : conv.members.find(m => m._id !== auth.user?._id)?.name || 'Unknown';
    return displayName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getUnreadCount = (conv: Conversation) => {
    const unreadEntry = conv.unreadCounts?.find(u => u.userId === auth.user?._id);
    return unreadEntry?.unreadCount || 0;
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.isGroup) return conv.groupName;
    return conv.members.find(m => m._id !== auth.user?._id)?.name || 'Unknown';
  };

  return (
    <ProtectedRoute allowedRoles={['client', 'coach', 'admin']}>
      <AppShell>
        <div className="flex h-[calc(100vh-8rem)] gap-4 p-4 bg-slate-50 dark:bg-slate-900">
          {/* Conversations Sidebar */}
          <div className="w-80 bg-white dark:bg-slate-800 rounded-lg shadow flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h2 className="text-xl font-bold mb-4">Messages</h2>

              {/* Search bar */}
              <div className="relative mb-3">
                <BsSearch className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* New chat button */}
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
              >
                <AiOutlinePlus /> New Chat
              </button>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="p-4 text-center text-slate-500">Loading...</div>
              )}

              {!loading && filteredConversations.length === 0 && (
                <div className="p-4 text-center text-slate-500">
                  No conversations yet
                </div>
              )}

              {filteredConversations.map((conv: Conversation) => {
                const unreadCount = getUnreadCount(conv);
                const displayName = getConversationName(conv);

                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-3 text-left border-b border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                      currentConversation?._id === conv._id
                        ? 'bg-blue-50 dark:bg-blue-900'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{displayName}</h3>
                      {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full flex-shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {conv.lastMessageText || 'No messages yet'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">
                        {getConversationName(currentConversation)}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-slate-500">No messages yet. Start the conversation!</p>
                    </div>
                  )}

                  {messages.map((msg: Message) => (
                    <div
                      key={msg._id}
                      className={`flex ${
                        msg.sender._id === auth.user?._id
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender._id === auth.user?._id
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                        }`}
                      >
                        {currentConversation.isGroup &&
                          msg.sender._id !== auth.user?._id && (
                            <p className="text-xs font-semibold mb-1">
                              {msg.sender.name}
                            </p>
                          )}
                        <p className="break-words">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString(
                            'en-US',
                            {
                              hour: '2-digit',
                              minute: '2-digit'
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                      <span className="text-sm">
                        {typingUsers.map((u) => u.userName).join(', ')} typing...
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition flex-shrink-0">
                      <AiOutlinePaperClip size={20} />
                    </button>
                    <textarea
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message... (Shift+Enter for newline)"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      rows={3}
                      disabled={!isConnected}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || !isConnected}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center flex-shrink-0"
                    >
                      <AiOutlineSend size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <AiOutlineSmile size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Select a conversation or create a new chat to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
