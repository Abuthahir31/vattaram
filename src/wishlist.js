import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import './wishlist.css';
import Navbar from './navbar';
import { auth } from './firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getProductImage = (product) => {
  if (product.imageUrl) return product.imageUrl;
  if (product.image) {
    if (product.image.startsWith('http')) return product.image;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${product.image.startsWith('/') ? product.image : '/' + product.image}`;
  }
  return 'https://i.imgur.com/YCa6FJD.jpg';
};

const Wishlist = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  // Check authentication status
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  // Fetch wishlist items
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        if (isAuthenticated) {
          const user = auth.currentUser;
          const idToken = await user.getIdToken();
          const response = await fetch(`${API_BASE_URL}/wishlist/${user.uid}`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          
          if (response.ok) {
            const items = await response.json();
            setWishlistItems(Array.isArray(items) ? items : []);
          }
        } else {
          const saved = localStorage.getItem('wishlistItems');
          setWishlistItems(saved ? JSON.parse(saved) : []);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        const saved = localStorage.getItem('wishlistItems');
        setWishlistItems(saved ? JSON.parse(saved) : []);
      }
    };

    fetchWishlist();
  }, [isAuthenticated]);

  // Fetch cart items
  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (isAuthenticated) {
          const user = auth.currentUser;
          const idToken = await user.getIdToken();
          const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          
          if (response.ok) {
            const items = await response.json();
            setCartItems(Array.isArray(items) ? items : []);
          }
        } else {
          const saved = localStorage.getItem('cartItems');
          setCartItems(saved ? JSON.parse(saved) : []);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        const saved = localStorage.getItem('cartItems');
        setCartItems(saved ? JSON.parse(saved) : []);
      }
    };

    fetchCart();
  }, [isAuthenticated]);

  // Sync with localStorage for guest users
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  // Handle navigation state
  useEffect(() => {
    if (location.state?.fromCart && location.state.wishlistItem) {
      const item = location.state.wishlistItem;
      setWishlistItems(prev => {
        const exists = prev.find(p => p.id === item.id || p._id === item.id);
        return exists ? prev : [...prev, item];
      });
      setNotification(location.state.message);
      setTimeout(() => setNotification(null), 3000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const addToCart = async (product) => {
    try {
      if (!product) throw new Error('Invalid product');

      const cartItem = {
        productId: product._id || product.id,
        name: product.name || 'Unnamed Product',
        image: getProductImage(product),
        category: product.category || 'General',
        district: product.district || 'South India',
        description: product.description || '',
        subtitle: product.subtitle || '',
        price: product.price || 0,
        weight: product.weight || '250g',
        quantity: 1,
        ratingValue: product.ratingValue || 0,
        variantIndex: product.variantIndex || 0,
        weightIndex: product.weightIndex || 0
      };

      if (isAuthenticated) {
        const user = auth.currentUser;
        const idToken = await user.getIdToken();
        
        // Check if item exists in cart
        const cartResponse = await fetch(`${API_BASE_URL}/cart`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        
        if (!cartResponse.ok) throw new Error('Failed to fetch cart');
        
        const existingCart = await cartResponse.json();
        const existingItem = existingCart.find(
          item => item.productId === cartItem.productId && item.weight === cartItem.weight
        );

        if (existingItem) {
          // Update quantity
          const updateResponse = await fetch(`${API_BASE_URL}/cart/${existingItem._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ quantity: existingItem.quantity + 1 })
          });

          if (!updateResponse.ok) throw new Error('Failed to update cart');
          
          const updatedItem = await updateResponse.json();
          setCartItems(prev => prev.map(item => 
            item._id === updatedItem._id ? updatedItem : item
          ));
          setNotification('✅ Item quantity updated in cart!');
        } else {
          // Add new item
          const response = await fetch(`${API_BASE_URL}/cart`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(cartItem)
          });

          if (!response.ok) throw new Error('Failed to add to cart');
          
          const newItem = await response.json();
          setCartItems(prev => [...prev, newItem]);
          setNotification('✅ Item added to cart!');
        }
      } else {
        // Guest user
        setCartItems(prev => {
          const currentCart = Array.isArray(prev) ? prev : [];
          const existsIndex = currentCart.findIndex(
            item => item.productId === cartItem.productId && item.weight === cartItem.weight
          );
          
          if (existsIndex !== -1) {
            const updated = [...currentCart];
            updated[existsIndex] = {
              ...updated[existsIndex],
              quantity: updated[existsIndex].quantity + 1
            };
            return updated;
          }
          
          return [...currentCart, { ...cartItem, id: cartItem.productId }];
        });
        setNotification('✅ Item added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setNotification(`⚠️ ${error.message || 'Failed to add to cart'}`);
    } finally {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      if (!productId) throw new Error('No product ID provided');

      const removedItem = wishlistItems.find(item => 
        item.id === productId || item._id === productId
      );
      
      if (isAuthenticated) {
        const user = auth.currentUser;
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/wishlist/${user.uid}/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${idToken}` }
        });

        if (!response.ok) throw new Error('Failed to remove from wishlist');
      }

      setWishlistItems(prev => 
        prev.filter(item => item.id !== productId && item._id !== productId)
      );
      setNotification(`❌ ${removedItem?.name || 'Item'} removed from wishlist`);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setNotification(`⚠️ ${error.message || 'Failed to remove from wishlist'}`);
    } finally {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getCartItemCount = () => {
    try {
      if (!Array.isArray(cartItems)) return 0;
      return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    } catch (error) {
      console.error('Error calculating cart count:', error);
      return 0;
    }
  };

  return (
    <div className="wishlist-page">
      <Navbar 
        cartItems={getCartItemCount()}
        wishlistCount={wishlistItems.length}
      />

      {notification && (
        <div className="wishlist-notif">{notification}</div>
      )}

      <div className="wishlist-header">
        <h1><Heart size={26} color="crimson" /> Your Wishlist ({wishlistItems.length})</h1>
        <button
          className="back-btn"
          onClick={() => navigate('/shop', {
            state: {
              from: 'wishlist',
              message: '🛍️ Continue shopping for more delicious items!',
            },
          })}
        >
          <ArrowLeft size={18} /> Back to Shopping
        </button>
      </div>

      <div className="wishlist-container">
        {wishlistItems.length === 0 ? (
          <div className="empty-wishlist">
            <Heart size={48} color="crimson" />
            <h2>Your wishlist is empty</h2>
            <p>Explore and add items to your wishlist.</p>
            <button onClick={() => navigate('/shop')}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlistItems.map((item) => (
              <div key={item.id || item._id} className="wishlist-card">
                <img 
                  src={getProductImage(item)} 
                  alt={item.name} 
                  className="wishlist-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://i.imgur.com/YCa6FJD.jpg';
                  }}
                />
                <div className="wishlist-details">
                  <h4>{item.name}</h4>
                  {item.description && <p className="item-description">{item.description}</p>}
                  <p className="price">₹{item.price}</p>
                  {item.weight && <p className="weight">Weight: {item.weight}</p>}
                </div>
                <div className="wishlist-actions">
                  <button 
                    className="add-cart" 
                    onClick={() => addToCart(item)}
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                  <button 
                    className="remove-wish" 
                    onClick={() => removeFromWishlist(item.id || item._id)}
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;