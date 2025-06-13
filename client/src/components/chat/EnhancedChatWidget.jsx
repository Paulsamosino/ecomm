import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { axiosInstance } from "@/contexts/axios";
import { socketService } from "@/services/socket";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  MessageSquare,
  X,
  Send,
  ImageIcon,
  Minimize2,
  Maximize2,
  User,
  Store,
  Clock,
  Search,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductShareCard from "./ProductShareCard";

const MESSAGE_STATUS = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
};

const EnhancedChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chats, setChats] = useState([]);
  const [recentSellers, setRecentSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("recent");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Set up socket connection when widget opens
  useEffect(() => {
    if (!user || !isOpen) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    socketService.connect(token);

    const handleNewMessage = (data) => {
      // Update messages if current chat is open
      if (currentChat && data.chatId === currentChat._id) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(
            (msg) =>
              msg._id === data.message._id ||
              (msg._id.startsWith("temp-") &&
                msg.content === data.message.content)
          );

          if (exists) return prev;
          return [...prev, data.message];
        });

        // Mark as read immediately if the message is from the other user
        if (data.message.senderId !== user._id) {
          socketService.updateMessageStatus(
            data.chatId,
            data.message._id,
            MESSAGE_STATUS.READ
          );
        }
      }

      // Update chat list with new message
      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) => {
          if (chat._id === data.chatId) {
            return {
              ...chat,
              lastMessage: data.message,
              unreadCount:
                currentChat?._id === data.chatId && isOpen
                  ? 0
                  : data.message.senderId !== user._id
                  ? (chat.unreadCount || 0) + 1
                  : chat.unreadCount || 0,
            };
          }
          return chat;
        });

        // Recalculate total unread
        const total = updatedChats.reduce(
          (sum, chat) => sum + (chat.unreadCount || 0),
          0
        );
        setUnreadTotal(total);

        return updatedChats;
      });
    };

    const handleMessageStatus = (data) => {
      if (currentChat && data.chatId === currentChat._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, status: data.status } : msg
          )
        );
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageStatus(handleMessageStatus);

    return () => {
      if (currentChat) {
        socketService.leaveChat(currentChat._id);
      }
      socketService.off("new_message", handleNewMessage);
      socketService.off("message_status", handleMessageStatus);
    };
  }, [isOpen, user, currentChat]);

  // Load chats when widget opens
  useEffect(() => {
    if (!user || !isOpen) return;

    const loadChats = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/chat");

        // Filter for buyer chats only if the user has any role indication
        const buyerChats =
          user.isSeller || user.role === "seller"
            ? []
            : response.data.filter(
                (chat) =>
                  chat.buyer?._id === user._id || chat.buyer?.id === user._id
              );

        setChats(buyerChats);

        // Calculate total unread messages
        const total = buyerChats.reduce(
          (sum, chat) => sum + (chat.unreadCount || 0),
          0
        );
        setUnreadTotal(total);

        // Load recent sellers
        const sellersResponse = await axiosInstance.get("/seller/all");
        setRecentSellers(sellersResponse.data.slice(0, 5)); // Get top 5 sellers
      } catch (error) {
        console.error("Error loading chats:", error);
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [isOpen, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle custom events to open the chat widget
  useEffect(() => {
    const handleOpenChatWidget = (event) => {
      if (event.detail?.chatId) {
        const { chatId, product } = event.detail;
        setIsOpen(true);

        // Find the chat in the list or fetch it
        const existingChat = chats.find((chat) => chat._id === chatId);
        if (existingChat) {
          handleSelectChat(existingChat);

          // Share product in chat if provided
          if (product) {
            setTimeout(() => {
              handleShareProduct(existingChat._id, product);
            }, 1000);
          }
        } else {
          fetchChatById(chatId, product);
        }
      }
    };

    window.addEventListener("openChatWidget", handleOpenChatWidget);

    return () => {
      window.removeEventListener("openChatWidget", handleOpenChatWidget);
    };
  }, [chats]);

  const fetchChatById = async (chatId, product) => {
    try {
      const response = await axiosInstance.get(`/chat/${chatId}`);
      setChats((prev) => {
        if (!prev.some((chat) => chat._id === response.data._id)) {
          return [response.data, ...prev];
        }
        return prev;
      });

      await handleSelectChat(response.data);

      // Share product in chat if provided
      if (product) {
        setTimeout(() => {
          handleShareProduct(chatId, product);
        }, 1000);
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
      toast.error("Failed to load conversation");
    }
  };
  const handleSelectChat = async (chat) => {
    setCurrentChat(chat);
    setLoading(true);

    try {
      const response = await axiosInstance.get(`/chat/${chat._id}/messages`);
      const messagesData = response.data.messages || response.data || [];
      setMessages(messagesData);

      // Mark messages as read when opening chat
      if (chat.unreadCount > 0) {
        socketService.joinChat(chat._id);

        // Mark unread messages as read
        const unreadMessages = messagesData.filter(
          (msg) =>
            msg.senderId !== user._id && msg.status !== MESSAGE_STATUS.READ
        );

        unreadMessages.forEach((msg) => {
          socketService.updateMessageStatus(
            chat._id,
            msg._id,
            MESSAGE_STATUS.READ
          );
        });

        // Update unread count in chat list
        setChats((prevChats) =>
          prevChats.map((c) =>
            c._id === chat._id ? { ...c, unreadCount: 0 } : c
          )
        );

        // Recalculate total unread
        setUnreadTotal((prev) => Math.max(0, prev - chat.unreadCount));
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = async (seller) => {
    try {
      const response = await axiosInstance.post("/chat/direct", {
        sellerId: seller._id,
      });

      // Add to chat list if it's new
      const chatExists = chats.some((chat) => chat._id === response.data._id);
      if (!chatExists) {
        setChats((prev) => [response.data, ...prev]);
      }

      handleSelectChat(response.data);
      setActiveTab("chats");
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start conversation");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      content: newMessage,
      senderId: user._id,
      status: MESSAGE_STATUS.SENT,
      createdAt: new Date().toISOString(),
    };

    // Add message optimistically
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    try {
      const response = await axiosInstance.post(
        `/chat/${currentChat._id}/messages`,
        {
          content: newMessage,
          senderId: user._id,
        }
      );

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? response.data : msg))
      );

      // Update the last message in chats list
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === currentChat._id
            ? { ...chat, lastMessage: response.data }
            : chat
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");

      // Remove temp message if failed
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file || !currentChat) return;

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

      const response = await axiosInstance.post(
        `/chat/${currentChat._id}/messages`,
        {
          content: "",
          image: imageUrl,
          senderId: user._id,
        }
      );

      setMessages((prev) => [...prev, response.data]);

      // Update the last message in chats list
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === currentChat._id
            ? { ...chat, lastMessage: response.data }
            : chat
        )
      );
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);

    if (date.toDateString() === now.toDateString()) {
      return format(date, "HH:mm");
    }

    return format(date, "MMM d");
  };

  // Helper function to get status icon
  const getMessageStatusIcon = (status) => {
    switch (status) {
      case MESSAGE_STATUS.READ:
        return "✓✓";
      case MESSAGE_STATUS.DELIVERED:
        return "✓✓";
      case MESSAGE_STATUS.SENT:
        return "✓";
      default:
        return "";
    }
  };

  // Filter chats based on search
  const filteredChats = searchTerm
    ? chats.filter(
        (chat) =>
          (chat.seller?.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (chat.lastMessage?.content || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : chats;

  const handleShareProduct = async (chatId, product) => {
    if (!product || !chatId) return;

    setSending(true);

    try {
      // Send a special message with product data
      const response = await axiosInstance.post(`/chat/${chatId}/messages`, {
        content: `Check out this product: ${product.name}`,
        productData: {
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0],
          description: product.description?.substring(0, 100),
        },
        senderId: user._id,
      });

      setMessages((prev) => [...prev, response.data]);

      // Update the last message in chats list
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === chatId ? { ...chat, lastMessage: response.data } : chat
        )
      );

      toast.success("Product shared in chat");
    } catch (error) {
      console.error("Error sharing product:", error);
      toast.error("Failed to share product");
    } finally {
      setSending(false);
    }
  };

  // Function to handle product view from shared product card
  const handleViewProduct = (product) => {
    window.open(`/products/${product.id || product._id}`, "_blank");
  };

  // Hide for sellers
  if (user?.isSeller || user?.role === "seller") {
    return null;
  }

  // Collapsed state
  if (!isOpen) {
    return (
      <button
        onClick={() => {
          if (!user) {
            window.location.href = "/login";
            return;
          }
          setIsOpen(true);
        }}
        className="fixed bottom-4 right-4 bg-primary text-white rounded-full p-3 shadow-lg z-50 flex items-center"
      >
        <MessageSquare className="h-6 w-6" />
        {unreadTotal > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500">
            {unreadTotal}
          </Badge>
        )}
      </button>
    );
  }

  // Main widget UI
  return (
    <div
      className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-xl z-50 flex flex-col transition-all duration-200 ${
        isMinimized ? "h-14 w-72" : "h-[500px] w-[360px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
        <h3 className="font-medium flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {isMinimized ? "Messages" : "My Messages"}
          {unreadTotal > 0 && (
            <Badge className="bg-red-500">{unreadTotal}</Badge>
          )}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {currentChat ? (
            <div className="flex flex-col flex-1 h-full overflow-hidden">
              {/* Chat header */}
              <div className="p-3 border-b flex items-center justify-between bg-gray-50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setCurrentChat(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    {currentChat.seller?.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm leading-tight">
                      {currentChat.seller?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentChat.seller?.isOnline ? "Active now" : "Offline"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() =>
                    (window.location.href = `/chat/${currentChat._id}`)
                  }
                  title="Open in full view"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>{" "}
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
                {Array.isArray(messages) &&
                  messages.map((message, index) => {
                    const isSender = message.senderId === user._id;
                    const isFirstInGroup =
                      index === 0 ||
                      messages[index - 1].senderId !== message.senderId;
                    const isLastInGroup =
                      index === messages.length - 1 ||
                      messages[index + 1]?.senderId !== message.senderId;

                    return (
                      <div
                        key={message._id || `temp-${index}`}
                        className={`flex items-end gap-1.5 ${
                          isSender ? "justify-end" : "justify-start"
                        } ${isFirstInGroup ? "mt-3" : "mt-1"}`}
                      >
                        {!isSender && isFirstInGroup && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <Store className="h-3 w-3 text-gray-500" />
                          </div>
                        )}
                        <div
                          className={`px-3 py-2 rounded-lg text-sm max-w-[75%] ${
                            isSender
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-white border border-gray-100 rounded-bl-none"
                          }`}
                        >
                          {message.image && (
                            <img
                              src={message.image}
                              alt="Shared image"
                              className="rounded mb-1 max-w-full cursor-pointer"
                              onClick={() =>
                                window.open(message.image, "_blank")
                              }
                            />
                          )}

                          {/* Display shared product if available */}
                          {message.productData && (
                            <ProductShareCard
                              product={message.productData}
                              onViewProduct={handleViewProduct}
                            />
                          )}

                          {message.content && <p>{message.content}</p>}
                          <span
                            className={`text-[10px] ${
                              isSender ? "text-white/70" : "text-gray-400"
                            } flex items-center gap-0.5`}
                          >
                            {formatTime(message.createdAt)}
                            {isSender && (
                              <span className="ml-1">
                                {getMessageStatusIcon(message.status)}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                <div ref={messagesEndRef} />
              </div>
              {/* Message input */}
              <div className="flex-shrink-0 border-t bg-white p-3">
                <form onSubmit={handleSendMessage}>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                        e.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim() || sending}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Tabs */}
              <Tabs
                defaultValue="recent"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="recent" className="flex-1">
                    Recent
                  </TabsTrigger>
                  <TabsTrigger value="chats" className="flex-1">
                    Chats {chats.length > 0 && `(${chats.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="sellers" className="flex-1">
                    Sellers
                  </TabsTrigger>
                </TabsList>

                {/* Search */}
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="recent" className="h-full m-0">
                    {recentSellers.length > 0 ? (
                      <div className="divide-y">
                        {recentSellers.map((seller) => (
                          <button
                            key={seller._id}
                            onClick={() => handleStartNewChat(seller)}
                            className="w-full p-3 flex items-center gap-2 hover:bg-gray-50 text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Store className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {seller.name}
                              </p>
                              {seller.sellerProfile?.businessName && (
                                <p className="text-xs text-gray-500 truncate">
                                  {seller.sellerProfile.businessName}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center p-4">
                          <ShoppingBag className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">
                            Browse products to find sellers
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="chats" className="h-full m-0">
                    {filteredChats.length > 0 ? (
                      <div className="divide-y">
                        {filteredChats.map((chat) => (
                          <button
                            key={chat._id}
                            onClick={() => handleSelectChat(chat)}
                            className="w-full p-3 flex items-start gap-2 hover:bg-gray-50 text-left relative"
                          >
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Store className="h-5 w-5 text-primary" />
                              </div>
                              {chat.seller?.isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <p className="font-medium text-sm">
                                  {chat.seller?.name}
                                </p>
                                {chat.lastMessage?.createdAt && (
                                  <p className="text-xs text-gray-500">
                                    {formatTime(chat.lastMessage.createdAt)}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {chat.lastMessage?.image
                                  ? "Sent an image"
                                  : chat.lastMessage?.content ||
                                    "No messages yet"}
                              </p>
                            </div>
                            {chat.unreadCount > 0 && (
                              <Badge className="absolute top-3 right-3 bg-red-500">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center p-4">
                          <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">
                            No conversations yet
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="sellers" className="h-full m-0">
                    <div className="p-3 text-center">
                      <Button
                        onClick={() => (window.location.href = "/chat")}
                        className="w-full"
                      >
                        Browse All Sellers
                      </Button>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedChatWidget;
