import React from "react";
import { useBuyerNotifications } from "@/contexts/BuyerNotificationContext";
import { Link } from "react-router-dom";

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useBuyerNotifications();

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
            >
              Mark all read
            </button>
          )}
          <Link to="/buyer-dashboard" className="text-sm text-gray-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border overflow-hidden">
        {notifications?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No notifications yet</p>
            <p className="text-sm mt-2">We'll notify you when something important happens.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {notifications.map((n) => (
              <li key={n._id} className={`p-4 flex items-start justify-between ${!n.isRead ? 'bg-blue-50' : ''}`}>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{n.title}</h3>
                  <p className="text-sm text-gray-700 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatTimeAgo(n.createdAt)}</p>
                </div>

                <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-2">
                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n._id)}
                      className="text-sm px-2 py-1 bg-white border rounded text-blue-600"
                    >
                      Mark read
                    </button>
                  )}
                  {n.actionUrl && (
                    <Link to={n.actionUrl} className="text-sm text-gray-600 hover:underline">View</Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
