import React from 'react';

// Enhanced Order Context Component for Chat Messages
export const OrderContextCard = ({ orderData }) => {
  if (!orderData) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <span className="text-xs font-medium text-blue-800">Order #{orderData.orderNumber}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
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
};

// Enhanced Product Context Component for Chat Messages
export const ProductContextCard = ({ productData }) => {
  if (!productData) return null;

  return (
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
};

// Quick Actions Component for Chat
export const ChatQuickActions = ({ onShareProduct, onRequestSupport, onViewOrders }) => {
  return (
    <div className="flex gap-2 p-3 border-t bg-gray-50">
      <button
        onClick={onShareProduct}
        className="flex-1 text-xs py-2 px-3 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-md transition-colors"
      >
        📦 Share Product
      </button>
      <button
        onClick={onViewOrders}
        className="flex-1 text-xs py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition-colors"
      >
        📋 My Orders
      </button>
      <button
        onClick={onRequestSupport}
        className="flex-1 text-xs py-2 px-3 bg-green-100 hover:bg-green-200 text-green-800 rounded-md transition-colors"
      >
        🆘 Get Help
      </button>
    </div>
  );
};

// Enhanced Message Component
export const EnhancedMessage = ({ message, user, formatTime }) => {
  const isOwn = message.sender === user._id;

  return (
    <div className={`text-sm max-w-[85%] ${isOwn ? "ml-auto bg-orange-100" : "mr-auto bg-white"} px-3 py-2 rounded-xl shadow-sm`}>
      {/* Order Reference */}
      {message.metadata?.type === "order_reference" && (
        <OrderContextCard orderData={message.metadata.orderData} />
      )}

      {/* Product Reference */}
      {message.metadata?.type === "product_reference" && (
        <ProductContextCard productData={message.metadata.productData} />
      )}

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="flex flex-col gap-2 mb-1">
          {message.attachments.map((att, idx) => (
            att.type === "image" ? (
              <a key={idx} href={att.url} target="_blank" rel="noreferrer">
                <img src={att.url} alt={att.name || "image"} className="max-w-[260px] max-h-[200px] rounded-md border" />
              </a>
            ) : (
              <a key={idx} href={att.url} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                {att.name || "Attachment"}
              </a>
            )
          ))}
        </div>
      )}

      {/* Message Content */}
      {message.content && <div>{message.content}</div>}

      {/* Timestamp */}
      {message.createdAt && (
        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2 justify-end">
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && (
            <span className="text-[10px] text-gray-400">
              {message.status === "read" ? "Seen" : "Sent"}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
