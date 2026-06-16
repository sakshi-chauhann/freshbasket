import React, { useState, useEffect, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import axios from 'axios';

const categories = [
  'Vegetables & Fruits',
  'Dairy & Breakfast',
  'Meat & Fish',
  'Personal Care',
  'Cold Drinks & Juices',
  'Pasta & Noodles',
  'Bakery & Snacks',
  'Cleaning Essentials',
];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const featuredRef = useRef(null);

  // Fetch real products from backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://freshbasket-ppj4.onrender.com/api/products');
      setProducts(response.data.products);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  // Scroll to featured products
  const scrollToFeatured = () => {
    featuredRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Show only first 8 products on home page
  const featuredProducts = products.slice(0, 8);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blinkit-yellow"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-blinkit-yellow to-yellow-400 mx-4 mt-4 rounded-2xl overflow-hidden">
        <div className="p-8 md:p-12">
          <h1 className="text-3xl md:text-5xl font-bold text-blinkit-dark">
            Grocery delivery<br />
            <span className="text-white">in 10 minutes</span>
          </h1>
          <p className="mt-4 text-blinkit-dark/80 text-lg">
            Fresh groceries delivered to your doorstep
          </p>
          <button 
            onClick={scrollToFeatured}
            className="mt-6 bg-blinkit-dark text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
          >
            Shop Now
          </button>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600" 
          alt="Groceries"
          className="absolute right-0 top-0 h-full w-1/3 object-cover opacity-20 md:opacity-100"
        />
      </div>

      {/* Categories Section */}
      <div className="container mx-auto px-4 mt-8">
        <h2 className="text-2xl font-bold text-blinkit-dark mb-4">Shop by Category</h2>
        <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
          {categories.map((category, index) => (
            <CategoryCard key={index} category={category} />
          ))}
        </div>
      </div>

      {/* Featured Products */}
<div ref={featuredRef} className="container mx-auto px-4 mt-12">
  <h2 className="text-xl md:text-2xl font-bold text-blinkit-dark mb-4 md:mb-6">Featured Products</h2>
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
    {featuredProducts.map(product => (
      <ProductCard key={product._id} product={product} />
    ))}
  </div>
</div>

      {/* Footer */}
      <footer className="bg-blinkit-dark text-white mt-16 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blinkit-yellow rounded-full flex items-center justify-center">
                  <span className="text-blinkit-dark font-bold text-xl">FB</span>
                </div>
                <span className="font-bold text-xl">FreshBasket</span>
              </div>
              <p className="text-gray-400 text-sm">
                Fresh groceries delivered to your doorstep in 10 minutes.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-3">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/" className="hover:text-blinkit-yellow transition">Home</a></li>
                <li><a href="/products" className="hover:text-blinkit-yellow transition">Shop</a></li>
                <li><a href="/recipe" className="hover:text-blinkit-yellow transition">What to Cook?</a></li>
                <li><a href="/contact" className="hover:text-blinkit-yellow transition">Contact Us</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-3">Categories</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Vegetables & Fruits</li>
                <li>Dairy & Breakfast</li>
                <li>Meat & Fish</li>
                <li>Bakery & Snacks</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-3">Contact Us</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>📞 +91 6396476500</li>
                <li>📧 support@freshbasket.com</li>
                <li>📍 India</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
            <p>&copy; 2026 FreshBasket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;