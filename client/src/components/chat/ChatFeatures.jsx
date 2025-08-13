import React from 'react';
import { MessageCircle, Phone, Mail, Package, Star, Clock } from 'lucide-react';

// Quick Contact Modal for Orders
export const QuickContactModal = ({ isOpen, onClose, order, onChatWithSeller, onEmailSeller, onCallSeller }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Contact Seller</h3>
            <p className="text-sm text-gray-600">Order #{order._id.slice(-6)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onChatWithSeller}
            className="w-full flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-orange-600" />
            <div className="text-left">
              <div className="font-medium text-orange-800">Live Chat</div>
              <div className="text-sm text-orange-600">Instant messaging with seller</div>
            </div>
          </button>

          <button
            onClick={onEmailSeller}
            className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <Mail className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-blue-800">Email</div>
              <div className="text-sm text-blue-600">Send detailed message via email</div>
            </div>
          </button>

          <button
            onClick={onCallSeller}
            className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
          >
            <Phone className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <div className="font-medium text-green-800">Phone Call</div>
              <div className="text-sm text-green-600">Direct phone contact</div>
            </div>
          </button>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Chat Shortcut Component for Product Cards
export const ChatShortcut = ({ product, onMessageSeller }) => {
  return (
    <button
      onClick={onMessageSeller}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm transition-colors"
    >
      <MessageCircle className="w-4 h-4" />
      <span>Chat with Seller</span>
    </button>
  );
};

// Enhanced Order Status with Communication Options
export const OrderStatusWithChat = ({ order, onContactSeller }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { 
          color: 'yellow', 
          icon: Clock, 
          message: 'Order is being processed',
          canContact: true,
          contactReason: 'Ask about processing time or make changes'
        };
      case 'processing':
        return { 
          color: 'blue', 
          icon: Package, 
          message: 'Order is being prepared',
          canContact: true,
          contactReason: 'Get updates on preparation status'
        };
      case 'shipped':
        return { 
          color: 'purple', 
          icon: Package, 
          message: 'Order is on the way',
          canContact: true,
          contactReason: 'Track shipment or delivery questions'
        };
      case 'delivered':
        return { 
          color: 'green', 
          icon: Star, 
          message: 'Order delivered successfully',
          canContact: true,
          contactReason: 'Product feedback or support'
        };
      default:
        return { 
          color: 'gray', 
          icon: Package, 
          message: 'Order status unknown',
          canContact: false,
          contactReason: ''
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            statusInfo.color === 'yellow' ? 'bg-yellow-100' :
            statusInfo.color === 'blue' ? 'bg-blue-100' :
            statusInfo.color === 'purple' ? 'bg-purple-100' :
            statusInfo.color === 'green' ? 'bg-green-100' :
            'bg-gray-100'
          }`}>
            <StatusIcon className={`w-5 h-5 ${
              statusInfo.color === 'yellow' ? 'text-yellow-600' :
              statusInfo.color === 'blue' ? 'text-blue-600' :
              statusInfo.color === 'purple' ? 'text-purple-600' :
              statusInfo.color === 'green' ? 'text-green-600' :
              'text-gray-600'
            }`} />
          </div>
          <div>
            <h4 className="font-medium capitalize">{order.status}</h4>
            <p className="text-sm text-gray-600">{statusInfo.message}</p>
          </div>
        </div>
        
        {statusInfo.canContact && (
          <button
            onClick={() => onContactSeller(order)}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contact</span>
          </button>
        )}
      </div>
      
      {statusInfo.canContact && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
          💡 {statusInfo.contactReason}
        </div>
      )}
    </div>
  );
};

// Floating Chat Button with Context
export const FloatingChatButton = ({ onOpen, unreadCount = 0, isMinimized = false }) => {
  return (
    <button
      onClick={onOpen}
      className={`fixed bottom-6 right-6 ${
        isMinimized ? 'w-12 h-12' : 'w-14 h-14'
      } bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:scale-110`}
    >
      <MessageCircle className={`${isMinimized ? 'w-5 h-5' : 'w-6 h-6'}`} />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

// Seller Quick Response Templates
export const SellerQuickResponses = ({ onSelectResponse }) => {
  const responses = [
    {
      category: "Greeting",
      templates: [
        "Hi! Thanks for your interest in our products! 😊",
        "Hello! How can I help you today?",
        "Welcome to our farm! What can I assist you with?"
      ]
    },
    {
      category: "Product Info",
      templates: [
        "This product is currently in stock and ready to ship!",
        "Let me share more details about this product...",
        "Would you like to see additional photos of this item?",
        "I can offer bulk pricing for larger quantities"
      ]
    },
    {
      category: "Shipping",
      templates: [
        "Standard delivery takes 1-2 business days",
        "We use special packaging to ensure safe delivery",
        "Shipping is free for orders over ₱500",
        "I can arrange same-day delivery for local orders"
      ]
    },
    {
      category: "Customer Service",
      templates: [
        "I'm here to help with any questions!",
        "Thank you for choosing our farm products",
        "Please let me know if you need anything else",
        "I'll check on that right away for you"
      ]
    }
  ];

  return (
    <div className="max-h-64 overflow-y-auto">
      {responses.map((category) => (
        <div key={category.category} className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">{category.category}</h4>
          <div className="space-y-1">
            {category.templates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => onSelectResponse(template)}
                className="w-full text-left text-xs p-2 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
