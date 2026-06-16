import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axiosConfig';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Check if product is in wishlist
  useEffect(() => {
    checkWishlistStatus();
  }, []);

  const checkWishlistStatus = async () => {
    const token = localStorage.getItem('freshbasket_token');
    if (!token) return;
    
    try {
      const response = await api.get(`/wishlist/check/${product._id}`);
      setIsInWishlist(response.data.isInWishlist);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('freshbasket_token');
    if (!token) {
      toast.error('Please login to add to wishlist');
      return;
    }
    
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await api.delete(`/wishlist/remove/${product._id}`);
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/wishlist/add', { productId: product._id });
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product.inStock) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }
    
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      weight: product.weight,
    }, quantity);
    toast.success(`${product.name} added to cart!`);
  };

  if (!product) {
    return <div className="animate-pulse bg-gray-200 rounded-xl h-48 sm:h-56 md:h-80"></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
      {/* Product Image - Responsive height */}
      <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 overflow-hidden bg-gray-100">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
          }}
        />
        
        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold rotate-12">
              OUT OF STOCK
            </span>
          </div>
        )}
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-white rounded-full p-1.5 sm:p-2 shadow-md hover:scale-110 transition disabled:opacity-50"
        >
          <Heart 
            className={`w-4 h-4 sm:w-5 sm:h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
          />
        </button>
      </div>

      <div className="p-2 sm:p-3 md:p-4">
        <h3 className="font-semibold text-sm sm:text-base md:text-lg text-blinkit-dark truncate">{product.name}</h3>
        <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-1">{product.description || 'Fresh grocery item'}</p>

        <div className="mt-2 sm:mt-3 flex items-center justify-between">
          <div>
            <span className="text-base sm:text-lg md:text-xl font-bold text-blinkit-dark">₹{product.price}</span>
            {product.weight && (
              <span className="text-xs text-gray-500 ml-1">/{product.weight}</span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={!product.inStock}
              className="border border-gray-300 rounded-lg px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm focus:outline-none disabled:opacity-50"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>

            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`px-2 sm:px-3 md:px-4 py-0.5 sm:py-1 md:py-1.5 rounded-lg font-semibold transition text-xs sm:text-sm ${
                product.inStock 
                  ? 'bg-blinkit-yellow text-blinkit-dark hover:bg-yellow-400' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {product.inStock ? 'Add' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;