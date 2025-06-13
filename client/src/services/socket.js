import { io } from "socket.io-client";
import toast from "react-hot-toast";

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.currentChatId = null;
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001";
    this.socketURL = import.meta.env.VITE_SOCKET_URL || this.baseURL;
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  connect(token, userType = {}) {
    // Don't attempt to connect if already connected
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return Promise.resolve();
    }

    // Track whether a connection attempt is in progress
    if (this._connectPromise) {
      console.log(
        "Connection attempt already in progress, returning existing promise"
      );
      return this._connectPromise;
    }

    console.log("Connecting to socket server...");

    // Clean up any existing connection before creating a new one
    this.cleanup();

    this._connectPromise = new Promise((resolve, reject) => {
      try {
        // Get user info from token and userType
        const tokenData = JSON.parse(atob(token.split(".")[1]));
        const isSeller = userType.isSeller === true;

        console.log("Token data:", tokenData);
        console.log("User type:", userType);
        console.log("Connecting as:", isSeller ? "seller" : "buyer");

        // Create socket with improved config
        this.socket = io(this.socketURL, {
          auth: { token },
          transports: ["polling", "websocket"], // Prefer polling first for reliability
          query: { isSeller: String(isSeller) },
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000,
          timeout: 20000,
          forceNew: false, // Don't force new connection
          upgrade: true, // Allow transport upgrades
        });

        // Set up connection handlers
        this.socket.on("connect", () => {
          console.log("Socket connected successfully");
          this.connected = true;
          this._connectPromise = null;

          // Set up event handlers
          this.setupEventListeners();

          // Update status and join chat if needed
          this.emit("user_status", { status: "online" });
          if (this.currentChatId) {
            this.joinChat(this.currentChatId);
          }

          resolve();
        });

        this.socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          this.connected = false;
          this._connectPromise = null;
          reject(error);
        });

        this.socket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          this.connected = false;
          this._connectPromise = null;

          // Only attempt reconnection for certain reasons
          if (reason === "io server disconnect") {
            console.log("Server disconnected, attempting to reconnect...");
            setTimeout(() => {
              if (!this.socket?.connected) {
                this.socket?.connect();
              }
            }, 2000);
          }
        });

        // Add error handler for socket errors
        this.socket.on("error", (error) => {
          console.error("Socket error:", error);
          this.connected = false;
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
        this.cleanup();
        this._connectPromise = null;
        reject(error);
      }
    });

    return this._connectPromise;
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Handle message errors
    this.socket.on("message_error", (error) => {
      console.error("Message error:", error);
      toast.error(error.message || "Failed to send message");
    });

    // Verify authentication
    this.socket.emit(
      "verify_auth",
      { token: this.socket.auth.token },
      (response) => {
        if (response?.error) {
          console.error("Authentication verification failed:", response.error);
          this.cleanup();
          window.dispatchEvent(new CustomEvent("socket_auth_error"));
        }
      }
    );

    // Setup visibility handlers for online status
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("beforeunload", () =>
      this.updateUserStatus("offline")
    );

    // Re-register existing listeners
    for (const [event, callbacks] of this.listeners.entries()) {
      for (const callback of callbacks) {
        this.socket.on(event, callback);
      }
    }
  }

  cleanup() {
    this.connected = false;
    this._connectPromise = null;
    if (this.socket) {
      // Remove event listeners but keep track of our app-level registered listeners
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange
    );
  }

  // Register event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => this.off(event, callback); // Return function to remove listener
  }

  // Remove event listener
  off(event, callback) {
    const callbackSet = this.listeners.get(event);
    if (callbackSet) {
      callbackSet.delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.removeAllListeners(event);
      }
    } else {
      this.listeners.clear();
      if (this.socket) {
        this.socket.removeAllListeners();
      }
    }
  }

  // Convenience methods for common events
  onNewMessage(callback) {
    this.on("new_message", callback);
  }

  onMessageStatus(callback) {
    this.on("message_status", callback);
  }

  onTyping(callback) {
    this.on("typing", callback);
  }

  onMessageEdited(callback) {
    this.on("message_edited", callback);
  }

  onMessageDeleted(callback) {
    this.on("message_deleted", callback);
  }

  onReactionAdded(callback) {
    this.on("reaction_added", callback);
  }

  onReactionRemoved(callback) {
    this.on("reaction_removed", callback);
  }

  onFileUploadProgress(callback) {
    this.on("file_upload_progress", callback);
  }

  onChatArchived(callback) {
    this.on("chat_archived", callback);
  }

  onChatBlocked(callback) {
    this.on("chat_blocked", callback);
  }

  onChatBlockedByOther(callback) {
    this.on("chat_blocked_by_other", callback);
  }

  // Emit event with error handling
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected when trying to emit ${event}`);
      // Don't show errors for non-critical events
      if (
        event !== "user_status" &&
        event !== "typing" &&
        event !== "leave_chat"
      ) {
        toast.error("Connection lost. Please refresh the page.");
      }
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      return false;
    }
  }

  // Send a message
  sendMessage(chatId, message) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        console.warn("Socket not connected when trying to send message");
        reject(new Error("Connection lost. Please try again."));
        return;
      }

      try {
        // Set up one-time listeners for response
        const messageId = message.tempId || `msg-${Date.now()}`;

        const successHandler = (data) => {
          if (data.tempId === messageId || data.messageId === messageId) {
            this.socket.off("message_sent", successHandler);
            this.socket.off("message_error", errorHandler);
            resolve(data);
          }
        };

        const errorHandler = (error) => {
          if (error.tempId === messageId || error.messageId === messageId) {
            this.socket.off("message_sent", successHandler);
            this.socket.off("message_error", errorHandler);
            reject(new Error(error.message || "Failed to send message"));
          }
        };

        // Set up listeners with timeout
        this.socket.on("message_sent", successHandler);
        this.socket.on("message_error", errorHandler);

        // Emit the message
        this.socket.emit("new_message", {
          chatId,
          message: { ...message, tempId: messageId },
        });

        console.log("Message sent via socket:", {
          chatId,
          messageContent: message.content,
          tempId: messageId,
        });

        // Set a timeout for the response
        setTimeout(() => {
          this.socket.off("message_sent", successHandler);
          this.socket.off("message_error", errorHandler);
          resolve({ tempId: messageId, success: true }); // Assume success if no error
        }, 5000);
      } catch (error) {
        console.error("Error sending message:", error);
        reject(error);
      }
    });
  }

  // Edit a message
  editMessage(chatId, messageId, newContent) {
    if (!this.socket?.connected) {
      toast.error("Connection lost. Please try again.");
      return false;
    }

    try {
      this.socket.emit("edit_message", { chatId, messageId, newContent });
      return true;
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Failed to edit message");
      return false;
    }
  }

  // Delete a message
  deleteMessage(chatId, messageId) {
    if (!this.socket?.connected) {
      toast.error("Connection lost. Please try again.");
      return false;
    }

    try {
      this.socket.emit("delete_message", { chatId, messageId });
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
      return false;
    }
  }

  // Add reaction to message
  addReaction(chatId, messageId, emoji) {
    if (!this.socket?.connected) {
      toast.error("Connection lost. Please try again.");
      return false;
    }

    try {
      this.socket.emit("add_reaction", { chatId, messageId, emoji });
      return true;
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
      return false;
    }
  }

  // Remove reaction from message
  removeReaction(chatId, messageId) {
    if (!this.socket?.connected) {
      toast.error("Connection lost. Please try again.");
      return false;
    }

    try {
      this.socket.emit("remove_reaction", { chatId, messageId });
      return true;
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast.error("Failed to remove reaction");
      return false;
    }
  }

  // Send file upload progress
  sendFileUploadProgress(chatId, fileName, progress) {
    if (this.isConnected()) {
      return this.emit("file_upload_progress", { chatId, fileName, progress });
    }
    return false;
  }

  // Archive chat
  archiveChat(chatId) {
    if (!this.socket?.connected) {
      toast.error("Connection lost. Please try again.");
      return false;
    }

    try {
      this.socket.emit("archive_chat", { chatId });
      return true;
    } catch (error) {
      console.error("Error archiving chat:", error);
      toast.error("Failed to archive chat");
      return false;
    }
  }

  // Block chat
  blockChat(chatId) {
    if (!this.socket?.connected) {
      toast.error("Connection lost. Please try again.");
      return false;
    }

    try {
      this.socket.emit("block_chat", { chatId });
      return true;
    } catch (error) {
      console.error("Error blocking chat:", error);
      toast.error("Failed to block chat");
      return false;
    }
  }

  // Update message status
  updateMessageStatus(chatId, messageId, status) {
    if (!this.socket?.connected) {
      return false;
    }

    try {
      this.socket.emit("message_status", { chatId, messageId, status });
      return true;
    } catch (error) {
      console.error("Error updating message status:", error);
      return false;
    }
  }

  // Join a chat room
  joinChat(chatId) {
    return new Promise((resolve, reject) => {
      if (!chatId) {
        reject(new Error("No chat ID provided"));
        return;
      }

      console.log("Joining chat:", chatId);
      this.currentChatId = chatId;

      if (this.isConnected()) {
        try {
          this.socket.emit("join_chat", { chatId });
          console.log("Successfully joined chat:", chatId);
          resolve(true);
        } catch (error) {
          console.error("Error joining chat:", error);
          reject(error);
        }
      } else {
        // If not connected, try to reconnect
        if (this.socket && !this.socket.connected) {
          console.log("Socket disconnected, attempting to reconnect...");
          this.socket.connect();
        }
        reject(new Error("Socket not connected"));
      }
    });
  }

  // Leave a chat room
  leaveChat(chatId) {
    if (!chatId) return false;

    if (this.currentChatId === chatId) {
      this.currentChatId = null;
    }

    if (this.isConnected()) {
      return this.emit("leave_chat", { chatId });
    }
    return false;
  }

  // Disconnect
  disconnect() {
    if (this.socket?.connected) {
      this.updateUserStatus("offline");
    }
    this.cleanup();
  }

  // Check if connected
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  // Send typing indicator
  sendTyping(chatId, isTyping) {
    if (this.isConnected()) {
      return this.emit("typing", { chatId, isTyping });
    }
    return false;
  }

  // Update user status
  updateUserStatus(status) {
    if (this.isConnected()) {
      this.emit("user_status", { status });
    }
  }

  // Handle visibility change
  handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      this.updateUserStatus("online");
    } else {
      this.updateUserStatus("away");
    }
  }
}

export const socketService = new SocketService();
