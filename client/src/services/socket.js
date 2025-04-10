import { io } from "socket.io-client";
import toast from "react-hot-toast";

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connecting = false;
    this.connectionAttempts = 0;
    this.maxReconnectionAttempts = 5;
    this.pendingListeners = new Map();
    this.activeListeners = new Map();
    this.currentChatId = null;
    this.reconnectTimerId = null;
    this.processingMessageIds = new Set(); // Add tracking for messages being processed
  }

  async connect(token) {
    if (this.connected || this.connecting) return;

    try {
      this.connecting = true;

      console.log("Connecting to socket server...");
      const socketServerUrl =
        import.meta.env.VITE_SOCKET_URL ||
        (window.location.hostname.includes("chickenpoultry.shop")
          ? "https://api.chickenpoultry.shop" // Changed from wss:// to https://
          : "http://localhost:3001");

      this.socket = io(socketServerUrl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectionAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ["websocket"], // Try WebSocket first
        autoConnect: false, // Prevent auto-connection
        path: "/socket.io/",
        withCredentials: true,
        forceNew: true,
      });

      this.socket.on("connect", () => {
        console.log("Socket connected successfully");
        this.connected = true;
        this.connecting = false;
        this.connectionAttempts = 0;

        // Set up listeners that were registered before connection
        this.setupPendingListeners();

        // Update user status to online
        this.emit("user_status", { status: "online" });

        // Rejoin current chat if any
        if (this.currentChatId) {
          this.joinChat(this.currentChatId);
        }

        // Clear any pending reconnect timers
        if (this.reconnectTimerId) {
          clearTimeout(this.reconnectTimerId);
          this.reconnectTimerId = null;
        }
      });

      // Handle transport errors specifically
      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
        this.connected = false;
        this.connectionAttempts++;

        if (
          error.message === "Authentication error" ||
          error.message === "User not found"
        ) {
          this.connecting = false;
          toast.error("Authentication failed. Please try logging in again.");
          window.dispatchEvent(new CustomEvent("socket_auth_error"));
        } else if (this.connectionAttempts >= this.maxReconnectionAttempts) {
          this.connecting = false;
          toast.error("Unable to connect to chat. Please refresh the page.");
        } else {
          // On first error, try falling back to polling
          if (this.connectionAttempts === 1) {
            console.log("Retrying with polling transport...");
            this.socket.io.opts.transports = ["polling", "websocket"];
          }

          // Don't show too many error toasts
          if (this.connectionAttempts === 1) {
            toast.error("Connection error. Retrying...");
          }

          // Schedule a reconnect attempt
          this.reconnectTimerId = setTimeout(() => {
            this.connect(token);
          }, 2000 * this.connectionAttempts);
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        this.connected = false;
        this.connecting = false;
        this.clearListeners();

        // Emit offline status before disconnecting
        if (reason === "io client disconnect") {
          this.socket.emit("user_status", { status: "offline" });
        }

        if (reason === "io server disconnect") {
          // Schedule a reconnect attempt
          this.reconnectTimerId = setTimeout(() => {
            this.connect(token);
          }, 2000);
        }
      });

      this.socket.on("reconnect", (attempt) => {
        console.log(`Socket reconnected after ${attempt} attempts`);
        this.connected = true;
        this.connecting = false;
        this.connectionAttempts = 0;
        this.setupPendingListeners();
      });

      // Handle message errors
      this.socket.on("message_error", (error) => {
        console.error("Message error:", error);
        toast.error(error.message || "Failed to send message");
      });

      // Add online status event listener
      this.socket.on("user_status", (data) => {
        console.log("User status update:", data);
        // Forward the event to any registered listeners
        this.emitToListeners("user_status", data);
      });

      // Setup visibility change handler to update status
      document.addEventListener(
        "visibilitychange",
        this.handleVisibilityChange.bind(this)
      );
      window.addEventListener("beforeunload", () => {
        this.updateUserStatus("offline");
      });
    } catch (error) {
      console.error("Error initializing socket:", error);
      this.connected = false;
      this.connecting = false;
      toast.error("Failed to initialize chat connection");
    }
  }

  setupPendingListeners() {
    if (!this.socket?.connected) return;

    this.pendingListeners.forEach((callbacks, event) => {
      if (!this.activeListeners.has(event)) {
        this.activeListeners.set(event, new Set());
      }

      callbacks.forEach((callback) => {
        this.activeListeners.get(event).add(callback);
        this.socket.on(event, callback);
      });
    });
  }

  clearListeners() {
    if (!this.socket) return;

    this.activeListeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket.off(event, callback);
      });
    });

    this.activeListeners.clear();
  }

  removeAllListeners() {
    this.clearListeners();
    this.pendingListeners.clear();
  }

  // Helper to emit events to registered listeners
  emitToListeners(event, data) {
    const callbacks = this.activeListeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  on(event, callback) {
    if (!this.pendingListeners.has(event)) {
      this.pendingListeners.set(event, new Set());
    }
    this.pendingListeners.get(event).add(callback);

    if (this.socket?.connected) {
      if (!this.activeListeners.has(event)) {
        this.activeListeners.set(event, new Set());
      }
      this.activeListeners.get(event).add(callback);
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    this.pendingListeners.get(event)?.delete(callback);
    this.activeListeners.get(event)?.delete(callback);
    if (this.socket?.connected) {
      this.socket.off(event, callback);
    }
  }

  // Chat events
  onNewMessage(callback) {
    this.on("new_message", callback);
  }

  onMessageStatus(callback) {
    this.on("message_status", callback);
  }

  onTyping(callback) {
    this.on("typing", callback);
  }

  // Emit events with connection check and error handling
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected when trying to emit ${event}`);
      // For non-critical events, just return false instead of showing an error
      if (event !== "user_status" && event !== "typing") {
        toast.error("Connection lost. Please refresh the page.");
      }
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      toast.error("Failed to send message. Please try again.");
      return false;
    }
  }

  // Send a new message
  sendMessage(chatId, message) {
    console.log("Sending message:", { chatId, message });

    // Don't send duplicates
    if (this.processingMessageIds.has(message._id)) {
      console.warn("Duplicate message send attempt prevented:", message._id);
      return false;
    }

    // Track that we're processing this message
    this.processingMessageIds.add(message._id);

    // Remove from processing set after a timeout (5 seconds)
    setTimeout(() => {
      this.processingMessageIds.delete(message._id);
    }, 5000);

    return this.emit("new_message", { chatId, message });
  }

  // Update message status
  updateMessageStatus(chatId, messageId, status) {
    return this.emit("message_status", { chatId, messageId, status });
  }

  // Send typing status
  sendTyping(chatId, isTyping) {
    return this.emit("typing", { chatId, isTyping });
  }

  // Join a chat room
  joinChat(chatId) {
    console.log("Joining chat:", chatId);
    this.currentChatId = chatId;
    return this.emit("join_chat", { chatId });
  }

  // Leave a chat room
  leaveChat(chatId) {
    console.log("Leaving chat:", chatId);
    if (this.currentChatId === chatId) {
      this.currentChatId = null;
    }
    return this.emit("leave_chat", { chatId });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.updateUserStatus("offline");
      this.socket.disconnect();
      this.connected = false;
      document.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
    }
  }

  // Check connection status
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  isConnecting() {
    return this.connecting;
  }

  // Add method to update user status
  updateUserStatus(status) {
    if (this.isConnected()) {
      this.emit("user_status", { status });
    }
  }

  // Add visibility change handler
  handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      this.updateUserStatus("online");
    } else {
      this.updateUserStatus("away");
    }
  }
}

export const socketService = new SocketService();
