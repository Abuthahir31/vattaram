import React, { useState } from 'react';
import './items.css';
import { FiPlus, FiMinus, FiShoppingCart, FiZap } from 'react-icons/fi';
import { BsTruck, BsArrowReturnLeft, BsShieldCheck } from 'react-icons/bs';

const PremiumProductDescription = () => {
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const productImages = [
    "https://www.cookwithmanali.com/wp-content/uploads/2014/10/Gajar-Ka-Halwa-Recipe.jpg",
    "https://www.archanaskitchen.com/images/archanaskitchen/0-Archanas-Kitchen-Recipes/2019/Tirunelveli_Halwa_Recipe_-_How_to_make_Tirunelveli_Halwa_1600.jpg",
    "https://www.awesomecuisine.com/wp-content/uploads/2008/02/halwa.jpg"
  ];

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const toggleWishlist = () => {
    setIsWishlist(!isWishlist);
  };

  return (
    <div className="premium-product-container">
      <div className="product-hero">
        <div className="container">
          <div className="product-card">
            <div className="product-gallery">
              <div className="thumbnail-container">
                {productImages.map((img, index) => (
                  <div 
                    key={index}
                    className={`thumbnail ${activeImage === index ? 'active' : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>
              <div className="main-image">
                <img src={productImages[activeImage]} alt="Tirunelveli Halwa" />
                <div className="image-badge">South Special</div>
              </div>
            </div>

            <div className="product-details">
              <div className="product-header">
                <h1 className="product-title">Tirunelveli Halwa</h1>
                <button 
                  className={`wishlist-btn ${isWishlist ? 'active' : ''}`}
                  onClick={toggleWishlist}
                >
                  ♥
                </button>
              </div>
              
              <p className="product-subtitle">Traditional South Indian Sweet from Tamil Nadu</p>
              
              <div className="rating-container">
                <div className="stars">
                  ★★★★★
                  <span className="rating-overlay" style={{ width: '80%' }}></span>
                </div>
                <span className="rating-count">(128 Reviews)</span>
              </div>
              
              <div className="price-container">
                <span className="current-price">₹250</span>
                <span className="original-price">₹300</span>
                <span className="discount">17% OFF</span>
              </div>
              
              <div className="tax-info">inclusive of all taxes</div>
              
              <div className="product-description">
                <h3>Description</h3>
                <p>
                  Tirunelveli Halwa is a legendary sweet from the heart of Tamil Nadu, crafted with pure wheat, 
                  organic ghee, and special sugar. This melt-in-mouth delicacy has a unique chewy texture and 
                  rich aroma that makes it stand out from regular halwas.
                </p>
                <ul className="highlight-list">
                  <li>Made with traditional recipe passed down for generations</li>
                  <li>100% vegetarian and contains no preservatives</li>
                  <li>Perfect for gifting and festive occasions</li>
                  <li>Stays fresh for 15 days at room temperature</li>
                </ul>
              </div>
              
              <div className="quantity-selector">
                <h4>Quantity</h4>
                <div className="quantity-control">
                  <button className="qty-btn" onClick={decreaseQuantity}>
                    <FiMinus />
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button className="qty-btn" onClick={increaseQuantity}>
                    <FiPlus />
                  </button>
                </div>
              </div>
              
              <div className="action-buttons">
                <button className="btn add-to-cart">
                  <FiShoppingCart /> Add to Cart
                </button>
                <button className="btn buy-now">
                  <FiZap /> Buy Now
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
      
      <div className="product-tabs-container">
        <div className="container">
          <div className="product-tabs">
            <button className="tab-btn active">Description</button>
            <button className="tab-btn">How to Use</button>
            <button className="tab-btn">Reviews</button>
            <button className="tab-btn">FAQs</button>
          </div>
          
          <div className="tab-content">
            <h3>About Tirunelveli Halwa</h3>
            <p>
              Originating from the city of Tirunelveli in Tamil Nadu, this halwa has gained nationwide fame 
              for its unique preparation method and taste. Unlike regular halwa, it has a distinct texture 
              that comes from continuous stirring for hours in copper vessels.
            </p>
            <p>
              Our halwa is prepared by expert halwais (sweet makers) who follow the traditional recipe 
              meticulously. Each batch is cooked to perfection, ensuring the authentic taste that 
              Tirunelveli Halwa is renowned for.
            </p>
            
            <h3>Ingredients</h3>
            <ul>
              <li>Pure wheat extract</li>
              <li>Organic cow ghee</li>
              <li>Special fine sugar</li>
              <li>Cardamom for flavor</li>
              <li>No artificial colors or preservatives</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumProductDescription;