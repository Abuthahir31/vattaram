import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Truck } from 'lucide-react';
import Navbar from '../navbar';
import './cart.css';
import { auth } from '../firebase';

const CartPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    const storedCart = localStorage.getItem('cartItems');
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const newCartItem = location.state?.cartItem || null;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      if (user) {
        fetchUserCart();
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserCart = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setIsLoading(true);
      const idToken = await user.getIdToken();
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
        localStorage.setItem('cartItems', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (newCartItem) {
      handleAddItem(newCartItem);
    }
  }, [newCartItem]);

  const handleAddItem = async (item) => {
    try {
      const existsIndex = cartItems.findIndex(
        cartItem => cartItem.productId === item.productId && cartItem.weight === item.weight
      );

      let updatedCart;
      let isNewItem = false;

      if (existsIndex !== -1) {
        updatedCart = [...cartItems];
        updatedCart[existsIndex] = {
          ...updatedCart[existsIndex],
          quantity: item.quantity
        };
      } else {
        updatedCart = [...cartItems, item];
        isNewItem = true;
      }

      setCartItems(updatedCart);
      localStorage.setItem('cartItems', JSON.stringify(updatedCart));

      if (isAuthenticated) {
        const user = auth.currentUser;
        const idToken = await user.getIdToken();
        await fetch('http://localhost:5000/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(item)
        });
      }

      if (isNewItem) {
        showNotification(`✅ ${item.name} (${item.weight}) added to cart`, 'success');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Failed to update cart', 'error');
    }
  };

  const updateQuantity = async (productId, weight, change) => {
    try {
      const updated = cartItems.map(item => {
        if (item.productId === productId && item.weight === weight) {
          const newQuantity = Math.max(1, Math.min(5, item.quantity + change));
          return { ...item, quantity: newQuantity };
        }
        return item;
      });

      setCartItems(updated);
      localStorage.setItem('cartItems', JSON.stringify(updated));

      if (isAuthenticated) {
        const item = updated.find(i => i.productId === productId && i.weight === weight);
        if (item) {
          const user = auth.currentUser;
          const idToken = await user.getIdToken();
          await fetch(`http://localhost:5000/api/cart/${item._id || ''}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ quantity: item.quantity })
          });
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('Failed to update quantity', 'error');
    }
  };

  const removeItem = async (productId, weight) => {
    try {
      const removedItem = cartItems.find(
        item => item.productId === productId && item.weight === weight
      );
      if (!removedItem) return;

      const updated = cartItems.filter(
        item => !(item.productId === productId && item.weight === weight)
      );

      setCartItems(updated);
      localStorage.setItem('cartItems', JSON.stringify(updated));

      showNotification(`❌ ${removedItem.name} (${removedItem.weight}) removed from cart`, 'error');

      if (isAuthenticated && removedItem._id) {
        const user = auth.currentUser;
        const idToken = await user.getIdToken();
        await fetch(`http://localhost:5000/api/cart/${removedItem._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
      }
    } catch (error) {
      console.error('Error removing item:', error);
      showNotification('Failed to remove item', 'error');
    }
  };

  const calculateDeliveryFee = (subtotal) => {
    if (subtotal >= 500) return 0;
    if (subtotal >= 300) return 30;
    if (subtotal >= 200) return 40;
    if (subtotal >= 100) return 50;
    return 60;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = calculateDeliveryFee(subtotal);
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    navigate('/checkout', { state: { cartItems } });
  };

  return (
    <div className="cart-page">
      <Navbar />
      
      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      <div className="cart-header">
        <div className="cart-header-content">
          <h1 className="cart-title">
            <ShoppingCart size={28} color="crimson" />
            Shopping Cart ({cartItems.length} items)
          </h1>
          <button className="backed-btn" onClick={() => navigate('/shop')}>
            <ArrowLeft size={18} /> Back to Shopping
          </button>
        </div>
      </div>

      <div className="carts-container">
        <div className="carts-main">
          <div className="carts-items">
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={64} />
                <h2>Your cart is empty</h2>
                <p>Add some delicious items to get started!</p>
                <button className="continue-shopping-btn" onClick={() => navigate('/shop')}>
                  Start Shopping
                </button>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={`${item.productId}-${item.weight}`} className="carts-item">
                  <div className="items-image-container">
                    <img src={item.image} alt={item.name} className="items-image" />
                  </div>
                  <div className="items-details">
                    <h3 className="items-name">{item.name}</h3>
                    <p className="items-weight">Weight: {item.weight}</p>
                    <p className="items-description">{item.description}</p>
                    <div className="items-meta">
                      <span className="items-category">{item.category}</span>
                      <span className="items-district">{item.district}</span>
                    </div>
                  </div>
                  <div className="items-controls">
                    <div className="quantity-control">
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.productId, item.weight, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.productId, item.weight, 1)}
                        disabled={item.quantity >= 5}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="item-price">
                      <span className="total-price">₹{item.price * item.quantity}</span>
                    </div>
                    <span className="unit-price">
                      ₹{item.price} per {item.weight}
                    </span>
                    <div className="item-actions">
                      <button
                        className="remove-btn"
                        onClick={() => removeItem(item.productId, item.weight)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {cartItems.length > 0 && (
            <div className="delivery-info">
              <Truck size={20} />
              <span>
                {deliveryFee === 0
                  ? 'Free delivery on orders above ₹500'
                  : `Delivery fee: ₹${deliveryFee} • Free delivery on orders above ₹500`}
              </span>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-sidebar">
            <div className="order-summary">
              <h3 className="section-title">Order Summary</h3>
              <div className="summary-line">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="summary-line">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-line total">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <button
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              <div className="payment-methods">
                <p>We accept:</p>
                <div className="payment-icons">
                  <span>💳</span>
                  <span>📱</span>
                  <span>💰</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Order Summary - Only visible on mobile */}
      {cartItems.length > 0 && (
        <div className="mobile-order-summary">
          <div className="order-summary">
            <h3 className="section-title">Order Summary</h3>
            <div className="summary-line">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="summary-line">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-line total">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;