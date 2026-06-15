import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/axiosConfig';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status
  useEffect(() => {
    const token = localStorage.getItem('freshbasket_token');
    setIsLoggedIn(!!token);
  }, []);

  // Load cart from database when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadCartFromDB();
    } else {
      // Load from localStorage when not logged in
      const savedCart = localStorage.getItem('freshbasket_cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(items);
        updateTotals(items);
      }
      setLoading(false);
    }
  }, [loadCartFromDB]);

  const loadCartFromDB = async () => {
    try {
      const response = await api.get('/cart');
      const dbCart = response.data.cart;
      const items = dbCart.items.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        weight: item.weight,
        image: item.image,
        quantity: item.quantity,
        variant: item.variant || 'Standard',
      }));
      setCartItems(items);
      updateTotals(items);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTotals = (items) => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartCount(count);
    setCartTotal(total);
  };

  const saveToLocalStorage = (items) => {
    localStorage.setItem('freshbasket_cart', JSON.stringify(items));
  };

  // FIXED: addToCart with string ID support
  const addToCart = async (product, quantity = 1) => {
    const newItems = [...cartItems];
    const itemKey = product.variant ? `${product.id}_${product.variant}` : product.id;
    const existingIndex = newItems.findIndex(item => {
      const existingKey = item.variant ? `${item.id}_${item.variant}` : item.id;
      return existingKey === itemKey;
    });
    
    if (existingIndex > -1) {
      newItems[existingIndex].quantity += quantity;
    } else {
      newItems.push({ ...product, quantity });
    }
    
    setCartItems(newItems);
    updateTotals(newItems);
    
    if (isLoggedIn) {
      try {
        await api.post('/cart/add', { 
          productId: product.id, 
          quantity,
          variant: product.variant || 'Standard',
          variantName: product.variant,
          price: product.price,
          name: product.name,
          weight: product.weight,
          image: product.image
        });
        await loadCartFromDB();
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    } else {
      saveToLocalStorage(newItems);
    }
  };

  // FIXED: updateQuantity with string ID
  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const idString = productId.toString();
    const newItems = cartItems.map(item =>
      item.id.toString() === idString ? { ...item, quantity } : item
    );
    
    setCartItems(newItems);
    updateTotals(newItems);
    
    if (isLoggedIn) {
      try {
        await api.put(`/cart/update/${idString}`, { quantity });
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    } else {
      saveToLocalStorage(newItems);
    }
  };

  // FIXED: removeFromCart with string ID
  const removeFromCart = async (productId) => {
    const idString = productId.toString();
    const newItems = cartItems.filter(item => item.id.toString() !== idString);
    setCartItems(newItems);
    updateTotals(newItems);
    
    if (isLoggedIn) {
      try {
        await api.delete(`/cart/remove/${idString}`);
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
    } else {
      saveToLocalStorage(newItems);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    updateTotals([]);
    
    if (isLoggedIn) {
      try {
        await api.delete('/cart/clear');
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    } else {
      saveToLocalStorage([]);
    }
  };

  const syncCartAfterLogin = async () => {
    const localCart = cartItems;
    try {
      await api.post('/cart/sync', { localCart });
      await loadCartFromDB();
      localStorage.removeItem('freshbasket_cart');
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartTotal,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      syncCartAfterLogin,
    }}>
      {children}
    </CartContext.Provider>
  );
};