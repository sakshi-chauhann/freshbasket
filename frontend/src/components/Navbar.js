import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { cartCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  const isLoggedIn = localStorage.getItem('freshbasket_token');

  useEffect(() => {
    const userData = localStorage.getItem('freshbasket_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

     const handleStorageChange = () => {
    const updatedUser = localStorage.getItem('freshbasket_user');
    if (updatedUser) {
      setUser(JSON.parse(updatedUser));
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
  
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('freshbasket_token');
    localStorage.removeItem('freshbasket_user');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
            <div className="w-10 h-10 bg-blinkit-yellow rounded-full flex items-center justify-center">
              <span className="text-blinkit-dark font-bold text-xl">FB</span>
            </div>
            <span className="font-bold text-2xl text-blinkit-dark">FreshBasket</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search for groceries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:border-blinkit-yellow"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Admin Link - Desktop */}
            {user?.role === 'admin' && (
              <Link to="/admin/products" className="hidden md:flex items-center gap-1 text-gray-700 hover:text-blinkit-yellow transition">
                <span className="text-xl">📦</span>
                <span className="text-sm font-medium">Admin</span>
              </Link>
            )}

            {/* Recipe Link - Desktop */}
            <Link to="/recipe" className="hidden md:flex items-center gap-1 text-gray-700 hover:text-blinkit-yellow transition">
              <span className="text-xl">🍳</span>
              <span className="text-sm font-medium">What to Cook?</span>
            </Link>

            <Link to="/cart" className="relative">
              <span className="text-2xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blinkit-yellow text-blinkit-dark text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link to="/wishlist" className="relative">
              <span className="text-2xl">❤️</span>
            </Link>

            {isLoggedIn ? (
              <div className="relative flex items-center gap-2">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  {user && <span className="text-sm text-gray-600 hidden md:inline">Hi, {user.name || 'User'}</span>}
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 top-full w-56 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link to="/my-orders" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>
                      My Orders
                    </Link>
                    <Link to="/wishlist" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>
                      ❤️ Wishlist
                    </Link>
                    <Link to="/recipe" className="block px-4 py-2 hover:bg-gray-100 border-t" onClick={() => setIsMenuOpen(false)}>
                      🍳 What to Cook?
                    </Link>
                    {user?.role === 'admin' && (
                      <>
                        <Link to="/admin/products" className="block px-4 py-2 hover:bg-gray-100 border-t" onClick={() => setIsMenuOpen(false)}>
                          📦 Products
                        </Link>
                        <Link to="/admin/orders" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>
                          📋 Manage Orders
                        </Link>
                      </>
                    )}
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 border-t">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="bg-blinkit-yellow text-blinkit-dark px-4 py-2 rounded-full font-semibold whitespace-nowrap">
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button className="md:hidden text-2xl p-1" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Search - Always visible on mobile */}
        <div className="md:hidden mt-3">
          <form onSubmit={handleSearch}>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search for groceries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-full border border-gray-300 focus:outline-none focus:border-blinkit-yellow text-sm"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;