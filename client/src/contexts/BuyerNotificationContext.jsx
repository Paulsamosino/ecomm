import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";

const BuyerNotificationContext = createContext();

export const useBuyerNotifications = () => {
  return useContext(BuyerNotificationContext);
};

export const BuyerNotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.id || user.isSeller) return;

    // Clean up previous connection if it exists
    if (socketRef.current) {
      console.log('🧹 Cleaning up previous socket connection');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Avoid creating multiple connections
    if (socketRef.current) return;

    // Connect to Socket.IO for real-time notifications
    console.log('🔌 Creating new socket connection for user:', user.id);
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      forceNew: true, // Force a new connection to prevent reuse issues
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔔 Socket.IO connected for buyer notifications');
      // Join buyer room
      socket.emit('join_room', { 
        userId: user.id,
        userType: 'buyer'
      });
    });

    socket.on('joined_room', (data) => {
      console.log('🔔 Joined notification room:', data);
    });

    socket.on('new_notification', (data) => {
      console.log('🔔 Received new notification:', data);
      if (data.type === 'new_notification') {
        const notification = data.notification;
        // Check if notification already exists to prevent duplicates
        setNotifications((prev) => {
          const exists = prev.some((n) => n._id === notification._id);
          if (exists) {
            console.log('🔄 Duplicate notification ignored:', notification._id);
            return prev;
          }
          console.log('✅ Adding new notification:', notification._id);
          return [notification, ...prev];
        });
        
        // Only increment unread count if notification was actually added
        setUnreadCount((prev) => prev + 1);
      }
    });

    socket.on('notification_count_update', (data) => {
      console.log('🔔 Received count update:', data);
      if (data.type === 'notification_count_update') {
        setUnreadCount(data.unreadCount);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('🔔 Socket.IO connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔔 Socket.IO disconnected:', reason);
    });

    // Load initial notifications using existing API
    const loadNotifications = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        } else {
          console.error('Failed to load notifications:', response.status, response.statusText);
        }
      } catch (error) {
        console.error("Failed to load buyer notifications:", error);
      }
    };

    loadNotifications();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, user?.isSeller]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark buyer notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true }))
        );

        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all buyer notifications as read:", error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };

  return (
    <BuyerNotificationContext.Provider value={value}>
      {children}
    </BuyerNotificationContext.Provider>
  );
};
