/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import api from '../utils/axiosConfig';

// Icon mapping for ingredients
const getIngredientIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('mutton')) return '🍖';
  if (lowerName.includes('chicken')) return '🍗';
  if (lowerName.includes('onion')) return '🧅';
  if (lowerName.includes('ginger')) return '🫚';
  if (lowerName.includes('garlic')) return '🧄';
  if (lowerName.includes('rice')) return '🍚';
  if (lowerName.includes('milk')) return '🥛';
  if (lowerName.includes('butter')) return '🧈';
  if (lowerName.includes('sugar')) return '🍯';
  return '🍽️';
};

// States and Cities Data
const statesWithCities = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
  'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi'],
  'Karnataka': ['Bengaluru', 'Mysore', 'Mangalore', 'Hubli'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Saharanpur'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
  'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'],
  'Telangana': ['Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad'],
};

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [availableCities, setAvailableCities] = useState([]);
  const [savedAddress, setSavedAddress] = useState(null);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const navigate = useNavigate();

  const platformFee = 10;
  const grandTotal = (cartTotal || 0) + platformFee;

  // Load saved address
  useEffect(() => {
    const loadSavedAddress = async () => {
      try {
        const response = await api.get('/auth/addresses');
        if (response.data.success && response.data.addresses.length > 0) {
          const defaultAddress = response.data.addresses.find(addr => addr.isDefault) || response.data.addresses[0];
          setSavedAddress(defaultAddress);
          setAddress({
            fullName: defaultAddress.fullName || '',
            phone: defaultAddress.phone || '',
            address: defaultAddress.address || '',
            city: defaultAddress.city || '',
            state: defaultAddress.state || '',
            pincode: defaultAddress.pincode || '',
          });
          setIsNewAddress(false);
        } else {
          setIsNewAddress(true);
        }
      } catch (error) {
        console.error('Error loading saved address:', error);
        setIsNewAddress(true);
      }
    };
    loadSavedAddress();
  }, []);

  // Update cities when state changes
  useEffect(() => {
    if (address.state) {
      setAvailableCities(statesWithCities[address.state] || []);
      setAddress({ ...address, city: '' });
    }
  }, [address.state]);

  // Check login and cart
  useEffect(() => {
    const token = localStorage.getItem('freshbasket_token');
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (cartItems.length === 0 && !loading) {
      toast.error('Your cart is empty');
      navigate('/cart');
    }
  }, [cartItems, navigate, loading]);

  const saveAddressToBackend = async (addressToSave) => {
    try {
      await api.post('/auth/add-address', {
        ...addressToSave,
        isDefault: true
      });
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!address.fullName || !address.phone || !address.address || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill all address fields');
      return;
    }

    if (address.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Razorpay Order
      const orderResponse = await api.post('/payment/create-order', {
        amount: grandTotal,
      });

      const { order, key } = orderResponse.data;
      console.log('Razorpay Order created:', order);

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        setLoading(false);
        return;
      }

      // 3. Prepare order items for database
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price || 50,
      }));

      // 4. Open Razorpay Checkout
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: 'FreshBasket',
        description: `Order Payment`,
        order_id: order.id,
        handler: async (response) => {
          console.log('Razorpay success response:', response);
          
          try {
            // 5. Verify Payment and Save Order
            const verifyResponse = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: {
                items: orderItems,
                subtotal: cartTotal || 0,
                platformFee: platformFee,
                totalAmount: grandTotal,
                address: address,
              },
            });

            console.log('Verify response:', verifyResponse.data);

            if (verifyResponse.data.success) {
              // Save address for future
              if (isNewAddress || (savedAddress && JSON.stringify(savedAddress) !== JSON.stringify(address))) {
                await saveAddressToBackend(address);
              }
              
              clearCart();
              toast.success('Payment successful! Order placed.');
              navigate(`/invoice/${verifyResponse.data.orderId}`);
            } else {
              toast.error(verifyResponse.data.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
          email: localStorage.getItem('freshbasket_user') ? JSON.parse(localStorage.getItem('freshbasket_user')).email : '',
        },
        theme: {
          color: '#F3CE2D',
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
            setLoading(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-blinkit-dark mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Address Form */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Delivery Address</h2>
              {savedAddress && !isNewAddress && (
                <button
                  type="button"
                  onClick={() => setIsNewAddress(true)}
                  className="text-blinkit-yellow text-sm font-semibold"
                >
                  + Add New Address
                </button>
              )}
              {isNewAddress && savedAddress && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNewAddress(false);
                    setAddress(savedAddress);
                  }}
                  className="text-gray-500 text-sm font-semibold"
                >
                  ← Use Saved Address
                </button>
              )}
            </div>

            {!isNewAddress && savedAddress ? (
              <div className="border rounded-lg p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition" onClick={handlePayment}>
                <p className="font-semibold">{savedAddress.fullName}</p>
                <p className="text-gray-600 text-sm">{savedAddress.address}</p>
                <p className="text-gray-600 text-sm">{savedAddress.city}, {savedAddress.state} - {savedAddress.pincode}</p>
                <p className="text-gray-500 text-sm mt-1">📞 {savedAddress.phone}</p>
                <button className="w-full mt-4 bg-blinkit-yellow text-blinkit-dark py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
                  Pay ₹{grandTotal}
                </button>
              </div>
            ) : (
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blinkit-yellow"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value.slice(0, 10) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blinkit-yellow"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">State *</label>
                    <select
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value, city: '' })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blinkit-yellow bg-white"
                    >
                      <option value="">Select State</option>
                      {Object.keys(statesWithCities).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">City *</label>
                    <select
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      required
                      disabled={!address.state}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blinkit-yellow bg-white disabled:bg-gray-100"
                    >
                      <option value="">Select City</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Address *</label>
                  <textarea
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })}
                    required
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blinkit-yellow"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value.slice(0, 6) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blinkit-yellow"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blinkit-yellow text-blinkit-dark py-3 rounded-lg font-semibold hover:bg-yellow-400 transition disabled:opacity-50 mt-4"
                >
                  {loading ? 'Processing...' : `Pay ₹${grandTotal}`}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                    {getIngredientIcon(item.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blinkit-dark text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-semibold text-blinkit-dark">
                    ₹{(item.price || 50) * item.quantity}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{cartTotal || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-semibold">₹{platformFee}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blinkit-yellow">₹{grandTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;