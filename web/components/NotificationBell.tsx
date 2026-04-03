'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { BsSearch, BsTrash3 } from 'react-icons/bs';
import { FiBell, FiCheck, FiCheckSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    notifications,
    unreadCount,
    loading,
    markAsReadViaSocket,
    markAllAsReadViaSocket,
    handleDelete
  } = useNotifications();

  const filteredNotifications = notifications.filter((notification) =>
    notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markAsReadViaSocket(id);
  };

  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    handleDelete(id);
    toast.success('Notification deleted');
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'border-l-red-500 bg-red-50';
    if (priority === 'high') return 'border-l-orange-500 bg-orange-50';
    if (type === 'message_received') return 'border-l-blue-500 bg-blue-50';
    if (type === 'workout_assigned') return 'border-l-green-500 bg-green-50';
    return 'border-l-gray-300 bg-gray-50';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message_received':
        return '💬';
      case 'workout_assigned':
        return '💪';
      case 'workout_completed':
        return '✅';
      case 'progress_milestone':
        return '🎉';
      case 'reminder':
        return '⏰';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Notifications"
        title={`${unreadCount} unread notifications`}
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Overlay to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsReadViaSocket}
                    className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <FiCheckSquare className="w-4 h-4" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition-all">
                <BsSearch className="text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent ml-2 outline-none w-full text-sm text-gray-700 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin">
                    <FiBell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mt-2">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>
                    {searchQuery
                      ? 'No notifications matching your search'
                      : 'No notifications yet'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-l-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group ${getNotificationColor(
                      notification.type,
                      notification.priority
                    )} ${!notification.isRead ? 'font-medium' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notification.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={(e) =>
                              handleMarkAsRead(e, notification._id)
                            }
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <FiCheck className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) =>
                            handleDeleteNotification(e, notification._id)
                          }
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <BsTrash3 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && !loading && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                <a
                  href="/client/notifications"
                  className="inline-block text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  View All Notifications →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}