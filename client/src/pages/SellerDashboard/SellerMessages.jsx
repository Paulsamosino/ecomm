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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { debounce } from "lodash";

// Simple helper to normalize user IDs
const normalizeUserId = (user) => {
  if (!user) return null;
  return user._id || user.id || (typeof user === "string" ? user : null);
};

const MESSAGE_STATUS = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
};

const SellerMessages = () => {
  const { user } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const messagesEndRef = useRef();
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection once
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    let mounted = true;

    const initSocket = async () => {
      if (!mounted) return;

      try {
        console.log("Initializing socket connection for seller...");
        await socketService.connect(token, {
          isSeller: user.isSeller,
          id: user.id || user._id,
        });
        if (mounted) {
          setSocketConnected(true);
          console.log("Socket connected successfully for seller");

          // Load chats after successful connection
          await loadChats();
        }
      } catch (error) {
        console.error("Socket connection error:", error);
        if (mounted) {
          setSocketConnected(false);

          if (retryCount < maxRetries) {
            retryCount++;
            toast.error(
              `Chat connection failed. Retrying... (${retryCount}/${maxRetries})`
            );
            setTimeout(() => initSocket(), 3000);
          } else {
            toast.error(
              "Could not establish chat connection. Please refresh the page."
            );
          }
        }
      }
    };

    initSocket();

    // Cleanup function
    return () => {
      mounted = false;
      if (chatId) {
        socketService.leaveChat(chatId);
      }
      socketService.disconnect();
    };
  }, [user]); // Remove user._id dependency, just use user

  // Set up message event handlers
  useEffect(() => {
    if (!user) return;

    // Handle new incoming messages
    const handleNewMessage = (data) => {
      // Update messages if in current chat
      if (data.chatId === chatId) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg._id === data.message._id);
          if (exists) return prev;
          return [...prev, data.message];
        });

        // Mark message as delivered
        socketService.emit("message_status", {
          chatId: data.chatId,
          messageId: data.message._id,
          status: MESSAGE_STATUS.DELIVERED,
        });

        // If window is focused, mark as read
        if (document.hasFocus()) {
          socketService.emit("message_status", {
            chatId: data.chatId,
            messageId: data.message._id,
            status: MESSAGE_STATUS.READ,
          });
        }
      }

      // Update chat list with new message
      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) =>
          chat._id === data.chatId
            ? {
                ...chat,
                lastMessage: data.message,
                updatedAt: new Date().toISOString(),
                unreadCount:
                  chatId !== data.chatId ? (chat.unreadCount || 0) + 1 : 0,
              }
            : chat
        );

        // Sort chats by latest message
        return updatedChats.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    };

    // Handle message status updates
    const handleMessageStatus = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, status: data.status } : msg
        )
      );
    };

    // Handle typing status
    const handleTyping = ({ chatId: typingChatId, userId, isTyping }) => {
      if (typingChatId === chatId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      }
    };

    // Handle user online/offline status
    const handleUserStatus = ({ userId, status }) => {
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.buyer?._id === userId) {
            return {
              ...chat,
              buyer: { ...chat.buyer, isOnline: status === "online" },
            };
          }
          return chat;
        })
      );

      if (currentChat?.buyer?._id === userId) {
        setCurrentChat((prev) => ({
          ...prev,
          buyer: { ...prev.buyer, isOnline: status === "online" },
        }));
      }
    };

    // Register event handlers
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageStatus(handleMessageStatus);
    socketService.on("typing", handleTyping);
    socketService.on("user_status", handleUserStatus);

    // Handle window focus for read receipts
    const handleFocus = () => {
      if (chatId && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.senderId !== normalizeUserId(user)) {
          socketService.emit("message_status", {
            chatId,
            messageId: lastMessage._id,
            status: MESSAGE_STATUS.READ,
          });
        }
      }
    };

    window.addEventListener("focus", handleFocus);

    // Clean up event handlers
    return () => {
      socketService.off("new_message", handleNewMessage);
      socketService.off("message_status", handleMessageStatus);
      socketService.off("typing", handleTyping);
      socketService.off("user_status", handleUserStatus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, chatId]);

  // Handle joining specific chat room
  useEffect(() => {
    if (!chatId || !socketConnected) return;

    const joinChat = async () => {
      try {
        await socketService.joinChat(chatId);
        await loadChatMessages(chatId);

        // Mark messages as read when joining chat
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.senderId !== normalizeUserId(user)) {
            socketService.emit("message_status", {
              chatId,
              messageId: lastMessage._id,
              status: MESSAGE_STATUS.READ,
            });
          }
        }

        // Reset unread count for this chat
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
      } catch (error) {
        console.error("Error joining chat:", error);
        toast.error("Failed to join chat room");
      }
    };

    joinChat();

    return () => {
      if (socketService.isConnected()) {
        socketService.leaveChat(chatId);
      }
    };
  }, [chatId, socketConnected]);

  // Handle typing indicator
  const debouncedTypingStatus = useRef(
    debounce((isTyping) => {
      if (socketConnected && chatId) {
        socketService.emit("typing", { chatId, isTyping });
      }
    }, 300)
  ).current;

  useEffect(() => {
    if (newMessage && !isTyping) {
      setIsTyping(true);
      debouncedTypingStatus(true);
    } else if (!newMessage && isTyping) {
      setIsTyping(false);
      debouncedTypingStatus(false);
    }

    return () => {
      if (isTyping) {
        debouncedTypingStatus(false);
      }
    };
  }, [newMessage, isTyping, chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const shouldScroll =
      messages.length > 0 &&
      messages[messages.length - 1]?.senderId === normalizeUserId(user);

    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load all chats for the seller
  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/chat");

      // Filter for seller's chats and sort by latest message
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

  // Load messages for a specific chat
  const loadChatMessages = async (chatId) => {
    try {
      const [chatResponse, messagesResponse] = await Promise.all([
        axiosInstance.get(`/chat/${chatId}`),
        axiosInstance.get(`/chat/${chatId}/messages`),
      ]);

      setCurrentChat(chatResponse.data);
      setMessages(messagesResponse.data || []);

      // Scroll to bottom on initial load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error loading chat:", error);

      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error("You don't have permission to access this chat");
        navigate("/seller/messages");
      } else {
        toast.error("Failed to load messages");
      }
    }
  };

  // Send a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || sending) return;

    if (!socketService.isConnected()) {
      toast.error("Chat connection is offline. Please try again.");
      return;
    }

    setSending(true);
    try {
      // Create temporary message
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content: newMessage.trim(),
        senderId: normalizeUserId(user),
        status: MESSAGE_STATUS.SENT,
        createdAt: new Date().toISOString(),
        sender: {
          _id: user._id,
          name: user.name,
          isSeller: true,
        },
      };

      // Add optimistically to UI
      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      // Send via socket
      const success = socketService.sendMessage(chatId, tempMessage);

      if (!success) {
        // Remove temp message if failed
        setMessages((prev) =>
          prev.filter((msg) => msg._id !== tempMessage._id)
        );
        toast.error("Failed to send message. Please try again.");
      } else {
        // Update chat list with new message
        setChats((prevChats) => {
          const updatedChats = prevChats.map((chat) =>
            chat._id === chatId
              ? {
                  ...chat,
                  lastMessage: tempMessage,
                  updatedAt: new Date().toISOString(),
                }
              : chat
          );

          // Sort chats by latest message
          return updatedChats.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Filter chats based on search
  const filteredChats = chats.filter((chat) =>
    chat.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  if (loading && !chats.length) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading conversations...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Chat sidebar */}
      <div className="w-1/4 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-4">Buyer Messages</h2>
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

        <div
          className="overflow-y-auto"
          style={{ height: "calc(100vh - 8rem)" }}
        >
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => navigate(`/seller/messages/${chat._id}`)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 text-left border-b ${
                  chatId === chat._id ? "bg-gray-100" : ""
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  {chat.buyer?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium truncate">{chat.buyer?.name}</p>
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
                  <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                    {chat.unreadCount}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      {chatId && currentChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
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
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                {currentChat.buyer?.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>

              <div>
                <h2 className="font-medium">{currentChat.buyer?.name}</h2>
                <p className="text-xs text-gray-500">
                  {currentChat.buyer?.isOnline ? "Active now" : "Offline"}
                </p>
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isSender = message.senderId === normalizeUserId(user);

                return (
                  <div
                    key={message._id || index}
                    className={`flex items-end gap-2 ${
                      isSender ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isSender && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isSender
                          ? "bg-primary text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <p>{message.content}</p>
                      <div
                        className={`flex items-center justify-end mt-1 text-xs ${
                          isSender ? "text-white/70" : "text-gray-400"
                        }`}
                      >
                        {format(new Date(message.createdAt), "HH:mm")}
                        {isSender && (
                          <span className="ml-1">
                            {message.status === MESSAGE_STATUS.READ
                              ? "✓✓"
                              : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingUsers.size > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-white border border-gray-200">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending || !socketConnected}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending || !socketConnected}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!socketConnected && (
              <p className="text-xs text-red-500 mt-1">
                Chat connection offline. Trying to reconnect...
              </p>
            )}
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              Select a conversation
            </h3>
            <p className="text-gray-500">
              Choose a chat from the sidebar to start messaging with buyers
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerMessages;
