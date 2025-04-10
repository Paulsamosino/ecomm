import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { axiosInstance } from "@/contexts/axios";
import { socketService } from "@/services/socket";
import {
  MessageSquare,
  Loader2,
  Send,
  User,
  Clock,
  Search,
  ArrowLeft,
  MoreVertical,
  Phone,
  Video,
  Info,
  AlertCircle,
  ChevronLeft,
  Image as ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import toast from "react-hot-toast";

// Helper function to normalize user ID
const normalizeUserId = (user) => {
  if (!user) return null;
  return user._id || user.id || (typeof user === "string" ? user : null);
};

// Helper function to compare IDs safely
const compareIds = (id1, id2) => {
  if (!id1 || !id2) {
    return false;
  }

  // Convert to strings for comparison
  const strId1 = typeof id1 === "object" ? String(id1) : String(id1);
  const strId2 = typeof id2 === "object" ? String(id2) : String(id2);

  return strId1 === strId2;
};

// Standardize message status constants to match server (uppercase)
const MESSAGE_STATUS = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
};

const SellerMessages = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const messagesEndRef = useRef();
  const inputRef = useRef(null);

  // Enhanced authentication check
  useEffect(() => {
    const token = localStorage.getItem("token");

    // Only redirect if we're sure about the auth state
    if (!authLoading) {
      if (!token) {
        navigate("/login");
        return;
      }
    }
  }, [authLoading, navigate]);

  // Set up socket connection with proper authentication
  useEffect(() => {
    if (authLoading || !user) return;

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    // Initialize socket connection
    socketService.connect(token);

    // Set up socket event listeners
    const handleNewMessage = (data) => {
      if (data.chatId === chatId) {
        // Always update the messages array with new messages
        setMessages((prev) => {
          // Check if the message already exists to prevent duplicates
          const messageExists = prev.some(
            (msg) =>
              msg._id === data.message._id ||
              (msg._id.startsWith("temp-") &&
                msg.content === data.message.content)
          );
          if (messageExists) return prev;
          return [...prev, data.message];
        });

        // Mark message as delivered if it's not from the current user
        if (data.message.senderId !== normalizeUserId(user)) {
          socketService.updateMessageStatus(
            chatId,
            data.message._id,
            MESSAGE_STATUS.DELIVERED
          );
        }
      }

      // Update last message in chat list
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === data.chatId
            ? {
                ...chat,
                lastMessage: data.message,
                unreadCount:
                  chat._id !== chatId &&
                  data.message.senderId !== normalizeUserId(user)
                    ? (chat.unreadCount || 0) + 1
                    : chat.unreadCount || 0,
              }
            : chat
        )
      );
    };

    const handleMessageStatus = (data) => {
      if (data.chatId === chatId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, status: data.status } : msg
          )
        );
      }
    };

    const handleUserStatus = ({ userId, status }) => {
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.buyer._id === userId) {
            return {
              ...chat,
              buyer: { ...chat.buyer, isOnline: status === "online" },
            };
          }
          return chat;
        })
      );

      if (currentChat?.buyer._id === userId) {
        setCurrentChat((prev) => ({
          ...prev,
          buyer: { ...prev.buyer, isOnline: status === "online" },
        }));
      }
    };

    // Register event listeners
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageStatus(handleMessageStatus);
    socketService.on("user_status", handleUserStatus);

    // Clean up function
    return () => {
      socketService.off("new_message", handleNewMessage);
      socketService.off("message_status", handleMessageStatus);
      socketService.off("user_status", handleUserStatus);
    };
  }, [user, authLoading, chatId, currentChat]);

  // Monitor socket connection state
  useEffect(() => {
    const checkConnection = () => {
      const isConnected = socketService.isConnected();
      if (socketConnected !== isConnected) {
        setSocketConnected(isConnected);
      }

      if (!isConnected && !socketService.isConnecting()) {
        const token = localStorage.getItem("token");
        if (token) {
          socketService.connect(token);
        }
      }
    };

    // Check connection status periodically
    const intervalId = setInterval(checkConnection, 5000);

    // Initial check
    checkConnection();

    return () => {
      clearInterval(intervalId);
    };
  }, [socketConnected]);

  // Join chat room when chatId changes
  useEffect(() => {
    if (!chatId || !socketService.isConnected()) return;

    socketService.joinChat(chatId);

    return () => {
      if (socketService.isConnected()) {
        socketService.leaveChat(chatId);
      }
    };
  }, [chatId, socketConnected]);

  // Load chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;

      const userId = normalizeUserId(user);

      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get("/chat");

        // Filter chats where the current user is the seller
        const sellerChats = response.data.filter((chat) =>
          compareIds(userId, chat.seller._id || chat.seller.id)
        );

        setChats(sellerChats);
      } catch (error) {
        console.error("Error loading chats:", error);
        if (error.response?.status === 401) {
          setError("Session expired. Please login again.");
          navigate("/login");
          return;
        }
        setError("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user, navigate]);

  // Load chat messages when chatId changes
  useEffect(() => {
    if (!chatId || !user) return;

    const userId = normalizeUserId(user);

    const fetchChatData = async () => {
      try {
        setError(null);
        // First verify if this chat exists in the user's chat list
        const chatsResponse = await axiosInstance.get("/chat");
        const chatExists = chatsResponse.data.some(
          (chat) =>
            chat._id === chatId &&
            compareIds(normalizeUserId(chat.seller), userId)
        );

        if (!chatExists) {
          setError("You don't have access to this chat");
          navigate("/seller/messages");
          return;
        }

        // Now fetch the specific chat
        const response = await axiosInstance.get(`/chat/${chatId}`);

        // Enhanced seller verification with normalized IDs
        const userIds = [normalizeUserId(user), normalizeUserId(user.id)];
        const sellerIds = [
          normalizeUserId(response.data.seller),
          normalizeUserId(response.data.seller.id),
          normalizeUserId(response.data.seller._id),
        ];

        const isSellerMatch = userIds.some((id) => sellerIds.includes(id));

        if (!isSellerMatch) {
          setError("You don't have access to this chat");
          navigate("/seller/messages");
          return;
        }

        setCurrentChat(response.data);

        // Fetch messages separately
        const messagesResponse = await axiosInstance.get(
          `/chat/${chatId}/messages`
        );
        setMessages(messagesResponse.data || []);

        // Close mobile sidebar when selecting a chat
        setIsMobileSidebarOpen(false);

        // Join socket room if connected
        if (socketService.isConnected()) {
          socketService.joinChat(chatId);
        }
      } catch (error) {
        console.error("Error fetching chat:", error);
        if (error.response?.status === 403) {
          setError(
            error.response?.data?.message ||
              "You don't have permission to access this chat"
          );
          navigate("/seller/messages");
          return;
        }
        setError("Failed to load conversation");
      }
    };

    fetchChatData();
  }, [chatId, user, navigate]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat changes
  useEffect(() => {
    if (chatId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatId]);

  // Format time for messages
  const formatMessageTime = (dateString) => {
    const today = new Date();
    const messageDate = new Date(dateString);

    // If the message is from today, show only time
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, "HH:mm");
    }

    // If the message is from this year, show date without year
    if (messageDate.getFullYear() === today.getFullYear()) {
      return format(messageDate, "d MMM, HH:mm");
    }

    // Otherwise show full date
    return format(messageDate, "d MMM yyyy, HH:mm");
  };

  // Get message status icon based on status
  const getMessageStatusIcon = (status) => {
    switch (status) {
      case MESSAGE_STATUS.READ:
        return "✓✓";
      case MESSAGE_STATUS.DELIVERED:
        return "✓✓";
      case "sending":
        return "...";
      default:
        return "✓";
    }
  };

  // Send a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || sending) return;

    if (!socketService.isConnected()) {
      toast.error("Chat connection is offline. Please try again in a moment.");
      return;
    }

    setSending(true);
    try {
      // Create a temporary message ID to avoid duplication
      const tempId = `temp-${Date.now()}`;

      // Add message optimistically with temp ID
      const tempMessage = {
        _id: tempId,
        content: newMessage,
        senderId: normalizeUserId(user),
        status: MESSAGE_STATUS.SENT,
        createdAt: new Date().toISOString(),
      };

      // Clear input first
      const messageContent = newMessage;
      setNewMessage("");

      // Update messages with optimistic version
      setMessages((prev) => [...prev, tempMessage]);

      // Send to server
      const response = await axiosInstance.post(`/chat/${chatId}/messages`, {
        content: messageContent,
        senderId: normalizeUserId(user),
      });

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? response.data : msg))
      );

      // Update the last message in chats list
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === chatId ? { ...chat, lastMessage: response.data } : chat
        )
      );

      // Focus input again after sending
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      if (error.response?.status === 403) {
        toast.error("You don't have permission to send messages in this chat");
        return;
      }
      toast.error("Failed to send message. Please try again.");
      // Remove the optimistic message
      setMessages((prev) => prev.filter((msg) => !msg._id.startsWith("temp-")));
    } finally {
      setSending(false);
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) =>
    chat.buyer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem("token");
  if (!token || !user || !user._id) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
          <MessageSquare className="h-16 w-16 text-primary/30 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Please log in to access your messages
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (loading && !chats.length) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50">
      {error && (
        <div className="absolute top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 shadow-md">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Toggle Button */}
      {currentChat && !isMobileSidebarOpen && (
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden fixed bottom-4 left-4 z-10 bg-primary text-white rounded-full p-3 shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 w-full md:w-80 border-r bg-white flex flex-col transition-transform duration-300 absolute md:relative z-20 h-full`}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden absolute right-2 top-2 p-2 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Buyer Messages</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/seller/dashboard")}
              className="md:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => navigate(`/seller/messages/${chat._id}`)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b ${
                  chatId === chat._id ? "bg-gray-100" : ""
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  {chat.buyer.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center">
                    <p className="font-medium truncate">{chat.buyer.name}</p>
                    {chat.lastMessage?.createdAt && (
                      <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {format(new Date(chat.lastMessage.createdAt), "d MMM")}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0">
                    {chat.unreadCount}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Your buyer messages will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col h-full ${
          isMobileSidebarOpen ? "hidden md:flex" : "flex"
        }`}
      >
        {chatId && currentChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 bg-white border-b flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/seller/messages")}
                  className="md:hidden h-9 w-9 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  {currentChat?.buyer?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-medium">{currentChat.buyer.name}</h2>
                  <p className="text-xs text-gray-500">
                    {currentChat.buyer.isOnline ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                >
                  <Video className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#f0f2f5]">
              <div className="space-y-3 max-w-3xl mx-auto py-2">
                {messages.map((message, index) => {
                  // Determine if this is a sender message (current user)
                  const isSender = message.senderId === normalizeUserId(user);

                  // Group messages from the same sender
                  const isFirstInGroup =
                    index === 0 ||
                    messages[index - 1].senderId !== message.senderId;

                  const isLastInGroup =
                    index === messages.length - 1 ||
                    messages[index + 1]?.senderId !== message.senderId;

                  return (
                    <div
                      key={`${message._id}-${index}`}
                      className={`flex items-end gap-2 ${
                        isSender ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/* Show avatar for non-sender messages (left side) */}
                      {!isSender && isFirstInGroup && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      {/* Invisible spacer when not showing avatar */}
                      {!isSender && !isFirstInGroup && (
                        <div className="w-8 flex-shrink-0"></div>
                      )}

                      <div
                        className={`flex flex-col gap-1 max-w-[70%] ${
                          !isFirstInGroup ? "mt-1" : "mt-3"
                        }`}
                      >
                        {isFirstInGroup && (
                          <span
                            className={`text-xs text-gray-500 ${
                              !isSender ? "ml-2" : "mr-2 text-right"
                            }`}
                          >
                            {!isSender
                              ? currentChat?.buyer?.name || "Buyer"
                              : "You"}
                          </span>
                        )}
                        <div
                          className={`relative px-4 py-2 rounded-2xl shadow-sm ${
                            isSender
                              ? "bg-primary text-white"
                              : "bg-white text-gray-800 border border-gray-100"
                          } ${
                            isSender
                              ? isLastInGroup
                                ? "rounded-br-none"
                                : "rounded-br-2xl"
                              : isLastInGroup
                              ? "rounded-bl-none"
                              : "rounded-bl-2xl"
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <div
                            className={`flex items-center gap-1 text-[10px] mt-1 ${
                              isSender ? "text-white/70" : "text-gray-400"
                            }`}
                          >
                            <span>{formatMessageTime(message.createdAt)}</span>
                            {isSender && (
                              <span
                                className={
                                  message.status === MESSAGE_STATUS.READ
                                    ? "text-blue-300"
                                    : ""
                                }
                              >
                                {getMessageStatusIcon(message.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t shadow-sm">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 py-6 rounded-full bg-gray-50 focus-visible:ring-primary/50"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={
                    sending ||
                    !newMessage.trim() ||
                    !socketService.isConnected()
                  }
                  className="rounded-full h-10 w-10 bg-primary text-white hover:bg-primary/90"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
              <MessageSquare className="h-16 w-16 text-primary/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 max-w-md px-4">
                Choose a chat from the sidebar to start messaging with buyers
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerMessages;
