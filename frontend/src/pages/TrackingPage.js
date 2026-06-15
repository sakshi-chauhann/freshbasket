import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Package, Truck, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axiosConfig';

const TrackingPage = () => {
  const { orderId } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  const fetchTracking = async () => {
    try {
      const response = await api.get(`/tracking/${orderId}`);
      setTracking(response.data.tracking);
    } catch (error) {
      console.error('Error fetching tracking:', error);
      toast.error('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gray-500',
      'confirmed': 'bg-blue-500',
      'processing': 'bg-orange-500',
      'shipped': 'bg-purple-500',
      'out_for_delivery': 'bg-yellow-500',
      'delivered': 'bg-green-500',
      'cancelled': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': <Clock className="w-6 h-6" />,
      'confirmed': <CheckCircle className="w-6 h-6" />,
      'processing': <Package className="w-6 h-6" />,
      'shipped': <Truck className="w-6 h-6" />,
      'out_for_delivery': <MapPin className="w-6 h-6" />,
      'delivered': <CheckCircle className="w-6 h-6" />,
      'cancelled': <AlertCircle className="w-6 h-6" />,
    };
    return icons[status] || <Package className="w-6 h-6" />;
  };

  const getProgressPercentage = (status) => {
    const progress = {
      'pending': 0,
      'confirmed': 20,
      'processing': 40,
      'shipped': 60,
      'out_for_delivery': 80,
      'delivered': 100,
      'cancelled': 0,
    };
    return progress[status] || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blinkit-yellow"></div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-600">Order not found</h2>
        <Link to="/" className="mt-4 inline-block text-blinkit-yellow">Go Home</Link>
      </div>
    );
  }

  const progress = getProgressPercentage(tracking.status);
  const isCancelled = tracking.status === 'cancelled';

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-blinkit-dark mb-2">Track Your Order</h1>
      <p className="text-gray-500 mb-8">Order ID: #{tracking.orderId.slice(-8)}</p>

      {/* Order Status Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${getStatusColor(tracking.status)} rounded-full flex items-center justify-center text-white`}>
              {getStatusIcon(tracking.status)}
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Status</p>
              <p className="text-xl font-bold capitalize">{tracking.status.replace('_', ' ')}</p>
            </div>
          </div>
          {tracking.estimatedDelivery && !isCancelled && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Estimated Delivery</p>
              <p className="font-semibold">{new Date(tracking.estimatedDelivery).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!isCancelled && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blinkit-yellow rounded-full h-2 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Order Placed</span>
              <span>Confirmed</span>
              <span>Preparing</span>
              <span>Shipped</span>
              <span>Out for Delivery</span>
              <span>Delivered</span>
            </div>
          </div>
        )}
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Order Timeline</h2>
        <div className="space-y-4">
          {tracking.timeline && tracking.timeline.length > 0 ? (
            tracking.timeline.slice().reverse().map((event, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 mt-2 rounded-full ${getStatusColor(event.status)}`}></div>
                  {index !== tracking.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 ml-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-semibold capitalize">{event.status.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500">{event.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No tracking history available</p>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
        <div className="space-y-3">
          {tracking.items && tracking.items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2 border-b">
              <span>{item.name} x{item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold">
            <span>Total Amount</span>
            <span>₹{tracking.totalAmount}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-semibold mb-2">Delivery Address</h3>
          <p className="text-gray-600">{tracking.address?.fullName}</p>
          <p className="text-gray-600">{tracking.address?.address}</p>
          <p className="text-gray-600">{tracking.address?.city}, {tracking.address?.state} - {tracking.address?.pincode}</p>
          <p className="text-gray-600">📞 {tracking.address?.phone}</p>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;