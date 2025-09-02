import React, { useState } from 'react';
import { useEffect } from 'react';
import './fooditem.css';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiMinus, FiShoppingCart, FiZap } from 'react-icons/fi';
import { BsTruck, BsArrowReturnLeft, BsShieldCheck } from 'react-icons/bs';
import Navbar from './navbar';
import { auth } from './firebase';

const PremiumProductDescription = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state || {};
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishNotifMessage, setWishNotifMessage] = useState('');
  const [showWishNotif, setShowWishNotif] = useState(false);
  const [cartNotifMessage, setCartNotifMessage] = useState('');
  const [showCartNotif, setShowCartNotif] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  const getProductImage = (product) => {
    if (product.imageUrl) {
      return product.imageUrl;
    }
    if (product.image) {
      if (product.image.startsWith('http')) {
        return product.image;
      }
      const baseUrl = API_BASE_URL.replace('/api', '');
      return `${baseUrl}${product.image.startsWith('/') ? product.image : '/' + product.image}`;
    }
    return 'https://i.imgur.com/YCa6FJD.jpg';
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    const isWished = saved.some(item => item.id === product.id);
    setIsWishlist(isWished);
  }, [product.id]);
  
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    setWishlistCount(saved.length);
  }, []);

  // Update the useEffect for wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (isAuthenticated) {
        const dbWishlist = await fetchWishlistFromDB();
        const isWished = dbWishlist.some(item => item.productId === product._id);
        setIsWishlist(isWished);
        setWishlistItems(dbWishlist);
      } else {
        const saved = JSON.parse(localStorage.getItem('wishlistItems')) || [];
        const isWished = saved.some(item => item.id === product._id);
        setIsWishlist(isWished);
        setWishlistItems(saved);
      }
    };

    checkWishlistStatus();
  }, [product._id, isAuthenticated]);

  const productImages = [getProductImage(product)];
  const weightOptions = React.useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return [
        { label: '250g', value: '250g', price: 100, quantity: 0 },
        { label: '500g', value: '500g', price: 200, quantity: 0 },
        { label: '750g', value: '750g', price: 300, quantity: 0 },
        { label: '1kg', value: '1kg', price: 400, quantity: 0 }
      ];
    }

    const allWeights = [];
    product.variants.forEach(variant => {
      variant.weights.forEach(weight => {
        allWeights.push({
          label: `${weight.value}${weight.unit}`,
          value: `${weight.value}${weight.unit}`,
          price: weight.price,
          quantity: weight.quantity,
          variantIndex: variant.index,
          weightIndex: weight.index
        });
      });
    });
    return allWeights.sort((a, b) => a.price - b.price);
  }, [product.variants]);

  const saveWishlistToDB = async (wishlistItem) => {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...wishlistItem,
          userId: user.uid
        })
      });

      if (!response.ok) throw new Error('Failed to save');
      return await response.json();
    } catch (error) {
      console.error('Save error:', error);
      return false;
    }
  };

  const removeWishlistFromDB = async (productId) => {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const response = await fetch(
        `${API_BASE_URL}/wishlist/${user.uid}/${productId}`, 
        { method: 'DELETE' }
      );
      return response.ok;
    } catch (error) {
      console.error('Remove error:', error);
      return false;
    }
  };

  const fetchWishlistFromDB = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      const response = await fetch(`${API_BASE_URL}/wishlist/${user.uid}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      return [];
    }
  };

  const [selectedWeight, setSelectedWeight] = useState(weightOptions[0]);
  const increaseQuantity = () => {
    const maxQuantity = Math.min(5, selectedWeight.quantity || 5);
    if (quantity < maxQuantity) {
      setQuantity(prev => prev + 1);
    }
  };
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const [wishlistItems, setWishlistItems] = useState(() => {
    const saved = localStorage.getItem('wishlistItems');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const toggleWishlist = async () => {
    const wishlistItem = {
      productId: product._id,
      name: product.name,
      image: getProductImage(product),
      category: product.category,
      district: product.district || 'South India',
      description: product.description,
      subtitle: product.subtitle,
      price: selectedWeight.price,
      weight: selectedWeight.value,
      ratingValue: product.ratingValue,
      variantIndex: selectedWeight.variantIndex,
      weightIndex: selectedWeight.weightIndex
    };

    if (isAuthenticated) {
      if (isWishlist) {
        await removeWishlistFromDB(product._id);
        setWishNotifMessage(`💔 Removed from wishlist`);
      } else {
        await saveWishlistToDB(wishlistItem);
        setWishNotifMessage(`❤️ Added to wishlist`);
      }
    } else {
      const saved = JSON.parse(localStorage.getItem('wishlistItems')) || [];
      if (isWishlist) {
        const updated = saved.filter(item => item.id !== product.id);
        localStorage.setItem('wishlistItems', JSON.stringify(updated));
      } else {
        localStorage.setItem('wishlistItems', 
          JSON.stringify([...saved, { ...wishlistItem, id: product._id }])
        );
      }
    }

    setIsWishlist(!isWishlist);
    setShowWishNotif(true);
    setTimeout(() => setShowWishNotif(false), 2000);
  };

  const saveCartToDB = async (cartItem) => {
    try { 
      const user = auth.currentUser;
      if (!user) return false;
      
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(cartItem)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save cart to database');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving cart to DB:', error);
      return false;
    }
  };

  const handleAddToCart = async () => {
    const cartItem = {
      productId: product._id,
      name: product.name,
      image: getProductImage(product),
      category: product.category,
      district: product.district || 'South India',
      description: product.description,
      subtitle: product.subtitle,
      price: selectedWeight.price,
      weight: selectedWeight.value,
      quantity: quantity,
      ratingValue: product.ratingValue,
      variantIndex: selectedWeight.variantIndex,
      weightIndex: selectedWeight.weightIndex
    };

    if (isAuthenticated) {
      const savedToDB = await saveCartToDB(cartItem);
      if (savedToDB) {
        const existingCart = JSON.parse(localStorage.getItem('cartItems')) || [];
        existingCart.push(cartItem);
        localStorage.setItem('cartItems', JSON.stringify(existingCart));
        setCartNotifMessage(`🛒 ${product.name} added to cart! (Saved to account)`);
      } else {
        setCartNotifMessage(`⚠️ ${product.name} added to cart locally only`);
      }
    } else {
      const existingCart = JSON.parse(localStorage.getItem('cartItems')) || [];
      existingCart.push(cartItem);
      localStorage.setItem('cartItems', JSON.stringify(existingCart));
      setCartNotifMessage(`🛒 ${product.name} added to cart!`);
    }

    setShowCartNotif(true);
    setTimeout(() => {
      setShowCartNotif(false);
      setCartNotifMessage('');
    }, 2000);
  };

  const handleBuyNow = () => {
    const checkoutItem = {
      productId: product._id,
      name: product.name,
      image: getProductImage(product),
      category: product.category,
      district: product.district || 'South India',
      description: product.description,
      subtitle: product.subtitle,
      price: selectedWeight.price,
      weight: selectedWeight.value,
      quantity: quantity,
      ratingValue: product.ratingValue,
      variantIndex: selectedWeight.variantIndex,
      weightIndex: selectedWeight.weightIndex
    };
    navigate('/checkout', {
      state: {
        directCheckout: true,
        cartItems: [checkoutItem]
      }
    });
  };
  const renderStars = (rating) => {
    if (!rating) return '';
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('★');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('☆');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  }; 
  const isInStock = product.inStock !== false && selectedWeight.quantity > 0;
  const maxQuantityAvailable = Math.min(5, selectedWeight.quantity || 0); 
  return (
    <div>
      <Navbar 
        cartItems={getCartItemCount()}
        wishlistCount={wishlistItems.length}/>
      {showCartNotif && (
        <div className="cart-notif">
          {cartNotifMessage}
        </div>
      )}
      {showWishNotif && (
        <div className="wishlist-notif">
          {wishNotifMessage}
        </div>
      )}
      <div className="premium-product-container">
        <div className="product-hero">
          <div className="container">
            <div className="products-card fade-in">
              <div className="product-gallery">
                <div className="thumbnail-container">
                  {productImages.map((img, index) => (
                    <div
                      key={index}
                      className={`thumbnail ${activeImage === index ? 'active' : ''}`}
                      onClick={() => setActiveImage(index)}>
                      <img 
                        src={img} 
                        alt={`Thumbnail ${index + 1}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://i.imgur.com/YCa6FJD.jpg';
                        }}/>
                    </div>
                  ))}
                </div>
                <div className="main-image">
                  <img 
                    src={productImages[activeImage]} 
                    alt={product.name || "Product"}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://i.imgur.com/YCa6FJD.jpg';
                    }}
                  />
                  <div className="image-badge">{product.district} Special</div>
                  {!isInStock && (
                    <div className="out-of-stock-overlay">Out of Stock</div>
                  )}
                </div>
              </div>
              <div className="product-details">
                <div className="product-header">
                  <h1 className="product-title">{product.name || "Product Name"}</h1>
                  <button
                    className={`wishlist-btn ${isWishlist ? 'active' : ''}`}
                    onClick={toggleWishlist}title={isWishlist ? 'Add to Wishlist' : 'Remove from Wishlist'}
                  >
                    ♥
                  </button>
                </div>
                <p className="product-subtitle">{product.subtitle}</p>
                {product.ratingValue && (
                  <div className="product-rating">
                    <span className="stars">{renderStars(product.ratingValue)}</span>
                    <span className="rating-value">({product.ratingValue})</span>
                  </div>
                )}
                <div className="weight-selector">
                  <h4>Available in:</h4>
                  <div className="weight-options">
                    {weightOptions.map((option, index) => (
                      <button
                        key={index}
                        className={`weight-btn ${selectedWeight.value === option.value ? 'active' : ''} ${option.quantity === 0 ? 'out-of-stock' : ''}`}
                        onClick={() => {
                          setSelectedWeight(option);
                          setQuantity(1); 
                        }}
                        disabled={option.quantity === 0}
                      >
                        {option.label}
                        {option.quantity === 0 && <span className="oos-text"> (Out of Stock)</span>}
                      </button>
                    ))}
                  </div>
                  {selectedWeight.quantity > 0 && (
                    <p className="stock-info">Available: {selectedWeight.quantity} units</p>
                  )}
                </div>
                <div className="total-price">
                  <p>Total Price: <strong>₹{selectedWeight.price * quantity}</strong></p>
                </div>
                <p className="product-description">{product.description}</p>
                <p className="products-category"><strong>Category:</strong> {product.category}</p>
                <div className="quantity-selector">
                  <h4>Quantity</h4>
                  <div className="quantity-control">
                    <button className="qty-btn" onClick={decreaseQuantity} disabled={quantity <= 1}>
                      <FiMinus />
                    </button>
                    <span className="qty-value">{quantity}</span>
                    <button 
                      className="qty-btn" 
                      onClick={increaseQuantity} 
                      disabled={quantity >= maxQuantityAvailable}>
                      <FiPlus />
                    </button>
                  </div>
                  {maxQuantityAvailable > 0 && (
                    <p className="quantity-limit">Max: {maxQuantityAvailable} units</p>
                  )}
                </div>
                <div className="action-buttons">
                  <button 
                    className={`btns add-to-cart ${!isInStock ? 'disabled' : ''}`} 
                    onClick={handleAddToCart}
                    disabled={!isInStock}>
                    <FiShoppingCart /> {isInStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  <button 
                    className={`btns buy-now ${!isInStock ? 'disabled' : ''}`}
                    disabled={!isInStock}
                    onClick={handleBuyNow}
                  >
                    <FiZap /> {isInStock ? 'Buy Now' : 'Unavailable'}
                  </button>
                </div>
                <div className="delivery-info">
                  <div className="delivery-option">
                    <BsTruck className="icon" />
                    <div>
                      <h5>Free Delivery</h5>
                      <p>Get free delivery on orders above ₹500</p>
                    </div>
                  </div>
                  <div className="delivery-option">
                    <BsArrowReturnLeft className="icon" />
                    <div>
                      <h5>Easy Returns</h5>
                      <p>7 days hassle-free returns</p>
                    </div>
                  </div>
                  <div className="delivery-option">
                    <BsShieldCheck className="icon" />
                    <div>
                      <h5>Quality Assurance</h5>
                      <p>100% authentic products guarantee</p>
                    </div>
                  </div>
                </div>
              </div> 
            </div> 
          </div>
        </div> 
      </div> 
    </div>
  );
};

export default PremiumProductDescription;