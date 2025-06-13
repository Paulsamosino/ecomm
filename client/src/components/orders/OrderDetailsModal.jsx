import React from 'react';
import { X, Package, User, Calendar, CreditCard, Truck, MapPin } from 'lucide-react';

export default function OrderDetailsModal({ order, onClose, onStatusUpdate }) {
  if (!order) return null;

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Order #{order._id.slice(-8).toUpperCase()}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Order Date</span>
                  </div>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span>Total Amount</span>
                  </div>
                  <p className="font-medium text-lg">₱{order.totalAmount?.toFixed(2)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="h-4 w-4 mr-2" />
                    <span>Status</span>
                  </div>
                  <select
                    className="px-3 py-1 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={order.status}
                    onChange={(e) => onStatusUpdate(order._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer & Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2 text-primary" />
                  Customer
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{order.buyer?.name}</p>
                  <p className="text-gray-600">{order.buyer?.email}</p>
                  <p className="text-gray-600">{order.shippingAddress?.phone}</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  Shipping Address
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.shippingAddress?.name}</p>
                  <p className="text-gray-600">{order.shippingAddress?.street}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                  </p>
                  <p className="text-gray-600">{order.shippingAddress?.country}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h4 className="font-medium text-gray-900">Order Items</h4>
              </div>
              <div className="divide-y">
                {order.items?.map((item, index) => (
                  <div key={index} className="p-4">
                    <div className="flex">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-200">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h5 className="font-medium text-gray-900">
                            {item.product?.name || 'Product not found'}
                          </h5>
                          <p className="ml-4 font-medium">₱{item.price?.toFixed(2)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          Subtotal: ₱{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t bg-gray-50 px-4 py-3">
                <div className="flex justify-between text-sm font-medium text-gray-900">
                  <p>Total</p>
                  <p>₱{order.totalAmount?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Handle print or other actions
                window.print();
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Print Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
