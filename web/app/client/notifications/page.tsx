'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/notificationService';
import { FiBell, FiFilter, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { BsSearch } from 'react-icons/bs';
import toast from 'react-hot-toast';

interface FilterState {
  isRead: 'all' | 'read' | 'unread';
  type: string;
  category: string;
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsReadViaSocket,
    markAllAsReadViaSocket,
    handleDelete
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterState>({
    isRead: 'all',
    type: '',
    category: ''
  });
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRead =
      filter.isRead === 'all' ||
      (filter.isRead === 'read' && notification.isRead) ||
      (filter.isRead === 'unread' && !notification.isRead);

    const matchesType = !filter.type || notification.type === filter.type;
    const matchesCategory = !filter.category || notification.category === filter.category;

    return matchesSearch && matchesRead && matchesType && matchesCategory;
  });

  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n._id)));
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      for (const id of selectedNotifications) {
        markAsReadViaSocket(id);
      }
      setSelectedNotifications(new Set());
      toast.success('Marked selected as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedNotifications) {
        handleDelete(id);
      }
      setSelectedNotifications(new Set());
      toast.success('Deleted selected notifications');
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      message_received: '💬',
      workout_assigned: '💪',
      workout_completed: '✅',
      progress_milestone: '🎉',
      reminder: '⏰',
      system_announcement: '📢'
    };
    return icons[type] || '📢';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiBell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsReadViaSocket}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Search Bar */}
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 mb-4 focus-within:ring-2 focus-within:ring-blue-400 transition-all">
            <BsSearch className="text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent ml-3 outline-none w-full text-gray-700 placeholder-gray-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Read Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiFilter className="inline mr-2" />
                Status
              </label>
              <select
                value={filter.isRead}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    isRead: e.target.value as FilterState['isRead']
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Types</option>
                <option value="message_received">Messages</option>
                <option value="workout_assigned">Workouts</option>
                <option value="progress_milestone">Progress</option>
                <option value="reminder">Reminders</option>
                <option value="system_announcement">System</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Categories</option>
                <option value="social">Social</option>
                <option value="workout">Workout</option>
                <option value="progress">Progress</option>
                <option value="reminder">Reminder</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedNotifications.size === filteredNotifications.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedNotifications.size} selected
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkMarkAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300"
              >
                <FiCheckCircle className="w-4 h-4" />
                Mark as Read
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-red-600 rounded-lg font-medium transition-colors border border-gray-300"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="inline-block animate-spin mb-4">
                <FiBell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery || filter.isRead !== 'all' || filter.type || filter.category
                  ? 'No notifications matching your filters'
                  : 'No notifications yet'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-200 hover:shadow-md transition-all cursor-pointer ${
                  !notification.isRead ? 'border-l-blue-600 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification._id)}
                    onChange={() => handleSelectNotification(notification._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 mt-1 text-blue-600 rounded"
                  />

                  {/* Icon */}
                  <span className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={`font-semibold text-gray-900 ${
                            !notification.isRead ? 'font-bold' : ''
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {notification.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                        {new Date(notification.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsReadViaSocket(notification._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <FiCheckCircle className="w-5 h-5 text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleDelete(notification._id);
                        toast.success('Notification deleted');
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-5 h-5 text-gray-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
