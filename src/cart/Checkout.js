import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, CreditCard, Truck, Mail, Lock } from 'lucide-react';
import { auth } from '../firebase';
import "./Checkout.css";

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Get cart items from location state or localStorage
  const [cartItems, setCartItems] = useState(() => {
    if (location.state?.directCheckout) {
      return location.state.cartItems || [];
    }
    const storedCart = localStorage.getItem('cartItems');
    return storedCart ? JSON.parse(storedCart) : [];
  });

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
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      const data = await response.json();
      if (!location.state?.directCheckout) {
        setCartItems(data);
        localStorage.setItem('cartItems', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      showNotification('Failed to load your cart. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    email: '', phone: '', name: '', address: '', city: '', state: '', zip: '',
    cardName: '', cardNumber: '', expMonth: '', expYear: '', cvv: '', 
    paymentMethod: '', upiId: '', bank: ''
  });

  const [formErrors, setFormErrors] = useState({
    email: false, phone: false, name: false, address: false, city: false, 
    state: false, zip: false, paymentMethod: false
  });

  const [timeLeft, setTimeLeft] = useState({
    minutes: 15,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        const newSeconds = prevTime.seconds - 1;
        const newMinutes = newSeconds < 0 ? prevTime.minutes - 1 : prevTime.minutes;     
        return {
          minutes: newMinutes >= 0 ? newMinutes : 0,
          seconds: newSeconds >= 0 ? newSeconds : 59
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (time) => {
    return time < 10 ? `0${time}` : time;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    })); 
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const validateForm = () => {
    const errors = {
      email: !formData.email || !/^\S+@\S+\.\S+$/.test(formData.email),
      phone: !formData.phone || !/^[6-9]\d{9}$/.test(formData.phone), // Updated to match router validation
      name: !formData.name,
      address: !formData.address,
      city: !formData.city,
      state: !formData.state,
      zip: !formData.zip || !/^\d{6}$/.test(formData.zip),
      paymentMethod: !formData.paymentMethod
    };

    if (formData.paymentMethod === 'upi' && (!formData.upiId || !/.+@.+/i.test(formData.upiId))) {
      errors.upiId = true;
    }
    if (formData.paymentMethod === 'card') {
      errors.cardName = !formData.cardName;
      errors.cardNumber = !formData.cardNumber || !/^\d{16}$/.test(formData.cardNumber);
      errors.expMonth = !formData.expMonth || !/^(0[1-9]|1[0-2])$/.test(formData.expMonth);
      errors.expYear = !formData.expYear || !/^\d{4}$/.test(formData.expYear);
      errors.cvv = !formData.cvv || !/^\d{3,4}$/.test(formData.cvv);
    }
    if (formData.paymentMethod === 'netbanking' && !formData.bank) {
      errors.bank = true;
    }
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const isTimeExpired = timeLeft.minutes === 0 && timeLeft.seconds === 0;
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal >= 500 ? 0 : 30;
  const total = subtotal + deliveryFee;

  const handleSubmitOrder = async () => {
    if (isTimeExpired) {
      showNotification('Payment time expired. Please refresh and try again.', 'error');
      return;
    }
    if (!validateForm()) {
      showNotification('Please fill all required fields correctly', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) {
        showNotification('Please sign in to complete your order', 'error');
        return;
      }

      const idToken = await user.getIdToken();
      
      // Prepare payment details based on payment method
      const paymentDetails = {};
      if (formData.paymentMethod === 'card') {
        paymentDetails.cardLast4 = formData.cardNumber.slice(-4);
      } else if (formData.paymentMethod === 'upi') {
        paymentDetails.upiId = formData.upiId;
      } else if (formData.paymentMethod === 'netbanking') {
        paymentDetails.bank = formData.bank;
      }
      // COD doesn't need payment details

      const orderData = {
        paymentMethod: formData.paymentMethod,
        items: cartItems.map(item => ({
          productId: item.productId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          weight: item.weight,
          image: item.image,
          // These are required by the router for inventory management
          variantIndex: item.variantIndex || 0, // Default to 0 if not provided
          weightIndex: item.weightIndex || 0    // Default to 0 if not provided
        })),
        shippingAddress: {
          name: formData.name,
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zip,
          phone: formData.phone,
          email: formData.email
        },
        totalAmount: total,
        paymentDetails
      };

      const orderResponse = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const responseData = await orderResponse.json();
      
      // Check if order was created successfully
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to create order');
      }

      const createdOrder = responseData.order;

      // Show inventory update warnings if any
      if (responseData.inventoryUpdate && responseData.inventoryUpdate.failed > 0) {
        console.warn('Some inventory updates failed:', responseData.inventoryUpdate.details);
        showNotification('Order placed successfully, but some inventory updates failed. Please contact support.', 'warning');
      }

      // Only clear cart if this wasn't a direct checkout
      if (!location.state?.directCheckout) {
        try {
          const clearResponse = await fetch('http://localhost:5000/api/cart', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });

          if (!clearResponse.ok) {
            console.error('Failed to clear cart, but order was placed successfully');
          }
        } catch (clearError) {
          console.error('Error clearing cart:', clearError);
        }
      }

      setCartItems([]);
      localStorage.removeItem('cartItems');
      
      navigate('/order-confirmation', {
        state: {
          order: createdOrder,
          orderNumber: createdOrder._id
        }
      });
    } catch (error) {
      console.error('Error submitting order:', error);
      
      // Handle specific error cases
      if (error.message.includes('Stock availability')) {
        showNotification('Some items are out of stock. Please update your cart and try again.', 'error');
      } else if (error.message.includes('Total amount mismatch')) {
        showNotification('Price calculation error. Please refresh and try again.', 'error');
      } else if (error.message.includes('Invalid phone number')) {
        showNotification('Please enter a valid 10-digit phone number starting with 6-9.', 'error');
      } else if (error.message.includes('Invalid email')) {
        showNotification('Please enter a valid email address.', 'error');
      } else if (error.message.includes('Invalid postal code')) {
        showNotification('Please enter a valid 6-digit PIN code.', 'error');
      } else {
        showNotification(error.message || 'Failed to place order. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!cartItems.length) {
    return (
      <div className="empty-cart-message">
        <ShoppingCart size={48} />
        <h2>Your cart is empty</h2>
        <p>Add some items to your cart before checking out</p>
        <button 
          className="back-to-shop-btn"
          onClick={() => navigate('/home')}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.message}
        </div>
      )}   
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing your order...</p>
        </div>
      )}
      <div className="header">
        <div className="header-content">
          <div className="header-row">
            <button className="backs-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} style={{marginRight: '8px'}} />
              Back
            </button>
            <h1 className="main-title">Checkout</h1>
            {isAuthenticated && <span className="sync-badge"></span>}
          </div>
        </div>
      </div>
      <div className="main-container">
        <div className="checkout-grid">
          <div className="form-column">
            {/* Contact Information Section */}
            <div className="form-section">
              <h2 className="section-title">
                <Mail size={20} style={{color: '#4f46e5'}} />
                Contact Information
              </h2>
              <div className="form-grid">
                <div className={`input-group ${formErrors.email ? 'error' : ''}`}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                  {formErrors.email && <span className="error-message">Valid email required</span>}
                </div>
                <div className={`input-group ${formErrors.phone ? 'error' : ''}`}>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number (10 digits starting with 6-9)"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                  {formErrors.phone && <span className="error-message">10 digit number starting with 6-9 required</span>}
                </div>
              </div>
            </div>
            
            {/* Shipping Address Section */}
            <div className="form-section">
              <h2 className="section-title">
                <Truck size={20} style={{color: '#10b981'}} />
                Shipping Address
              </h2>
              <div className={`input-group ${formErrors.name ? 'error' : ''}`}>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field form-grid-full"
                  required
                />
                {formErrors.name && <span className="error-message">Name is required</span>}
              </div>
              <div className={`input-group ${formErrors.address ? 'error' : ''}`}>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input-field form-grid-full"
                  required
                />
                {formErrors.address && <span className="error-message">Address is required</span>}
              </div>
              <div className="form-grid-three">
                <div className={`input-group ${formErrors.city ? 'error' : ''}`}>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                  {formErrors.city && <span className="error-message">City is required</span>}
                </div>
                <div className={`input-group ${formErrors.state ? 'error' : ''}`}>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="select-field"
                    required
                  >
                    <option value="">Select State</option>
                    <option value="TN">Tamil Nadu</option>
                    <option value="KA">Karnataka</option>
                    <option value="KL">Kerala</option>
                  </select>
                  {formErrors.state && <span className="error-message">State is required</span>}
                </div>
                <div className={`input-group ${formErrors.zip ? 'error' : ''}`}>
                  <input
                    type="text"
                    name="zip"
                    placeholder="PIN Code (6 digits)"
                    value={formData.zip}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                  {formErrors.zip && <span className="error-message">6 digit PIN required</span>}
                </div>
              </div>
            </div>
            
            {/* Payment Options Section */}
            <div className="form-section">
              <h2 className="section-title">
                <CreditCard size={20} style={{color: '#8b5cf6'}} />
                Payment Options
              </h2>              
              <div className={`payment-timer ${isTimeExpired ? 'expired' : ''}`}>
                {isTimeExpired ? (
                  "Time expired! Please refresh to start again"
                ) : (
                  <>
                    Complete payment in 
                    <span className="timer">
                      {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
                    </span>
                  </>
                )}
              </div>             
              <div className="payment-methods">
                {formErrors.paymentMethod && (
                  <div className="error-message">Please select a payment method</div>
                )}  
                <div className="payment-option">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    id="upi" 
                    value="upi"
                    checked={formData.paymentMethod === 'upi'}
                    onChange={handleInputChange}
                    disabled={isTimeExpired}
                  />
                  <label htmlFor="upi">UPI</label>   
                  {formData.paymentMethod === 'upi' && (
                    <div className="payment-details">
                      <p>Choose an option</p>
                      <div className={`input-group ${formErrors.upiId ? 'error' : ''}`}>
                        <input
                          type="text"
                          name="upiId"
                          placeholder="Your UPI ID (e.g., name@paytm)"
                          value={formData.upiId}
                          onChange={handleInputChange}
                          className="input-field"
                          disabled={isTimeExpired}
                          required
                        />
                        {formErrors.upiId && <span className="error-message">Valid UPI ID is required</span>}
                      </div>
                      
                     <div className="upi-apps-container">
                        <div className="upi-apps">
                          <div className="upi-app">
                            <img src="https://png.pngtree.com/png-clipart/20230916/original/pngtree-google-pay-icon-vector-png-image_12256720.png" alt="Google Pay" />
                          </div>
                          <div className="upi-app">
                            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnyOoxY1k_Hj78I_Vb6S9sP4qV4cL5HkRzsa_7s5_ScOF5FSnIYXSWSwDXOE3xR6KHEu0&usqp=CAU" alt="PhonePe" />
                          </div>
                          <div className="upi-app">
                            <img src="https://cdn.freelogovectors.net/wp-content/uploads/2023/09/paytm-logo-freelogovectors.net_.png" alt="Paytm" />
                          </div>
                          <div className="upi-app">
                            <img src="https://pbs.twimg.com/profile_images/1788486625086820352/CLfx1IGe_400x400.jpg" alt="RuPay" />
                          </div>
                        </div>
                      </div>
                      <p className="note">Pay by any UPI app</p>
                    </div>
                  )}
                </div>
                <div className="payment-option">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    id="card" 
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    disabled={isTimeExpired}
                  />
                  <label htmlFor="card">Credit / Debit / ATM Card</label>
                  
                  {formData.paymentMethod === 'card' && (
                    <div className="payment-details">
                      <div className="form-grid">
                        <div className={`input-group ${formErrors.cardName ? 'error' : ''}`}>
                          <input
                            type="text"
                            name="cardName"
                            placeholder="Name on Card"
                            value={formData.cardName}
                            onChange={handleInputChange}
                            className="input-field"
                            disabled={isTimeExpired}
                            required
                          />
                          {formErrors.cardName && <span className="error-message">Card name is required</span>}
                        </div>
                        <div className={`input-group ${formErrors.cardNumber ? 'error' : ''}`}>
                          <input
                            type="text"
                            name="cardNumber"
                            placeholder="Card Number (16 digits)"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            className="input-field"
                            disabled={isTimeExpired}
                            required
                          />
                          {formErrors.cardNumber && <span className="error-message">16 digit card number required</span>}
                        </div>
                      </div>
                      <div className="form-grid-three" style={{marginTop: '15px'}}>
                        <div className={`input-group ${formErrors.expMonth ? 'error' : ''}`}>
                          <input
                            type="text"
                            name="expMonth"
                            placeholder="MM"
                            value={formData.expMonth}
                            onChange={handleInputChange}
                            className="input-field"
                            disabled={isTimeExpired}
                            required
                          />
                          {formErrors.expMonth && <span className="error-message">MM format required</span>}
                        </div>
                        <div className={`input-group ${formErrors.expYear ? 'error' : ''}`}>
                          <input
                            type="text"
                            name="expYear"
                            placeholder="YYYY"
                            value={formData.expYear}
                            onChange={handleInputChange}
                            className="input-field"
                            disabled={isTimeExpired}
                            required
                          />
                          {formErrors.expYear && <span className="error-message">YYYY format required</span>}
                        </div>
                        <div className={`input-group ${formErrors.cvv ? 'error' : ''}`}>
                          <input
                            type="text"
                            name="cvv"
                            placeholder="CVV"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            className="input-field"
                            disabled={isTimeExpired}
                            required
                          />
                          {formErrors.cvv && <span className="error-message">3-4 digit CVV required</span>}
                        </div>
                      </div>
                      <p className="note">Add and secure cards as per RBI guidelines</p>
                    </div>
                  )}
                </div>
                <div className="payment-option">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    id="netbanking" 
                    value="netbanking"
                    checked={formData.paymentMethod === 'netbanking'}
                    onChange={handleInputChange}
                    disabled={isTimeExpired}
                  />
                  <label htmlFor="netbanking">Net Banking</label> 
                  {formData.paymentMethod === 'netbanking' && (
                    <div className="payment-details">
                      <div className={`input-group ${formErrors.bank ? 'error' : ''}`}>
                        <select 
                          name="bank"
                          value={formData.bank}
                          onChange={handleInputChange}
                          className="input-field"
                          disabled={isTimeExpired}
                          required
                        >
                          <option value="">Select your bank</option>
                          <option value="sbi">State Bank of India</option>
                          <option value="hdfc">HDFC Bank</option>
                          <option value="icici">ICICI Bank</option>
                          <option value="axis">Axis Bank</option>
                        </select>
                        {formErrors.bank && <span className="error-message">Bank selection is required</span>}
                      </div>
                      <p className="note warning">This instrument has low success, use UPI or cards for better experience</p>
                    </div>
                  )}
                </div>
                <div className="payment-option">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    id="cod" 
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleInputChange}
                    disabled={isTimeExpired}
                  />
                  <label htmlFor="cod">Cash on Delivery</label>
                </div>
              </div>
            </div>
          </div>
          <div className="order-column">
            <div className="order-summary">
              <h2 className="section-title">
                <ShoppingCart size={20} style={{color: '#f59e0b'}} />
                Order Summary
              </h2>
              <div className="order-items-container">
                {cartItems.map((item, index) => (
                  <div key={`${item.productId || item.id}-${item.weight}-${index}`} className="cart-item">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="item-image" 
                    />
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p className="item-qty">Qty: {item.quantity}</p>
                      <p className="item-weight">{item.weight}</p>
                    </div>
                    <p className="item-price">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
              <div className="summary-totals">
                <div className="total-row">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="total-row">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div className="total-final">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
              <button 
                className="place-order-btn"
                onClick={handleSubmitOrder}
                disabled={isLoading || isTimeExpired}
              >
                {isLoading ? 'Processing...' : 'Place Order'}
              </button>
              <div className="secure-checkout">
                <Lock size={16} />
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;