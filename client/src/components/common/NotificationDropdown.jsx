import React from "react";
import { Link } from "react-router-dom";
import { X, Check, CheckCheck } from "lucide-react";
import { useBuyerNotifications } from "@/contexts/BuyerNotificationContext";

const NotificationDropdown = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useBuyerNotifications();

  // Add placeholder functions for missing methods
  const removeNotification = (id) => {
    console.log('Remove notification not implemented:', id);
  };

  const addTestNotification = () => {
    console.log('Add test notification not implemented');
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      order: '📦',
      payment: '💳',
      delivery: '🚚',
      message: '💬',
      system: '🔔',
      default: '📋'
    };
    return iconMap[type] || iconMap.default;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {unreadCount > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>No notifications yet</p>
            <p className="text-sm mt-1">We'll notify you when something important happens</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                {notification.actionUrl ? (
                  <Link
                    to={notification.actionUrl}
                    onClick={() => handleNotificationClick(notification)}
                    className="block"
                  >
                    <NotificationContent 
                      notification={notification}
                      getNotificationIcon={getNotificationIcon}
                      formatTimeAgo={formatTimeAgo}
                    />
                  </Link>
                ) : (
                  <div onClick={() => handleNotificationClick(notification)}>
                    <NotificationContent 
                      notification={notification}
                      getNotificationIcon={getNotificationIcon}
                      formatTimeAgo={formatTimeAgo}
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        markAsRead(notification._id);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      removeNotification(notification._id);
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Remove notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <Link
            to="/buyer-dashboard/notifications"
            className="text-sm text-blue-600 hover:text-blue-800 block text-center"
            onClick={onClose}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

const NotificationContent = ({ notification, getNotificationIcon, formatTimeAgo }) => {
  return (
    <div className="flex items-start gap-3 pr-8">
      <div className="text-2xl flex-shrink-0">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium ${
          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
        }`}>
          {notification.title}
        </h4>
        <p className={`text-sm mt-1 ${
          !notification.isRead ? 'text-gray-700' : 'text-gray-500'
        }`}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default NotificationDropdown;
