import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, 
  Printer, 
  Download, 
  Home, 
  Truck, 
  Clock, 
  Phone,
  CreditCard,
  Package,
  Loader2
} from 'lucide-react';
import { auth } from '../firebase';
import "./OrderConfirmation.css";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);
  const [estimatedShipping, setEstimatedShipping] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (location.state?.order) {
      calculateDeliveryDates();
      return;
    }
    if (location.state?.orderNumber) {
      fetchOrderDetails(location.state.orderNumber);
      return;
    }
    setError('No order information available');
    setIsLoading(false);
  }, [location.state]);

  const fetchOrderDetails = async (orderId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Authentication required. Please sign in.');

      const idToken = await user.getIdToken();
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch order details');
      }

      const orderData = await response.json();
      setOrder(orderData);
      calculateDeliveryDates();
    } catch (err) {
      setError(err.message);
      console.error('Error fetching order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDeliveryDates = () => {
    const shippingDays = 1;
    const deliveryDays = 2;
    const shippingDate = new Date();
    shippingDate.setDate(shippingDate.getDate() + shippingDays);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    setEstimatedShipping(shippingDate.toLocaleDateString('en-IN', options));
    setEstimatedDelivery(deliveryDate.toLocaleDateString('en-IN', options));
  };

  const handlePrint = () => window.print();
  
  const loadJsPDF = async () => {
    if (window.jsPDF) return window.jsPDF;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => resolve(window.jspdf.jsPDF);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const generatePDFInvoice = async (orderData) => {
    const jsPDF = await loadJsPDF();
    const pdf = new jsPDF();
    const subtotal = orderData.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const deliveryFee = subtotal >= 500 ? 0 : 30;
    const total = subtotal + deliveryFee;
    const paymentStatus = orderData.paymentMethod === 'cod' ? 'Pending' : 'Paid';

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(37, 99, 235);
    pdf.text('INVOICE', 105, 25, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Namma Ooru Pandam', 105, 35, { align: 'center' });
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(37, 99, 235);
    pdf.line(20, 45, 190, 45);

    pdf.setFontSize(14);
    pdf.text('Order Details', 20, 60);
    pdf.setFontSize(10);
    pdf.text(`Order #: ${orderData._id?.slice(-8).toUpperCase()}`, 20, 70);
    pdf.text(`Date: ${new Date(orderData.createdAt || Date.now()).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    })}`, 20, 77);

    const paymentMethodText = 
      orderData.paymentMethod === 'card' ? 'Credit/Debit Card' :
      orderData.paymentMethod === 'upi' ? 'UPI Payment' :
      orderData.paymentMethod === 'netbanking' ? 'Net Banking' :
      orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'N/A';

    pdf.text('Payment Status:', 20, 87);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(paymentStatus === 'Paid' ? '#10B981' : '#EF4444');
    pdf.text(paymentStatus, 50, 87);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    pdf.text('Payment Method:', 20, 97);
    pdf.text(paymentMethodText, 50, 97);

    pdf.setFontSize(14);
    pdf.text('Shipping Address', 120, 60);
    pdf.setFontSize(10);
    let yPos = 70;
    const addressInfo = {
      name: orderData.shippingAddress?.name || orderData.name || 'N/A',
      street: orderData.shippingAddress?.street || orderData.address || 'N/A',
      city: orderData.shippingAddress?.city || orderData.city || 'N/A',
      state: orderData.shippingAddress?.state || orderData.state || 'N/A',
      postalCode: orderData.shippingAddress?.zip || orderData.zip || 'N/A',
      phone: orderData.shippingAddress?.phone || orderData.phone || 'N/A',
      email: orderData.shippingAddress?.email || orderData.email || 'N/A'
    };

    pdf.text(addressInfo.name, 120, yPos);
    yPos += 7;
    pdf.text(addressInfo.street, 120, yPos);
    yPos += 7;
    pdf.text(`${addressInfo.city}, ${addressInfo.state}- ${addressInfo.postalCode}`, 120, yPos);
    yPos += 7;
    pdf.text(`Phone: ${addressInfo.phone}`, 120, yPos);
    yPos += 7;
    pdf.text(`Email: ${addressInfo.email}`, 120, yPos);

    yPos = 110;
    pdf.setFontSize(14);
    pdf.text('Order Items', 20, yPos);
    yPos += 10;
    
    pdf.setFillColor(37, 99, 235);
    pdf.rect(20, yPos, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('Item', 25, yPos + 7);
    pdf.text('Weight', 90, yPos + 7);
    pdf.text('Qty', 120, yPos + 7);
    pdf.text('Price', 140, yPos + 7);
    pdf.text('Total', 165, yPos + 7);
    pdf.setTextColor(0, 0, 0);
    yPos += 15;
    
    orderData.items.forEach((item, index) => {
      if (yPos > 250) { 
        pdf.addPage();
        yPos = 20;
        pdf.setFillColor(37, 99, 235);
        pdf.rect(20, yPos, 170, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.text('Item', 25, yPos + 7);
        pdf.text('Weight', 90, yPos + 7);
        pdf.text('Qty', 120, yPos + 7);
        pdf.text('Price', 140, yPos + 7);
        pdf.text('Total', 165, yPos + 7);
        pdf.setTextColor(0, 0, 0);
        yPos += 15;
      }
      
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(20, yPos - 5, 170, 10, 'F');
      }
      
      pdf.text(item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name, 25, yPos);
      pdf.text(item.weight || 'N/A', 90, yPos);
      pdf.text(item.quantity.toString(), 120, yPos);
      pdf.text(`Rs.${item.price.toFixed(2)}`, 140, yPos);
      pdf.text(`Rs.${(item.price * item.quantity).toFixed(2)}`, 165, yPos);
      yPos += 10;
    });
    
    yPos += 10;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(120, yPos, 190, yPos);
    yPos += 10;
    
    pdf.text('Subtotal:', 140, yPos);
    pdf.text(`Rs.${subtotal.toFixed(2)}`, 165, yPos);
    yPos += 10;
    
    pdf.text('Delivery Fee:', 140, yPos);
    pdf.text(deliveryFee === 0 ? 'FREE' : `Rs.${deliveryFee.toFixed(2)}`, 165, yPos);
    yPos += 10;
    
    pdf.setLineWidth(1);
    pdf.setDrawColor(37, 99, 235);
    pdf.line(140, yPos, 190, yPos);
    yPos += 8;
    
    pdf.setFontSize(12);
    pdf.setTextColor(37, 99, 235);
    pdf.text('Total Amount: ', 140, yPos);
    pdf.text(`  Rs.${total.toFixed(2)}`, 165, yPos);
    
    yPos += 20;
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Thank you for your business!', 105, yPos, { align: 'center' });
    yPos += 10;
    pdf.setFontSize(10);
    pdf.text('For any queries, contact us at support@nammaoorupandam.com or call 1800-123-4567', 105, yPos, { align: 'center' });
    
    return pdf;
  };

  const handleDownloadInvoice = async () => {
    if (!order?._id) {
      alert('Order information not available for download');
      return;
    }

    setDownloadLoading(true);
    
    try {
      const user = auth.currentUser;
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const response = await fetch(`http://localhost:5000/api/orders/${order._id}/invoice`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${order._id.slice(-8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            return;
          }
        } catch (serverError) {
          console.log('Server invoice not available, generating client-side PDF');
        }
      }
      const pdf = await generatePDFInvoice(order);
      const fileName = `invoice-${order._id.slice(-8)}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again or contact support.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleContactSupport = () => {
    if (location.pathname === '/' || location.pathname === '/home') {
      // If already on home page, scroll to contact section
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to home page with contact hash
      navigate('/#contact');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="loading-spinner" size={48} />
        <p>Loading your order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Something went wrong</h2>
        <p className="error-message">{error}</p>
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/orders')}
          >
            <Home size={16} style={{marginRight: '8px'}} />
            View Your Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order || !order.items) {
    return (
      <div className="error-container">
        <h2>Order Not Found</h2>
        <p>We couldn't retrieve your order information.</p>
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/home')}
          >
            <Home size={16} style={{marginRight: '8px'}} />
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const deliveryFee = subtotal >= 500 ? 0 : 30;
  const total = subtotal + deliveryFee;
  const paymentStatus = order.paymentMethod === 'cod' ? 'Pending' : 'Paid';
  const paymentMethodText = 
    order.paymentMethod === 'card' ? 'Credit/Debit Card' :
    order.paymentMethod === 'upi' ? 'UPI Payment' :
    order.paymentMethod === 'netbanking' ? 'Net Banking' :
    order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'N/A';

  const addressInfo = {
    name: order.shippingAddress?.name || order.name || 'N/A',
    street: order.shippingAddress?.street || order.address || 'N/A',
    city: order.shippingAddress?.city || order.city || 'N/A',
    state: order.shippingAddress?.state || order.state || 'N/A',
    postalCode: order.shippingAddress?.zip || order.zip || 'N/A',
    phone: order.shippingAddress?.phone || order.phone || 'N/A',
    email: order.shippingAddress?.email || order.email || 'N/A'
  };

  return (
    <div className="order-confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-header">
          <div className="success-icon">
            <CheckCircle size={48} color="#10B981" />
          </div>
          <h1>Order Confirmed!</h1>
          <p className="order-number">Order #: {order._id?.slice(-8).toUpperCase()}</p>
          <p className="confirmation-message">
            <strong>Thank you for your purchase.</strong>
          </p>
        </div>

        <div className="order-details-grid">
          <div className="delivery-details">
            <h2>
              <Truck size={20} style={{marginRight: '10px', color: '#3B82F6'}} />
              Shipping & Delivery Information
            </h2>
            
            <div className="delivery-info">
              <div className="info-row">
                <Clock size={16} className="info-icon" />
                <div>
                  <p className="info-label">Estimated Shipping</p>
                  <p className="info-value">{estimatedShipping}</p>
                </div>
              </div>
              
              <div className="info-row">
                <Clock size={16} className="info-icon" />
                <div>
                  <p className="info-label">Estimated Delivery</p>
                  <p className="info-value">{estimatedDelivery}</p>
                </div>
              </div>
              
              <div className="info-row">
                <Truck size={16} className="info-icon" />
                <div>
                  <p className="info-label">Shipping Address</p>
                  <div className="info-value address-block">
                    <p><strong>{addressInfo.name}</strong></p>
                    <p>{addressInfo.street},</p>
                    <p>{addressInfo.city}, {addressInfo.state} - {addressInfo.postalCode}</p>
                    <p>Phone: {addressInfo.phone}</p>
                    <p>Email: {addressInfo.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="payment-details">
            <h2>
              <CreditCard size={20} style={{marginRight: '10px', color: '#8B5CF6'}} />
              Payment Information
            </h2>
            
            <div className="payment-info">
              <div className="info-row">
                <div>
                  <p className="info-label">Payment Status</p>
                  <p className="info-value" style={{ color: paymentStatus === 'Paid' ? '#10B981' : '#EF4444' }}>
                    {paymentStatus}
                  </p>
                </div>
              </div>
              
              <div className="info-row">
                <div>
                  <p className="info-label">Payment Method</p>
                  <p className="info-value">{paymentMethodText}</p>
                </div>
              </div>
              
              {order.paymentMethod === 'card' && order.paymentDetails?.cardLast4 && (
                <div className="info-row">
                  <div>
                    <p className="info-label">Card Details</p>
                    <p className="info-value">
                      •••• •••• •••• {order.paymentDetails.cardLast4}
                    </p>
                  </div>
                </div>
              )}
              
              {order.paymentMethod === 'upi' && order.paymentDetails?.upiId && (
                <div className="info-row">
                  <div>
                    <p className="info-label">UPI ID</p>
                    <p className="info-value">
                      {order.paymentDetails.upiId}
                    </p>
                  </div>
                </div>
              )}
              
              {order.paymentMethod === 'netbanking' && order.paymentDetails?.bank && (
                <div className="info-row">
                  <div>
                    <p className="info-label">Bank</p>
                    <p className="info-value">
                      {{
                        'sbi': 'State Bank of India',
                        'hdfc': 'HDFC Bank',
                        'icici': 'ICICI Bank',
                        'axis': 'Axis Bank'
                      }[order.paymentDetails.bank] || order.paymentDetails.bank}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="info-row">
                <div>
                  <p className="info-label">Total Amount Paid</p>
                  <p className="info-value total-amount">₹{total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-items-section">
          <div className="section-tabs">
            <button 
              className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
              onClick={() => setActiveTab('items')}
            >
              <Package size={18} style={{marginRight: '8px'}} />
              Order Items ({order.items.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Order Summary
            </button>
          </div>

          {activeTab === 'items' ? (
            <div className="order-items-container">
              {order.items.map((item, index) => (
                <div key={`${item.productId || item._id}-${index}`} className="order-item">
                  <div className="item-image-container">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="item-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                    <span className="item-quantity-badge">{item.quantity}</span>
                  </div>
                  <div className="item-main-info">
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p className="item-weight">{item.weight}</p>
                      <p className="item-price-mobile">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="item-price-desktop">
                    <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="order-summary-container">
              <div className="summary-row">
                <span>Subtotal ({order.items.length} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="order-timeline">
          <h3>Order Status</h3>
          <div className="timeline-steps">
            <div className="timeline-step completed">
              <div className="step-indicator"></div>
              <div className="step-details">
                <p className="step-title">Order Placed - Today</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-indicator"></div>
              <div className="step-details">
                <p className="step-title">Shipping Estimated: {estimatedShipping}</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-indicator"></div>
              <div className="step-details">
                <p className="step-title">Delivery Estimated: {estimatedDelivery}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-btn" onClick={handlePrint}>
            <Printer size={16} style={{marginRight: '8px'}} />
            Print Receipt
          </button>
          <button 
            className="action-btn" 
            onClick={handleDownloadInvoice}
            disabled={downloadLoading}
          >
            {downloadLoading ? (
              <Loader2 size={16} className="spinning" style={{marginRight: '8px'}} />
            ) : (
              <Download size={16} style={{marginRight: '8px'}} />
            )}
            {downloadLoading ? 'Generating PDF...' : 'Download PDF Invoice'}
          </button>
          <button 
            className="action-btn primary"
            onClick={() => navigate('/home')}
          >
            <Home size={16} style={{marginRight: '8px'}} />
            Continue Shopping
          </button>
        </div>

        <div className="customer-support">
          <h3>
            <Phone size={20} style={{marginRight: '10px', color: '#EF4444'}} />
            Need Help?
          </h3>
          <p>
            Contact our customer support at <strong>1800-123-4567</strong> or email us at{' '}
            <strong>support@nammaoorupandam.com</strong> for any questions about your order.
          </p>
          <button 
            className="support-btn"
            onClick={handleContactSupport}
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;