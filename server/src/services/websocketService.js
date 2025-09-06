const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socket.id mapping
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle authentication and room joining
      socket.on('join_room', async (data) => {
        try {
          const { userId, userType } = data;
          
          if (!userId) {
            console.error('No userId provided for room join');
            return;
          }

          // Store user-socket mapping
          this.userSockets.set(userId, socket.id);
          
          // Join user-specific room
          const roomName = `user:${userId}`;
          await socket.join(roomName);
          
          console.log(`User ${userId} (${userType}) joined room: ${roomName}`);
          
          // Send confirmation
          socket.emit('room_joined', { 
            success: true, 
            roomName,
            userType 
          });

        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('room_joined', { 
            success: false, 
            error: error.message 
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Remove from user-socket mapping
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            console.log(`Removed user ${userId} from socket mapping`);
            break;
          }
        }
      });

      // Handle ping for connection testing
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    console.log('WebSocket service initialized');
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    if (!this.io) {
      console.error('WebSocket service not initialized');
      return;
    }

    const roomName = `user:${userId}`;
    this.io.to(roomName).emit('new_notification', {
      type: 'new_notification',
      notification
    });

    console.log(`Notification sent to user ${userId}:`, notification.title);
  }

  // Update unread count for user
  updateUnreadCount(userId, unreadCount) {
    if (!this.io) {
      console.error('WebSocket service not initialized');
      return;
    }

    const roomName = `user:${userId}`;
    this.io.to(roomName).emit('notification_count_update', {
      type: 'notification_count_update',
      unreadCount
    });

    console.log(`Unread count updated for user ${userId}: ${unreadCount}`);
  }

  // Send order update to user
  sendOrderUpdate(userId, orderData) {
    if (!this.io) {
      console.error('WebSocket service not initialized');
      return;
    }

    const roomName = `user:${userId}`;
    this.io.to(roomName).emit('order_update', {
      type: 'order_update',
      order: orderData
    });

    console.log(`Order update sent to user ${userId}:`, orderData.status);
  }

  // Broadcast system announcement
  broadcastSystemAnnouncement(message) {
    if (!this.io) {
      console.error('WebSocket service not initialized');
      return;
    }

    this.io.emit('system_announcement', {
      type: 'system_announcement',
      message
    });

    console.log('System announcement broadcasted:', message);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }
}

// Export singleton instance
module.exports = new WebSocketService();
