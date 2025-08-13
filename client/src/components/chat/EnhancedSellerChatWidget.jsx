import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { 
  MessageCircle, 
  X, 
  Send, 
  Image, 
  Smile, 
  Phone, 
  Video, 
  MoreHorizontal,
  Package,
  Clock,
  CheckCircle,
  ShoppingBag,
  Star,
  Copy,
  Share,
  Users,
  TrendingUp,
  MessageSquare,
  AlertCircle
} from "lucide-react";

const getSocketUrl = () => {
  const http = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
  return http;
};

const EnhancedSellerChatWidget = () => {
  const { user } = useAuth();
  const isSeller = !!user && user.isSeller;

  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [quickReplies] = useState([
    "Thank you for your interest! 😊",
    "This product is currently in stock",
    "Delivery usually takes 1-2 business days",
    "Let me check that for you...",
    "Would you like to see more photos?",
    "I can offer a discount for bulk orders"
  ]);

  const socketRef = useRef(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  const otherName = useMemo(() => {
    if (!active?.participants || !user?._id) return "Customer";
    const others = active.participants.filter((p) => p._id !== user._id);
    return others[0]?.name || "Customer";
  }, [active, user?._id]);

  // Socket connection
  useEffect(() => {
    if (!isSeller || !open) return;
    const socket = io(getSocketUrl(), { transports: ["websocket"], withCredentials: true });
    socketRef.current = socket;

    // Listen for new messages
    socket.on("new_message", (data) => {
      if (data.chatId === active?._id) {
        setMessages(prev => [...prev, data.message]);
      }
      // Update unread count
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isSeller, open, active?._id]);

  // Load chats
  useEffect(() => {
    const loadChats = async () => {
      if (!isSeller || !open) return;
      try {
        const res = await api.get("/chat");
        setChats(res.data || []);
        // Calculate unread count
        const unread = (res.data || []).reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        setUnreadCount(unread);
      } catch (error) {
        console.error("Failed to load chats:", error);
      }
    };
    loadChats();
  }, [isSeller, open]);

  // Load messages for active chat
  useEffect(() => {
    if (!active?._id || !open || !isSeller) return;
    const loadMessages = async () => {
      try {
        const msgs = await api.get(`/chat/${active._id}/messages?limit=50`);
        setMessages(msgs.data.messages || []);
        // Mark as read
        await api.post(`/chat/${active._id}/read`);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    loadMessages();
  }, [active?._id, open, isSeller]);

  const onSend = async (e, customMessage = null) => {
    e?.preventDefault();
    const text = customMessage || input.trim();
    if (!text || !active?._id) return;
    
    try {
      setInput("");
      const { data } = await api.post(`/chat/${active._id}/messages`, { content: text });
      setMessages(prev => [...prev, data]);
      
      // Refresh chat list
      const res = await api.get("/chat");
      setChats(res.data || []);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const QuickActionButton = ({ icon: Icon, label, onClick, color = "orange" }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${color === "orange" ? "bg-orange-100 text-orange-700 hover:bg-orange-200" :
          color === "blue" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
          color === "green" ? "bg-green-100 text-green-700 hover:bg-green-200" :
          "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  const OrderCard = ({ orderData }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">Order #{orderData.orderNumber}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          orderData.status === "delivered" ? "bg-green-100 text-green-800" :
          orderData.status === "shipped" ? "bg-purple-100 text-purple-800" :
          orderData.status === "processing" ? "bg-blue-100 text-blue-800" :
          "bg-yellow-100 text-yellow-800"
        }`}>
          {orderData.status}
        </span>
      </div>
      <div className="text-xs text-gray-600 space-y-1">
        <div>Items: {orderData.items.map(item => `${item.name} (${item.quantity})`).join(", ")}</div>
        <div>Total: ₱{orderData.totalAmount.toLocaleString()}</div>
        <div>Date: {new Date(orderData.createdAt).toLocaleDateString()}</div>
      </div>
    </div>
  );

  const ProductCard = ({ productData }) => (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
          <img 
            src={productData.image || "/1f425.png"} 
            alt={productData.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">{productData.name}</div>
          <div className="text-xs text-gray-600">₱{productData.price.toLocaleString()}</div>
          <div className="text-xs text-orange-600">{productData.category}</div>
        </div>
      </div>
      <button 
        onClick={() => window.open(`/products/${productData._id}`, '_blank')}
        className="mt-2 w-full text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 py-1.5 rounded-md transition-colors"
      >
        View Product
      </button>
    </div>
  );

  const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
        isOwn ? 'bg-orange-500 text-white' : 'bg-white border shadow-sm'
      }`}>
        {message.metadata?.type === "order_reference" && (
          <OrderCard orderData={message.metadata.orderData} />
        )}
        {message.metadata?.type === "product_reference" && (
          <ProductCard productData={message.metadata.productData} />
        )}
        {message.attachments?.map((att, idx) => (
          att.type === "image" ? (
            <img key={idx} src={att.url} alt="attachment" className="max-w-full rounded-lg mb-2" />
          ) : (
            <a key={idx} href={att.url} className="text-blue-600 underline block mb-2">
              {att.name || "Attachment"}
            </a>
          )
        ))}
        {message.content && <div className="text-sm">{message.content}</div>}
        <div className={`text-xs mt-1 ${isOwn ? 'text-orange-100' : 'text-gray-500'}`}>
          {formatTime(message.createdAt)}
          {isOwn && message.status === "read" && <span className="ml-2">✓✓</span>}
        </div>
      </div>
    </div>
  );

  if (!isSeller) return null;

  return (
    <>
      {/* Chat Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">{active ? `Chat with ${otherName}` : "Customer Messages"}</h3>
                {active && <p className="text-xs text-orange-100">Seller Dashboard</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {active && (
                <>
                  <button className="p-1.5 hover:bg-orange-600 rounded-lg">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="p-1.5 hover:bg-orange-600 rounded-lg"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </>
              )}
              <button 
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-orange-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions Panel */}
          {showQuickActions && active && (
            <div className="p-3 bg-gray-50 border-b">
              <div className="grid grid-cols-2 gap-2">
                <QuickActionButton 
                  icon={Package} 
                  label="View Order" 
                  onClick={() => window.open('/seller/orders', '_blank')}
                  color="blue"
                />
                <QuickActionButton 
                  icon={TrendingUp} 
                  label="Analytics" 
                  onClick={() => window.open('/seller/analytics', '_blank')}
                  color="green"
                />
                <QuickActionButton 
                  icon={Users} 
                  label="Customer Info" 
                  onClick={() => {/* TODO: Show customer details */}}
                />
                <QuickActionButton 
                  icon={AlertCircle} 
                  label="Report Issue" 
                  onClick={() => {/* TODO: Report customer */}}
                  color="red"
                />
              </div>
            </div>
          )}

          {/* Content */}
          {!active ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Stats */}
              <div className="p-4 bg-orange-50 border-b">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{chats.length}</div>
                    <div className="text-xs text-gray-600">Conversations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
                    <div className="text-xs text-gray-600">Unread</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">95%</div>
                    <div className="text-xs text-gray-600">Response Rate</div>
                  </div>
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Customer Conversations
                  </h4>
                  {chats.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">No customer messages yet</p>
                      <p className="text-xs text-gray-400 mt-1">Customers can message you about your products</p>
                    </div>
                  ) : (
                    chats.map((chat) => {
                      const others = chat.participants.filter(p => p._id !== user._id);
                      const customerName = others[0]?.name || "Anonymous Customer";
                      const hasUnread = chat.unreadCount > 0;
                      
                      return (
                        <button
                          key={chat._id}
                          onClick={() => setActive(chat)}
                          className={`w-full p-3 text-left hover:bg-gray-50 rounded-lg border transition-colors ${
                            hasUnread ? 'bg-orange-50 border-orange-200' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium text-sm ${hasUnread ? 'text-orange-800' : ''}`}>
                                  {customerName}
                                </p>
                                {hasUnread && (
                                  <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {chat.unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {chat.lastMessage || "Start conversation..."}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatTime(chat.lastMessageAt)}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div ref={listRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages with {otherName} yet</p>
                    <p className="text-sm mt-1">Send a friendly greeting to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble 
                      key={message._id} 
                      message={message} 
                      isOwn={message.sender === user._id} 
                    />
                  ))
                )}
                {isOtherTyping && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-white rounded-2xl px-4 py-2 border">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Replies */}
              {quickReplies.length > 0 && (
                <div className="p-3 bg-gray-50 border-t">
                  <div className="text-xs text-gray-600 mb-2">Quick Replies:</div>
                  <div className="flex flex-wrap gap-1">
                    {quickReplies.slice(0, 3).map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => onSend(e, reply)}
                        className="text-xs bg-white border rounded-full px-3 py-1 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t bg-white">
                <form onSubmit={onSend} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Reply to ${otherName}...`}
                      className="w-full border rounded-2xl px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                      rows={1}
                      style={{ maxHeight: 100 }}
                    />
                  </div>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // TODO: Handle file upload
                      }
                    }}
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Image className="w-5 h-5 text-gray-600" />
                  </button>
                  <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>
                  <button type="submit" className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default EnhancedSellerChatWidget;
