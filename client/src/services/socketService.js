import io from "socket.io-client";
import { API_URL } from "@/config/constants";

class SocketService {
  constructor() {
    this.socket = null;
    this.connectPromise = null;
  }

  getSocket() {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.connectPromise) {
      console.log("Connection attempt in progress, returning existing promise");
      return this.socket;
    }

    this.socket = io(API_URL, {
      auth: {
        token: localStorage.getItem("token"),
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected");
      this.connectPromise = null;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.connectPromise = null;
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.connectPromise = null;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectPromise = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
