import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { axiosInstance } from "@/contexts/axios";
import { socketService } from "@/services/socket";
import { Loader2, Send, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import toast from "react-hot-toast";

const ChatPage = () => {
  const { user } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      socketService.connect(token);
    }

    return () => {
      if (chatId) {
        socketService.leaveChat(chatId);
      }
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (chatId) {
      socketService.joinChat(chatId);
      fetchMessages();
    }
    fetchChats();
  }, [chatId]);

  useEffect(() => {
    socketService.onNewMessage((data) => {
      if (data.chatId === chatId) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      }
      // Update chat list with latest message
      setChats((prev) =>
        prev.map((chat) =>
          chat._id === data.chatId
            ? { ...chat, lastMessage: data.message }
            : chat
        )
      );
    });

    socketService.onMessageStatus((data) => {
      if (data.chatId === chatId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, status: data.status } : msg
          )
        );
      }
    });

    socketService.onTyping((data) => {
      if (data.chatId === chatId) {
        if (data.isTyping) {
          setTypingUsers((prev) => new Set([...prev, data.userId]));
        } else {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      }
    });
  }, [chatId]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    try {
      const response = await axiosInstance.get("/chat");
      setChats(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load chats");
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axiosInstance.get(`/chat/${chatId}/messages`);
      setMessages(response.data);
      const chatResponse = await axiosInstance.get(`/chat/${chatId}`);
      setCurrentChat(chatResponse.data);
      scrollToBottom();
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Failed to load messages");
    }
  };

  const handleTyping = (isTyping) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socketService.sendTyping(chatId, isTyping);

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(chatId, false);
      }, 3000);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping(true);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axiosInstance.post(`/chat/${chatId}/messages`, {
        content: newMessage,
      });

      const message = response.data;
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      handleTyping(false);
      scrollToBottom();

      socketService.sendMessage(chatId, message);
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.seller.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              icon={<Search className="h-4 w-4 text-gray-400" />}
            />
          </div>
          <div className="space-y-2">
            {filteredChats.map((chat) => (
              <div
                key={chat._id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  chatId === chat._id ? "bg-primary/10" : "hover:bg-gray-50"
                }`}
                onClick={() => navigate(`/chat/${chat._id}`)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {user.isSeller ? chat.buyer.name : chat.seller.name}
                  </h3>
                  {chat.lastMessage && (
                    <span className="text-xs text-gray-500">
                      {format(new Date(chat.lastMessage.createdAt), "HH:mm")}
                    </span>
                  )}
                </div>
                {chat.lastMessage && (
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="md:col-span-2">
          {chatId ? (
            <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/chat")}
                  className="mr-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                {currentChat && (
                  <div>
                    <h2 className="text-lg font-semibold">
                      {user.isSeller
                        ? currentChat.buyer.name
                        : currentChat.seller.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {typingUsers.size > 0 ? "Typing..." : "Online"}
                    </p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
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
                      <div
                        className={`text-xs mt-1 ${
                          message.senderId === user._id
                            ? "text-white/70"
                            : "text-gray-500"
                        }`}
                      >
                        {format(new Date(message.createdAt), "HH:mm")}
                        {message.senderId === user._id && (
                          <span className="ml-2">{message.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md h-[600px] flex items-center justify-center">
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
