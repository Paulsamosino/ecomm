import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { axiosInstance } from "@/contexts/axios";
import { socketService } from "@/services/socket";
import {
  MessageSquare,
  Loader2,
  Send,
  X,
  ImageIcon,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import toast from "react-hot-toast";

const MESSAGE_STATUS = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
};

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    const initSocket = async () => {
      try {
        await socketService.connect(token);
        setSocketConnected(true);
        setError(null);
      } catch (err) {
        console.error("Socket connection error:", err);
        setSocketConnected(false);
        setError("Failed to connect to chat server");
      }
    };

    initSocket();

    return () => {
      if (chat?._id) {
        socketService.leaveChat(chat._id);
      }
      socketService.disconnect();
    };
  }, [user]);

  // Set up message listeners
  useEffect(() => {
    if (!socketConnected) return;

    const handleNewMessage = (data) => {
      if (data.chatId === chat?._id) {
        setMessages((prev) => {
          const messageExists = prev.some(
            (msg) =>
              msg._id === data.message._id ||
              (msg._id.startsWith("temp-") &&
                msg.content === data.message.content)
          );
          if (messageExists) return prev;
          return [...prev, data.message];
        });

        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.off("new_message", handleNewMessage);
    };
  }, [socketConnected, chat, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset unread count when opening chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const initializeChat = async (sellerId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post("/chat/initialize", {
        sellerId,
      });
      setChat(response.data);
      setMessages(response.data.messages || []);

      if (socketConnected) {
        socketService.joinChat(response.data._id);
      }
    } catch (err) {
      console.error("Error initializing chat:", err);
      setError("Failed to initialize chat");
      toast.error("Failed to initialize chat");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat?._id || sending) return;

    if (!socketConnected) {
      toast.error("Chat connection is offline");
      return;
    }

    setSending(true);
    try {
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        content: newMessage,
        senderId: user._id,
        createdAt: new Date(),
        status: MESSAGE_STATUS.SENT,
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      const response = await axiosInstance.post(`/chat/${chat._id}/messages`, {
        content: newMessage,
        senderId: user._id,
      });

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? response.data : msg))
      );
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((msg) => !msg._id.startsWith("temp-")));
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file || !chat?._id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await axiosInstance.post(
        "/upload/image",
        formData
      );
      const imageUrl = uploadResponse.data.url;

      const response = await axiosInstance.post(`/chat/${chat._id}/messages`, {
        content: "",
        image: imageUrl,
        senderId: user._id,
      });

      setMessages((prev) => [...prev, response.data]);
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Failed to upload image");
    } finally {
      setSending(false);
    }
  };

  // Hide chat widget for sellers
  if (user?.isSeller || user?.role === "seller") {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          if (!user) {
            window.location.href = "/login";
            return;
          }
          if (!socketConnected) {
            toast.error("Chat is currently offline. Trying to reconnect...");
            const token = localStorage.getItem("token");
            if (token) {
              socketService.connect(token).catch(() => {});
            }
            return;
          }
          setIsOpen(true);
        }}
        className="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
      >
        <MessageSquare className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg z-50">
      <div className="p-3 border-b flex items-center justify-between bg-primary text-white rounded-t-lg">
        <span className="font-medium">Chat</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setChat(null);
            }}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-96">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading chat...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-500 mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  const token = localStorage.getItem("token");
                  if (token) {
                    socketService.connect(token).catch(() => {});
                  }
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((message, index) => (
                <div
                  key={message._id || index}
                  className={`flex ${
                    message.senderId === user._id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-2 ${
                      message.senderId === user._id
                        ? "bg-primary text-white"
                        : "bg-white border"
                    }`}
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Message attachment"
                        className="rounded-lg max-w-full max-h-[200px] object-contain mb-1"
                        onClick={() => window.open(message.image, "_blank")}
                      />
                    )}
                    {message.content && (
                      <p className="break-words">{message.content}</p>
                    )}
                    <span
                      className={`text-[10px] ${
                        message.senderId === user._id
                          ? "text-white/70"
                          : "text-gray-500"
                      }`}
                    >
                      {format(new Date(message.createdAt), "HH:mm")}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-2 border-t bg-white"
            >
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="chat-image-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    document.getElementById("chat-image-upload").click()
                  }
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    socketConnected ? "Type a message..." : "Chat is offline"
                  }
                  className="flex-1"
                  disabled={!socketConnected || sending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!socketConnected || !newMessage.trim() || sending}
                  className={`${
                    !socketConnected
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
