import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Search,
  MessageSquare,
  Store,
  Send,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { socketService } from "@/services/socketService";
import axiosInstance from "@/api/axios";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MESSAGE_STATUS = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
};

const SellerMessages = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize socket and load chats
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    const loadChats = async () => {
      try {
        const response = await axiosInstance.get("/chat");
        // Filter for seller chats only
        const sellerChats = response.data.filter(
          (chat) => chat.seller._id === user._id
        );
        setChats(sellerChats);
        setLoading(false);
      } catch (error) {
        console.error("Error loading chats:", error);
        toast.error("Failed to load conversations");
        setLoading(false);
      }
    };

    socketService.getSocket();
    loadChats();

    return () => {
      if (currentChat) {
        socketService.leaveChat(currentChat._id);
      }
    };
  }, [user]);

  // Socket event handlers
  useEffect(() => {
    if (!user) return;

    const handleNewMessage = (data) => {
      if (currentChat?._id === data.chatId) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg._id === data.message._id);
          if (exists) return prev;
          return [...prev, data.message];
        });

        // Mark as read if we're the recipient
        if (data.message.senderId !== user._id) {
          socketService.updateMessageStatus(
            data.chatId,
            data.message._id,
            MESSAGE_STATUS.READ
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
                  chat._id !== currentChat?._id
                    ? (chat.unreadCount || 0) + 1
                    : 0,
              }
            : chat
        )
      );
    };

    socketService.on("new_message", handleNewMessage);

    return () => {
      socketService.off("new_message", handleNewMessage);
    };
  }, [currentChat, user]);

  // Load messages when selecting a chat
  const handleSelectChat = async (chat) => {
    setCurrentChat(chat);
    setLoading(true);

    try {
      const response = await axiosInstance.get(`/chat/${chat._id}/messages`);
      setMessages(response.data || []);

      // Join socket room
      socketService.joinChat(chat._id);

      // Mark messages as read
      const unreadMessages = response.data.filter(
        (msg) => msg.senderId !== user._id && msg.status !== MESSAGE_STATUS.READ
      );

      unreadMessages.forEach((msg) => {
        socketService.updateMessageStatus(
          chat._id,
          msg._id,
          MESSAGE_STATUS.READ
        );
      });

      // Update chat list to remove unread count
      setChats((prevChats) =>
        prevChats.map((c) =>
          c._id === chat._id ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat?._id) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      content: newMessage,
      senderId: user._id,
      status: MESSAGE_STATUS.SENT,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    try {
      const response = await axiosInstance.post(
        `/chat/${currentChat._id}/messages`,
        {
          content: newMessage,
        }
      );

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? response.data : msg))
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    }
  };

  const formatMessageTime = (dateString) => {
    const messageDate = new Date(dateString);
    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, "HH:mm");
    }
    return format(messageDate, "MMM d, HH:mm");
  };

  // Filter chats based on search
  const filteredChats = chats.filter((chat) =>
    chat.buyer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md min-h-[600px]">
        <div className="grid grid-cols-12 h-[600px]">
          {/* Chat List */}
          <div className="col-span-4 border-r">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(600px-88px)]">
              {filteredChats.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b ${
                    currentChat?._id === chat._id ? "bg-gray-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{chat.buyer.name}</p>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                      {chat.unreadCount}
                    </div>
                  )}
                </button>
              ))}
              {filteredChats.length === 0 && (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No conversations found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "Messages from buyers will appear here"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="col-span-8 flex flex-col">
            {currentChat ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{currentChat.buyer.name}</h3>
                      <p className="text-sm text-gray-500">
                        {currentChat.buyer.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={message._id}
                      className={`flex ${
                        message.senderId === user._id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.senderId === user._id
                            ? "bg-primary text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        <p>{message.content}</p>
                        <div className="text-xs mt-1 opacity-70">
                          {formatMessageTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                      ref={inputRef}
                    />
                    <Button type="submit" disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a conversation</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Choose a chat from the left to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerMessages;
