import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { SOCKET_URL } from "@/config/constants";

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.currentChatId = null;
    this.baseURL = SOCKET_URL;
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
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

    // Only log connection attempts in development
    if (import.meta.env.MODE !== "production") {
      console.log("Connecting to socket server:", this.baseURL);
    }

    // Clean up any existing connection before creating a new one
    this.cleanup();

    this._connectPromise = new Promise((resolve, reject) => {
      try {
        // Get user info from token and userType
        const tokenData = JSON.parse(atob(token.split(".")[1]));
        const isSeller = userType.isSeller === true;

        // Only log in development mode
        if (import.meta.env.MODE !== "production") {
          console.log("Token data:", tokenData);
          console.log("User type:", userType);
          console.log("Connecting as:", isSeller ? "seller" : "buyer");
        }

        // Create socket with production optimized config
        this.socket = io(this.baseURL, {
          auth: { token },
          transports: ["websocket", "polling"], // Allow both for better reliability
          query: { isSeller: String(isSeller) },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          timeout: 20000, // Increased timeout for production environments
          forceNew: true,
        });

        // Set up connection handlers
        this.socket.on("connect", () => {
          if (import.meta.env.MODE !== "production") {
            console.log("Socket connected successfully");
          }
          this.connected = true;
          this._connectPromise = null;
          this.reconnectAttempts = 0;

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
          if (import.meta.env.MODE !== "production") {
            console.error("Socket connection error:", error);
          } else {
            console.error("Socket connection error occurred");
          }

          this.connected = false;
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            toast.error(
              "Unable to establish real-time connection. Chat functionality may be limited."
            );
            this._connectPromise = null;
          }

          reject(error);
        });

        this.socket.on("disconnect", (reason) => {
          if (import.meta.env.MODE !== "production") {
            console.log("Socket disconnected:", reason);
          }
          this.connected = false;

          if (
            reason === "io server disconnect" ||
            reason === "transport close"
          ) {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              if (import.meta.env.MODE !== "production") {
                console.log("Attempting to reconnect...");
              }

              setTimeout(() => {
                this.socket.connect();
                this.reconnectAttempts++;
              }, 1000);
            } else {
              this._connectPromise = null;
            }
          }
        });
      } catch (error) {
        if (import.meta.env.MODE !== "production") {
          console.error("Error initializing socket:", error);
        } else {
          console.error("Error initializing socket connection");
        }

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
    if (!this.socket?.connected) {
      toast.error("Connection lost. Please try again.");
      return false;
    }

    try {
      this.socket.emit("new_message", { chatId, message });
      console.log("Message sent via socket:", {
        chatId,
        messageContent: message.content,
      });
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
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
    if (!chatId) return false;

    console.log("Joining chat:", chatId);
    this.currentChatId = chatId;

    if (this.isConnected()) {
      return this.emit("join_chat", { chatId });
    }

    // If not connected, try to reconnect
    if (this.socket && !this.socket.connected) {
      console.log("Socket disconnected, attempting to reconnect...");
      this.socket.connect();
    }

    return false;
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
