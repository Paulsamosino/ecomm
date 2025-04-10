import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { axiosInstance } from "@/contexts/axios";
import {
  Search,
  MessageSquare,
  Loader2,
  Store,
  Phone,
  Video,
  Info,
  MoreVertical,
  Send,
  ImageIcon,
  Star,
  User,
  MapPin,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { socketService } from "@/services/socket";

// Helper function to normalize user ID
const normalizeUserId = (user) => {
  if (!user) return null;
  return user._id || user.id || (typeof user === "string" ? user : null);
};

// Helper function to compare IDs safely
const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;

  // Convert to strings for comparison
  const strId1 = typeof id1 === "object" ? String(id1) : String(id1);
  const strId2 = typeof id2 === "object" ? String(id2) : String(id2);

  return strId1 === strId2;
};

// Standardize message status constants
const MESSAGE_STATUS = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
};

const EnhancedChatPage = () => {
  const { user } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();

  // Add error state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [sellers, setSellers] = useState([]);
  const [sellerSearchQuery, setSellerSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const messagesEndRef = useRef();
  const inputRef = useRef(null);

  // Initialize socket connection with proper authentication
  useEffect(() => {
    if (!user?._id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    socketService.connect(token);

    const handleNewMessage = (data) => {
      if (data.chatId === chatId) {
        // Check for duplicate messages before adding
        setMessages((prev) => {
          // If message already exists in our messages array, don't add it again
          const messageExists = prev.some(
            (msg) =>
              msg._id === data.message._id ||
              (msg._id.startsWith("temp-") &&
                msg.content === data.message.content)
          );

          if (messageExists) return prev;
          return [...prev, data.message];
        });

        // Mark message as delivered only if it's from the other user
        if (data.message.senderId !== normalizeUserId(user)) {
          socketService.updateMessageStatus(
            chatId,
            data.message._id,
            MESSAGE_STATUS.DELIVERED
          );
        }
      }

      // Update chat list
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
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, status: data.status } : msg
        )
      );
    };

    const handleUserStatus = ({ userId, status }) => {
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.seller._id === userId) {
            return {
              ...chat,
              seller: { ...chat.seller, isOnline: status === "online" },
            };
          }
          return chat;
        })
      );

      if (currentChat?.seller._id === userId) {
        setCurrentChat((prev) => ({
          ...prev,
          seller: { ...prev.seller, isOnline: status === "online" },
        }));
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageStatus(handleMessageStatus);
    socketService.on("user_status", handleUserStatus);

    return () => {
      socketService.off("new_message", handleNewMessage);
      socketService.off("message_status", handleMessageStatus);
      socketService.off("user_status", handleUserStatus);
    };
  }, [user?._id, chatId]);

  // Join chat room when chatId changes
  useEffect(() => {
    if (!chatId || !socketService.isConnected()) return;

    socketService.joinChat(chatId);

    return () => {
      if (socketService.isConnected()) {
        socketService.leaveChat(chatId);
      }
    };
  }, [chatId]);

  // Load initial data and validate chat access
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all chats for the current user
        const chatsResponse = await axiosInstance.get("/chat");
        const userChats = chatsResponse.data;
        setChats(userChats);

        // If there's a chatId, verify access
        if (chatId) {
          const chatExists = userChats.some((chat) => chat._id === chatId);
          if (!chatExists) {
            setError("You don't have permission to access this chat");
            navigate("/chat");
            return;
          }
        }

        // Fetch sellers
        const sellersResponse = await axiosInstance.get("/seller/all");
        setSellers(sellersResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error loading initial data:", error);
        setError("Failed to load chats and sellers");
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Load chat messages when chatId changes
  useEffect(() => {
    if (chatId) {
      const fetchChatData = async () => {
        try {
          setError(null);
          setLoading(true);

          // First check if this chat exists in the user's chat list
          const userChats = await axiosInstance.get("/chat");
          const userId = normalizeUserId(user);

          const chatExists = userChats.data.some((chat) => {
            const buyerId = normalizeUserId(chat.buyer);
            const sellerId = normalizeUserId(chat.seller);
            return (
              chat._id === chatId &&
              (compareIds(userId, buyerId) || compareIds(userId, sellerId))
            );
          });

          if (!chatExists) {
            setError("You don't have permission to access this chat");
            navigate("/chat");
            return;
          }

          const chatResponse = await axiosInstance.get(`/chat/${chatId}`);
          setCurrentChat(chatResponse.data);
          setMessages(chatResponse.data.messages || []);

          // Close mobile sidebar when selecting a chat
          setIsMobileSidebarOpen(false);
        } catch (error) {
          console.error("Error fetching chat:", error);
          if (error.response?.status === 403) {
            setError("You don't have permission to access this chat");
            navigate("/chat");
          } else if (error.response?.status === 401) {
            setError("Please login to access this chat");
            navigate("/login", { state: { from: location } });
          } else {
            setError("Failed to load chat messages");
          }
        } finally {
          setLoading(false);
        }
      };

      fetchChatData();
    } else {
      setCurrentChat(null);
      setMessages([]);
    }
  }, [chatId, navigate, user]);

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

  // Send a message with improved error handling
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    if (!socketService.isConnected()) {
      toast.error("Connection lost. Please refresh the page.");
      return;
    }

    try {
      const messageData = {
        content: newMessage,
        chatId,
        senderId: user._id,
      };

      // Create a unique temp ID
      const tempId = `temp-${Date.now()}`;

      // Optimistically add message to UI
      const tempMessage = {
        _id: tempId,
        content: newMessage,
        sender: user._id,
        senderId: user._id,
        createdAt: new Date().toISOString(),
        status: "sending",
      };

      // Clear input first
      setNewMessage("");

      // Add message to UI
      setMessages((prev) => [...prev, tempMessage]);

      // Send to server
      const response = await axiosInstance.post(
        `/chat/${chatId}/messages`,
        messageData
      );

      // Replace temp message with actual message
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? response.data : msg))
      );

      // Update chat list with the new message
      setChats((prev) =>
        prev.map((chat) =>
          chat._id === chatId ? { ...chat, lastMessage: response.data } : chat
        )
      );

      // Focus input again after sending
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => !msg._id.startsWith("temp-")));

      if (error.response?.status === 403) {
        toast.error("You don't have permission to send messages in this chat");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    }
  };

  // Start a new chat with a seller
  const handleStartChat = async (sellerId) => {
    try {
      const response = await axiosInstance.post("/chat/direct", { sellerId });

      // Navigate to the new/existing chat
      navigate(`/chat/${response.data._id}`);

      // Refresh chat list
      const chatsResponse = await axiosInstance.get("/chat");
      setChats(chatsResponse.data);

      setActiveTab("chats");
      setIsMobileSidebarOpen(false);
    } catch (error) {
      console.error("Error starting chat with seller:", error);
      toast.error("Failed to start chat with seller");
    }
  };

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

  // Filter sellers based on search query
  const filteredSellers = sellers.filter(
    (seller) =>
      seller.name.toLowerCase().includes(sellerSearchQuery.toLowerCase()) ||
      (seller.sellerProfile?.businessName || "")
        .toLowerCase()
        .includes(sellerSearchQuery.toLowerCase())
  );

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) =>
    chat.seller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (loading && !chats.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
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

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === "chats"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("chats")}
          >
            My Chats
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === "sellers"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("sellers")}
          >
            Sellers
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={
                activeTab === "chats"
                  ? "Search conversations..."
                  : "Search sellers..."
              }
              className="pl-10"
              value={activeTab === "chats" ? searchQuery : sellerSearchQuery}
              onChange={(e) =>
                activeTab === "chats"
                  ? setSearchQuery(e.target.value)
                  : setSellerSearchQuery(e.target.value)
              }
            />
          </div>
        </div>

        {/* Content - either chats or sellers */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "chats" ? (
            filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => navigate(`/chat/${chat._id}`)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b ${
                    chatId === chat._id ? "bg-gray-100" : ""
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    {chat.seller.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{chat.seller.name}</p>
                      {chat.lastMessage?.createdAt && (
                        <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {format(
                            new Date(chat.lastMessage.createdAt),
                            "d MMM"
                          )}
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
                  Start chatting with a seller
                </p>
              </div>
            )
          ) : filteredSellers.length > 0 ? (
            filteredSellers.map((seller) => (
              <button
                key={seller._id}
                onClick={() => handleStartChat(seller._id)}
                className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{seller.name}</p>
                    {seller.sellerProfile?.rating && (
                      <div className="flex items-center ml-2">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs ml-1">
                          {seller.sellerProfile.rating}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {seller.sellerProfile?.businessName || "Seller"}
                  </p>
                  {seller.sellerProfile?.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {seller.sellerProfile.description}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No sellers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Main Area */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 ${
          isMobileSidebarOpen ? "hidden md:flex" : "flex"
        }`}
      >
        {chatId && currentChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b bg-white px-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  {currentChat?.seller?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-medium">
                    {currentChat?.seller?.name || "Loading..."}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {currentChat?.seller?.isOnline ? "Active now" : "Offline"}
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
                  const isSender =
                    message.sender === user._id ||
                    message.senderId === user._id;

                  // Group messages from the same sender
                  const isFirstInGroup =
                    index === 0 ||
                    (messages[index - 1].sender ||
                      messages[index - 1].senderId) !==
                      (message.sender || message.senderId);

                  const isLastInGroup =
                    index === messages.length - 1 ||
                    (messages[index + 1]?.sender ||
                      messages[index + 1]?.senderId) !==
                      (message.sender || message.senderId);

                  return (
                    <div
                      key={`${message._id}-${index}`}
                      className={`flex items-end gap-2 ${
                        isSender ? "justify-start" : "justify-end"
                      }`}
                    >
                      {/* Show avatar for sender messages (left side) */}
                      {isSender && isFirstInGroup && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      {/* Invisible spacer when not showing avatar */}
                      {isSender && !isFirstInGroup && (
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
                              isSender ? "ml-2" : "mr-2 text-right"
                            }`}
                          >
                            {isSender
                              ? "You"
                              : currentChat?.seller?.name || "Seller"}
                          </span>
                        )}
                        <div
                          className={`relative px-4 py-2 rounded-2xl shadow-sm ${
                            isSender
                              ? "bg-white text-gray-800 border border-gray-100"
                              : "bg-primary text-white"
                          } ${
                            isSender
                              ? isLastInGroup
                                ? "rounded-bl-none"
                                : "rounded-bl-2xl"
                              : isLastInGroup
                              ? "rounded-br-none"
                              : "rounded-br-2xl"
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <div
                            className={`flex items-center gap-1 text-[10px] mt-1 ${
                              isSender ? "text-gray-400" : "text-white/70"
                            }`}
                          >
                            <span>{formatMessageTime(message.createdAt)}</span>
                            {isSender && (
                              <span
                                className={
                                  message.status === MESSAGE_STATUS.READ
                                    ? "text-blue-500"
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
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t shadow-sm"
            >
              <div className="flex items-center gap-2">
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
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!socketService.isConnected() || !newMessage.trim()}
                  className="rounded-full h-10 w-10 bg-primary text-white hover:bg-primary/90"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
              <MessageSquare className="h-16 w-16 text-primary/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 max-w-md px-4 mb-4">
                Choose a chat from the sidebar or start a new conversation with
                a seller
              </p>
              <Button
                onClick={() => setActiveTab("sellers")}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Browse Sellers
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatPage;
