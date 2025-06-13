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
  Search,
  ArrowLeft,
  RefreshCw,
  Circle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import toast from "react-hot-toast";

// Simple helper to normalize user IDs
const normalizeUserId = (user) => {
  if (!user) return null;
  return user._id || user.id || (typeof user === "string" ? user : null);
};

const SellerMessages = () => {
  const { user } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();

  // Simple state management
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const messagesEndRef = useRef();
  const isSelectingChatRef = useRef(false);

  // Initialize socket connection and load data
  useEffect(() => {
    let mounted = true;

    const initializeChat = async () => {
      if (!user || connecting) {
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setConnecting(true);
        setConnected(false);

        // Check if socket is already connected
        if (!socketService.isConnected()) {
          // Initialize socket connection
          await socketService.connect(token, { isSeller: true });
        }

        if (mounted) {
          setConnected(true);

          // Set up socket event handlers
          setupSocketHandlers();

          // Load initial data
          await loadChats();

          toast.success("Connected to chat server");
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        if (mounted) {
          setConnected(false);
          toast.error("Failed to connect to chat server");
        }
      } finally {
        if (mounted) {
          setConnecting(false);
        }
      }
    };

    if (user) {
      initializeChat();
    }

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (selectedChat) {
        socketService.leaveChat(selectedChat._id);
      }
    };
  }, [user]);

  // Handle chat selection from URL
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (chatId && connected && chats.length > 0) {
        const chat = chats.find((c) => c._id === chatId);
        if (chat && (!selectedChat || selectedChat._id !== chatId)) {
          selectChat(chat);
        } else if (!chat) {
          // Chat not found, redirect to messages home
          navigate("/seller/messages");
        }
      }
    }, 100); // Small delay to prevent rapid calls

    return () => clearTimeout(timeoutId);
  }, [chatId, connected, chats]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup socket event handlers
  const setupSocketHandlers = () => {
    // Handle new messages
    socketService.onNewMessage((data) => {
      console.log("New message received:", data);

      // Update messages if in current chat
      if (data.chatId === chatId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((msg) => msg._id === data.message._id)) {
            return prev;
          }
          return [...prev, data.message];
        });
      }

      // Update chat list
      updateChatWithNewMessage(data.chatId, data.message);
    });

    // Handle typing indicators
    socketService.on("typing", ({ chatId: typingChatId, userId, isTyping }) => {
      if (typingChatId === chatId && userId !== normalizeUserId(user)) {
        setTypingUsers((prev) => {
          if (isTyping) {
            return prev.includes(userId) ? prev : [...prev, userId];
          } else {
            return prev.filter((id) => id !== userId);
          }
        });
      }
    });

    // Handle user online/offline status
    socketService.on("user_status", ({ userId, status }) => {
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.buyer?._id === userId) {
            return {
              ...chat,
              buyer: { ...chat.buyer, isOnline: status === "online" },
            };
          }
          return chat;
        })
      );
    });
  };

  // Load all seller chats
  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/chat");

      // Filter for seller's chats and sort by latest activity
      const sellerChats = response.data
        .filter(
          (chat) => normalizeUserId(chat.seller) === normalizeUserId(user)
        )
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      setChats(sellerChats);
    } catch (error) {
      console.error("Error loading chats:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  // Select and load a chat
  const selectChat = async (chat) => {
    // Prevent selecting the same chat multiple times or concurrent selections
    if (
      isSelectingChatRef.current ||
      (selectedChat && selectedChat._id === chat._id)
    ) {
      return;
    }

    try {
      isSelectingChatRef.current = true;

      // Leave previous chat if any
      if (selectedChat) {
        socketService.leaveChat(selectedChat._id);
      }

      setSelectedChat(chat);
      setMessages([]);
      setTypingUsers([]);

      // Join the chat room
      await socketService.joinChat(chat._id);

      // Load messages
      const response = await axiosInstance.get(`/chat/${chat._id}/messages`);
      setMessages(response.data?.messages || []);

      // Mark as read
      resetUnreadCount(chat._id);
    } catch (error) {
      console.error("Error selecting chat:", error);
      toast.error("Failed to load chat messages");
    } finally {
      isSelectingChatRef.current = false;
    }
  };

  // Send a message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedChat || sending) {
      return;
    }

    if (!connected || !socketService.isConnected()) {
      toast.error("Connection lost. Please try again.");
      setConnected(false);
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      // Create optimistic message
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content: messageContent,
        senderId: normalizeUserId(user),
        createdAt: new Date().toISOString(),
        status: "SENDING",
      };

      // Add to UI immediately for better UX
      setMessages((prev) => [...prev, tempMessage]);

      // Send via socket
      const success = await socketService.sendMessage(selectedChat._id, {
        content: messageContent,
        tempId: tempMessage._id,
      });

      if (!success) {
        throw new Error("Failed to send message via socket");
      }

      // Replace temp message with actual message
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMessage._id ? { ...msg, status: "SENT" } : msg
          )
        );
      }, 500);
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((msg) => !msg._id.startsWith("temp-")));

      // Restore message to input
      setNewMessage(messageContent);

      // Check connection status
      if (!socketService.isConnected()) {
        setConnected(false);
        toast.error("Connection lost. Please try again.");
      } else {
        toast.error("Failed to send message");
      }
    } finally {
      setSending(false);
    }
  };

  // Update chat list with new message
  const updateChatWithNewMessage = (chatId, message) => {
    setChats((prev) => {
      const updated = prev.map((chat) => {
        if (chat._id === chatId) {
          return {
            ...chat,
            lastMessage: message,
            updatedAt: new Date().toISOString(),
            unreadCount:
              chatId === selectedChat?._id ? 0 : (chat.unreadCount || 0) + 1,
          };
        }
        return chat;
      });

      // Sort by latest message
      return updated.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    });
  };

  // Reset unread count for a chat
  const resetUnreadCount = (chatId) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Refresh connection
  const refreshConnection = async () => {
    try {
      setConnecting(true);
      setConnected(false);

      // Disconnect first
      socketService.disconnect();

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await socketService.connect(token, { isSeller: true });
      setConnected(true);
      setupSocketHandlers();
      await loadChats();
      toast.success("Reconnected successfully");
    } catch (error) {
      console.error("Refresh failed:", error);
      setConnected(false);
      toast.error("Failed to reconnect");
    } finally {
      setConnecting(false);
    }
  };

  // Filter chats based on search
  const filteredChats = chats.filter((chat) =>
    chat.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  if (loading && chats.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading conversations...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar - Chat List */}
      <div className="w-1/3 border-r bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshConnection}
                disabled={connecting}
              >
                <RefreshCw
                  className={`h-4 w-4 ${connecting ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => {
                  // Only navigate if not already selected
                  if (chatId !== chat._id) {
                    navigate(`/seller/messages/${chat._id}`);
                  }
                }}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 text-left border-b transition-colors ${
                  chatId === chat._id
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : ""
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  {chat.buyer?.isOnline && (
                    <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium truncate">
                      {chat.buyer?.name || "Unknown User"}
                    </p>
                    {chat.lastMessage?.createdAt && (
                      <p className="text-xs text-gray-500">
                        {format(new Date(chat.lastMessage.createdAt), "MMM d")}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage?.content || "No messages yet"}
                  </p>
                </div>

                {chat.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                    {chat.unreadCount}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery
                  ? "No conversations found"
                  : "No conversations yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/seller/messages")}
                  className="md:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  {selectedChat.buyer?.isOnline && (
                    <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
                  )}
                </div>

                <div>
                  <h2 className="font-medium">
                    {selectedChat.buyer?.name || "Unknown User"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedChat.buyer?.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                {connected ? "Connected" : "Disconnected"}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isOwn = message.senderId === normalizeUserId(user);
                  const showTime =
                    index === 0 ||
                    new Date(message.createdAt).getTime() -
                      new Date(messages[index - 1].createdAt).getTime() >
                      60000;

                  return (
                    <div key={message._id || index}>
                      {showTime && (
                        <div className="text-center text-xs text-gray-400 my-4">
                          {format(new Date(message.createdAt), "MMM d, HH:mm")}
                        </div>
                      )}

                      <div
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-lg ${
                            isOwn
                              ? "bg-blue-500 text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <div
                            className={`text-xs mt-1 ${
                              isOwn ? "text-blue-100" : "text-gray-400"
                            }`}
                          >
                            {format(new Date(message.createdAt), "HH:mm")}
                            {isOwn && message.status && (
                              <span className="ml-1">
                                {message.status === "READ" ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sending || !connected}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending || !connected}
                  size="icon"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {!connected && (
                <p className="text-xs text-red-500 mt-2">
                  Connection lost. Click refresh to reconnect.
                </p>
              )}
            </form>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a chat from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerMessages;
