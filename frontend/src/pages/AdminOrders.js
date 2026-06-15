import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/axiosConfig';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
  const statusColors = {
    'pending': 'bg-gray-200 text-gray-800',
    'confirmed': 'bg-blue-200 text-blue-800',
    'processing': 'bg-orange-200 text-orange-800',
    'shipped': 'bg-purple-200 text-purple-800',
    'out_for_delivery': 'bg-yellow-200 text-yellow-800',
    'delivered': 'bg-green-200 text-green-800',
    'cancelled': 'bg-red-200 text-red-800',
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/tracking/admin/orders?status=${filter}`);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const message = prompt('Enter optional message for customer (or click OK to skip):');
      await api.put(`/tracking/${orderId}/status`, { 
        status: newStatus,
        message: message || undefined
      });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blinkit-yellow"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blinkit-dark mb-6">Order Management</h1>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full capitalize ${
              filter === status 
                ? 'bg-blinkit-yellow text-blinkit-dark font-semibold'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No orders found</p>
        ) : (
          orders.map(order => (
            <div key={order._id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <p className="font-semibold">Order #{order._id.slice(-8)}</p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.orderStatus]}`}>
                    {order.orderStatus}
                  </span>
                  <select
                    value={order.orderStatus}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:border-blinkit-yellow"
                  >
                    {statuses.filter(s => s !== 'all').map(status => (
                      <option key={status} value={status}>{status.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-600">Customer: {order.userId?.name || 'N/A'}</p>
                <p className="text-gray-600">Email: {order.userId?.email || 'N/A'}</p>
                <p className="text-gray-600">Total: ₹{order.totalAmount}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Items: {order.items.length} products</p>
                </div>
                <Link 
                  to={`/tracking/${order._id}`}
                  target="_blank"
                  className="inline-block mt-3 text-blinkit-yellow text-sm font-semibold"
                >
                  View Tracking →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminOrders;