import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { axiosInstance } from "@/contexts/axios";
import {
  MessageSquare,
  Loader2,
  Send,
  User,
  Clock,
  Search,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const SellerMessages = () => {
  const { user } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const socketRef = useRef();
  const messagesEndRef = useRef();

  // Set up socket connection
  useEffect(() => {
    socketRef.current = io(
      import.meta.env.VITE_API_URL || "http://localhost:3001"
    );

    socketRef.current.emit("authenticate", user._id);

    socketRef.current.on("new_message", (data) => {
      if (data.chatId === chatId) {
        setMessages((prevMessages) => [...prevMessages, data.message]);
      }

      // Update chats with new message
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat._id === data.chatId) {
            return {
              ...chat,
              lastMessage: data.message,
              unreadCount:
                chat._id !== chatId ? (chat.unreadCount || 0) + 1 : 0,
            };
          }
          return chat;
        });
      });
    });

    socketRef.current.on("new_chat", (chat) => {
      setChats((prevChats) => [chat, ...prevChats]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [chatId, user._id]);

  // Load chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/chat");
        // Filter chats where the current user is the seller
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

    fetchChats();
  }, [user._id]);

  // Load chat messages when chatId changes
  useEffect(() => {
    if (chatId) {
      const fetchChatData = async () => {
        try {
          const response = await axiosInstance.get(`/chat/${chatId}`);
          // Verify that the current user is the seller of this chat
          if (response.data.seller._id !== user._id) {
            toast.error("You don't have access to this chat");
            navigate("/seller/messages");
            return;
          }
          setCurrentChat(response.data);
          setMessages(response.data.messages || []);

          // Join socket room
          socketRef.current.emit("join_chat", { chatId });
        } catch (error) {
          console.error("Error fetching chat:", error);
          toast.error("Failed to load conversation");
        }
      };

      fetchChatData();
    } else {
      setCurrentChat(null);
      setMessages([]);
    }
  }, [chatId, user._id, navigate]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    try {
      const response = await axiosInstance.post(`/chat/${chatId}/messages`, {
        content: newMessage,
      });

      // Clear input and add message optimistically
      setNewMessage("");
      setMessages((prev) => [...prev, response.data]);

      // Emit socket event for real-time update
      socketRef.current.emit("new_message", {
        chatId,
        message: response.data,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) =>
    chat.buyer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-gray-600">Communicate with your buyers</p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex h-[70vh]">
          {/* Chat Sidebar */}
          <div className="w-1/3 border-r">
            <div className="p-4 border-b">
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
              style={{ height: "calc(70vh - 73px)" }}
            >
              {filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => navigate(`/seller/messages/${chat._id}`)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b ${
                      chatId === chat._id ? "bg-gray-100" : ""
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex justify-between">
                        <p className="font-medium">{chat.buyer.name}</p>
                        <p className="text-xs text-gray-500">
                          {chat.lastMessage?.createdAt ? (
                            format(
                              new Date(chat.lastMessage.createdAt),
                              "MMM d"
                            )
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                        </p>
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

          {/* Chat Area */}
          {chatId && currentChat ? (
            <div className="w-2/3 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/seller/messages")}
                    className="mr-2 md:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="font-medium">{currentChat.buyer.name}</h2>
                    <p className="text-xs text-gray-500">
                      {currentChat.buyer.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isSender = message.senderId === user._id;
                    const isFirstInGroup =
                      index === 0 ||
                      messages[index - 1].senderId !== message.senderId;
                    const isLastInGroup =
                      index === messages.length - 1 ||
                      messages[index + 1]?.senderId !== message.senderId;

                    return (
                      <div
                        key={message._id || index}
                        className={`flex items-end gap-2 ${
                          isSender ? "justify-start" : "justify-end"
                        }`}
                      >
                        {/* Show avatar for sent messages on left side */}
                        {isSender && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 max-w-[70%]">
                          {isSender && isFirstInGroup && (
                            <span className="text-xs text-gray-500 ml-2">
                              You
                            </span>
                          )}
                          {!isSender && isFirstInGroup && (
                            <span className="text-xs text-gray-500 mr-2 text-right">
                              {currentChat.buyer.name}
                            </span>
                          )}
                          <div
                            className={`relative px-4 py-2 rounded-2xl ${
                              isSender
                                ? "bg-white border"
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
                                isSender ? "text-gray-500" : "text-white/70"
                              }`}
                            >
                              <span>
                                {format(new Date(message.createdAt), "HH:mm")}
                              </span>
                              {isSender && message.status && (
                                <span>
                                  {message.status === "READ"
                                    ? "✓✓"
                                    : message.status === "DELIVERED"
                                    ? "✓✓"
                                    : "✓"}
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
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="w-2/3 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
    </div>
  );
};

export default SellerMessages;
