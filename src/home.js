import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaShoppingCart, FaStar } from 'react-icons/fa';
import YouTube from 'react-youtube';
import { BsClock, BsTruck, BsShieldCheck } from 'react-icons/bs';
import { RiCustomerService2Line } from 'react-icons/ri';
import 'bootstrap/dist/css/bootstrap.min.css';
import './home.css';
import Navbar from './navbar';

const SouthBayMart = () => {
  const [products, setProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [notification, setNotification] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [aboutUs, setAboutUs] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [dealLoading, setDealLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const headerSlides = [
    { id: 1, image: '/Images/Sweet banner(5).gif' },
    { id: 6, image: '/Images/Sweet banner(6).gif' },
    { id: 2, image: '/Images/Sweet Banner(1).gif' },
    { id: 3, image: '/Images/Sweet Banner(2).gif' },
    { id: 4, image: '/Images/Sweet Banner(3).gif' },
    { id: 5, image: '/Images/Sweet Banner(4).gif' }
  ];

  const calculateTimeLeft = (endDate) => {
    const difference = new Date(endDate) - new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return timeLeft;
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/about-us')
      .then(response => response.json())
      .then(data => setAboutUs(data))
      .catch(error => console.error('Error fetching About Us content:', error));
    fetch('http://localhost:5000/api/testimonials')
      .then(response => response.json())
      .then(data => setTestimonials(data))
      .catch(error => console.error('Error fetching testimonials:', error));
  }, []);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/deals/active');
        setDeals(response.data);
        if (response.data && response.data.endDate) {
          setTimeLeft(calculateTimeLeft(response.data.endDate));
        }
      } catch (error) {
        console.error('Failed to fetch deals:', error);
        setDeals([]);
      } finally {
        setDealLoading(false);
      }
    };
    fetchDeals();
  }, []);

  useEffect(() => {
    if (!deals.endDate) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(deals.endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [deals.endDate]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/districts")
      .then(res => res.json())
      .then(data => setDistricts(data))
      .catch(err => console.error("Error fetching districts:", err));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsRes, trendingRes] = await Promise.all([
          axios.get('http://localhost:5000/api/products'),
          axios.get('http://localhost:5000/api/products/trending')
        ]);
        
        setProducts(productsRes.data);
        setTrendingProducts(trendingRes.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!videoRef.current) return;
      const rect = videoRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const isVisible = rect.top < windowHeight * 0.7 && rect.bottom > windowHeight * 0.3;
      
      if (isVisible && !videoPlaying) {
        setVideoPlaying(true);
      } else if (!isVisible && videoPlaying) {
        setVideoPlaying(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [videoPlaying]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === headerSlides.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [headerSlides.length]);

  const handleDistrictClick = (districtName) => {
    navigate('/shop', { state: { filterType: 'district', filterValue: districtName } });
  };

  const handleCategoryClick = (categoryName) => {
    navigate('/shop', { state: { filterType: 'category', filterValue: categoryName } });
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSearch = (query) => {
    console.log('Searching for:', query);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === headerSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? headerSlides.length - 1 : prev - 1));
  };

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(product => product.category === activeCategory);

  const features = [
    { icon: <BsTruck size={30} />, title: "Free Shipping", description: "On orders over ₹500" },
    { icon: <BsClock size={30} />, title: "Fast Delivery", description: "Same day shipping" },
    { icon: <BsShieldCheck size={30} />, title: "Secure Payment", description: "100% secure checkout" },
    { icon: <RiCustomerService2Line size={30} />, title: "24/7 Support", description: "Dedicated support" }
  ];

  return (
    <div className="southbaymart">
      {notification && (
        <div
          className={`position-fixed top-0 end-0 m-3 alert ${notification.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ zIndex: 9999 }}>
          {notification.message}
        </div>
      )}
      
      <div className="navbar-fixed">
        <Navbar />
      </div>
      
      <div style={{ marginTop: '-20px' }}>
        <div className="hero-slider position-relative">
          {headerSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`position-absolute w-100 h-100 transition-opacity ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}>
              <img
                src={slide.image}
                alt={`Slide ${slide.id}`}
                className="w-100 h-100 object-fit-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/1920x700/ff6b35/ffffff?text=SouthBayMart';
                }}
              />
              <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)', zIndex: 1 }}
              />
            </div>
          ))}
          <button
            className="position-absolute start-0 top-50 translate-middle-y btn slider-nav-btn"
            onClick={prevSlide}
            style={{ marginLeft: '15px' }}>
            <span className="slider-nav-icon">‹</span>
          </button>
          <button
            className="position-absolute end-0 top-50 translate-middle-y btn slider-nav-btn"
            onClick={nextSlide}
            style={{ marginRight: '15px' }}>
            <span className="slider-nav-icon">›</span>
          </button>
          <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2" style={{ zIndex: 3 }}>
            {headerSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                className="btn p-0 slide-indicator"
                onClick={() => setCurrentSlide(index)}
                style={{ background: index === currentSlide ? 'white' : 'transparent' }}
              />
            ))}
          </div>
        </div>

        {/* Trending product */}
        <section className="trending-products-section">
          <div className="container">
            <div className="trending-header">
              <h2 className="trending-title">Trending Products</h2>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/shop')}
              >
                View All
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="ms-2">
                  <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                </svg>
              </button>
            </div>

            {trendingProducts?.length > 0 ? (
              <div className="trending-products-container">
                {trendingProducts.slice(0, 4).map((product) => (
                  <div className="trending-product-card" key={product._id}>
                    <div className="trending-badge">Trending</div>
                    <div className="trending-product-img-container">
                      <img 
                        src={product.image ? `http://localhost:5000${product.image}` : '/placeholder-product.jpg'}
                        alt={product.name}
                        className="trending-product-image"
                        loading="lazy"
                      />
                    </div>
                    <div className="trending-product-info">
                      <h2 className="trending-product-title">{product.name}</h2>
                      <h6 className="trending-product-subtitle">{product.subtitle}</h6>
                      <div className="trending-product-rating">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < Math.floor(product.ratingValue || 0) ? 'text-warning' : 'text-secondary'} 
                          />
                        ))}
                      </div>
                      <button 
                        className="shop-now-btn"
                        onClick={() => navigate(`/fooditem`, { state: product })}
                      >
                        Shop Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <p>No trending products available</p>
                <button className="btn btn-primary mt-3" onClick={() => navigate('/shop')}>
                  Browse All Products
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="district-section py-5">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6 mb-5 mb-lg-0">
                <div className="district-illustration-card">
                  <img 
                    src="https://i.pinimg.com/736x/68/65/47/686547fe6655410854d6db0a27fd989f.jpg" 
                    alt="District Illustration" 
                    className="district-illustration-img"
                  />
                  <div className="corner-images-container">
                    <div className="corner-image corner-top-left">
                      <img 
                        src="https://media.istockphoto.com/id/1208754471/photo/gajar-ka-halwa.jpg?s=612x612&w=0&k=20&c=lfYKARLXHS2CbHtuU25uDnQQ1YMg83T_qS_eFB8wNRg=" 
                        alt="District Snack 1" 
                        className="slide-image"
                      />
                    </div>
                    <div className="corner-image corner-top-right">
                      <img 
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJIZ3rJKDI6TTW6M7qBo0jqvIOT2ZnLnjS5NbI6nBSvX70pvzAJ4or1XSoww1EBrticaM&usqp=CAU" 
                        alt="District Snack 2" 
                        className="slide-image"
                      />
                    </div>
                    <div className="corner-image corner-bottom-left">
                      <img 
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRo7Z2kVCX38jA3TyoQodkdnPCR5NlVnlxkiw&s" 
                        alt="District Snack 3" 
                        className="slide-image"
                      />
                    </div>
                    <div className="corner-image corner-bottom-right">
                      <img 
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQk8ouivlxBpaG0wYkQISzYLPK0fZZIsQkUww&s" 
                        alt="District Snack 4" 
                        className="slide-image"
                      />
                    </div>
                  </div>
                  <div className="illustration-overlay"></div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="district-content p-4 p-lg-5">
                  <h2 className="section-title mb-4">Districts We Serve</h2>
                  <p className="lead mb-5">
                    Each district has unique characteristics and cultural heritage that shape our services and offerings.
                  </p>
                  <div className="row g-4 justify-content-center">
                    {districts.map((district, index) => (
                      <div className="col-xl-4 col-lg-4 col-md-4 col-sm-6 col-6" key={index}>
                        <div
                          className={`district-image-wrapper position-relative ${activeCategory === district.name ? 'active' : ''}`}
                          onClick={() => handleDistrictClick(district.name)}
                          style={{ cursor: 'pointer' }}>
                          <div className="district-image-container rounded-circle overflow-hidden mx-auto">
                            <img
                              src={`http://localhost:5000${district.image}`}
                              alt={district.name}
                              className="district-image w-100 h-100"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTg-DsNQOxCXfEWxSeQSBe0HRACCKnHleBdIQ&s";
                              }}
                              loading="lazy"
                            />
                            <div className="district-name-label">
                              <h5 className="mb-0 text-white text-center">{district.name}</h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="categories-section">
          <div className="container section-container">
            <div className="content-side">
              <div className="section-header">
                <h2 className="section-title">
                  Explore Our Categories
                </h2>
                <p className="section-subtitle">
                  Discover a wide range of products in our carefully curated categories. 
                  Each offers unique items tailored to your needs.
                </p>
              </div>
              <div className="categories-grid">
                {categories.map((category, index) => (
                  <div 
                    className="category-item" 
                    key={index}
                    onClick={() => handleCategoryClick(category.name)}>
                    <div className="category-circle">
                      <img
                        src={`http://localhost:5000${category.image}`}
                        alt={category.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/280x280?text=Category";
                        }}
                        loading="lazy"
                      />
                      <div className="category-hover-content">
                        <span>Explore {category.name.split('&')[0].trim()}</span>
                      </div>
                    </div>
                    <span className="category-name">{category.name}</span>
                  </div>
                ))}
              </div>
              <div className="text-center mt-5">
                <a href="#" className="explore-btn">View All Categories</a>
              </div>
            </div>
            <div className="animated-side">
              <img 
                src="/images/1-1.jpg" 
                alt="Categories Illustration" 
                className="animated-image"
              />
            </div>
          </div>
        </section>

        <section className="features-section py-5 bg-light">
          <div className="container">
            <div className="row g-4">
              {features.map((feature, index) => (
                <div className="col-md-3 col-sm-6" key={index}>
                  <div className="feature-card p-4 text-center bg-white rounded shadow-sm">
                    <div className="feature-icon mb-3 text-primary">
                      {feature.icon}
                    </div>
                    <h5 className="fw-bold">{feature.title}</h5>
                    <p className="mb-0 text-muted small">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id='deals' className="deal-of-the-day py-5 bg-danger text-white">
          <div className="container">
            {dealLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : deals && deals.items && deals.items.length > 0 ? (
              <div className="row align-items-center">
                <div className="col-lg-6 mb-4 mb-lg-0">
                  <span className="badge bg-white text-danger mb-3">{deals.badgeText}</span>
                  <h2 className="display-5 fw-bold mb-3">{deals.title}</h2>
                  <div className="video-ad-container mb-4 ratio ratio-16x9">
                    <div ref={videoRef}>
                      <YouTube
                        videoId={deals.videoId || "9N8fqzB1c4Q"}
                        opts={{
                          playerVars: {
                            autoplay: videoPlaying ? 1 : 0,
                            mute: 1,
                            controls: 1,
                            rel: 0,
                            modestbranding: 1
                          }
                        }}
                        onReady={(event) => {
                          if (videoPlaying) event.target.playVideo();
                        }}
                        onPlay={() => setVideoPlaying(true)}
                        onPause={() => setVideoPlaying(false)}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="countdown-timer mb-4 p-3 bg-white text-dark rounded">
                    <h4 className="text-center text-danger mb-3">Offer Ends In:</h4>
                    <div className="d-flex justify-content-center">
                      <div className="text-center mx-2">
                        <div className="countdown-value bg-danger text-white rounded p-2 fs-3 fw-bold">
                          {timeLeft?.days?.toString().padStart(2, '0') || '00'}
                        </div>
                        <div className="countdown-label small mt-1">Days</div>
                      </div>
                      <div className="text-center mx-2">
                        <div className="countdown-value bg-danger text-white rounded p-2 fs-3 fw-bold">
                          {timeLeft?.hours?.toString().padStart(2, '0') || '00'}
                        </div>
                        <div className="countdown-label small mt-1">Hours</div>
                      </div>
                      <div className="text-center mx-2">
                        <div className="countdown-value bg-danger text-white rounded p-2 fs-3 fw-bold">
                          {timeLeft?.minutes?.toString().padStart(2, '0') || '00'}
                        </div>
                        <div className="countdown-label small mt-1">Minutes</div>
                      </div>
                      <div className="text-center mx-2">
                        <div className="countdown-value bg-danger text-white rounded p-2 fs-3 fw-bold">
                          {timeLeft?.seconds?.toString().padStart(2, '0') || '00'}
                        </div>
                        <div className="countdown-label small mt-1">Seconds</div>
                      </div>
                    </div>
                  </div>
                  <div className="offer-details bg-white text-dark p-4 rounded">
                    <h3 className="text-danger fw-bold mb-3">Today's Special Offers</h3>
                    {deals.items.map((item, index) => (
                      <div className="offer-item mb-4" key={index}>
                        <div className="d-flex align-items-center mb-2">
                          <img
                            src={item.image || "https://via.placeholder.com/80?text=Product"}
                            alt={item.productName}
                            className="rounded me-3"
                            width="80"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/80?text=Product";
                            }}
                          />
                          <div>
                            <h5 className="mb-1">{item.productName} - {item.weight}</h5>
                            <div className="d-flex align-items-center">
                              <span className="text-danger fw-bold me-2">₹{item.discountedPrice}</span>
                              <span className="text-muted text-decoration-line-through small me-2">₹{item.originalPrice}</span>
                              <span className="badge bg-danger">
                                {Math.round((1 - item.discountedPrice / item.originalPrice) * 100)}% OFF
                              </span>
                            </div>
                          </div>
                        </div>
                        {item.description && (
                          <p className="small text-muted mb-0">{item.description}</p>
                        )}
                      </div>
                    ))}
                    <button 
                      className="btn btn-danger w-100 py-3 fw-bold"
                      onClick={() => navigate('/checkout')}>
                      <FaShoppingCart className="me-2" />
                      SHOP NOW - {deals.discountPercentage}% OFF ENDS SOON!
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <h3 className="mb-3">No active deals at the moment</h3>
                <p className="mb-4">Check back later for exciting offers!</p>
                <button 
                  className="btn btn-light text-danger fw-bold"
                  onClick={() => navigate('/shop')}>
                  Browse Our Products
                </button>
              </div>
            )}
          </div>
        </section>
        <div className="py-2"></div>
        <section id="about" className="about-us py-5 position-relative overflow-hidden">
          <div className="position-absolute top-0 start-0 w-100 h-100">
            <div className="position-absolute top-0 end-0 bg-primary opacity-10" style={{
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              filter: 'blur(60px)',
              animation: 'pulse 8s infinite alternate'
            }}></div>
            <div className="position-absolute bottom-0 start-0 bg-warning opacity-10" style={{
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              filter: 'blur(80px)',
              animation: 'pulse 6s infinite alternate-reverse'
            }}></div>
          </div>
          <div className="container position-relative">
            <div className="text-center mb-5" data-aos="fade-up" data-aos-duration="800">
              <h2 className="section-title display-4 fw-bold text-primary position-relative d-inline-block">
                {aboutUs?.title || 'About SouthBayMart'}
              </h2>
              <p className="lead text-muted mt-3">{aboutUs?.subtitle || 'Celebrating the Rich Heritage of South Tamil Nadu'}</p>
            </div>
            <div className="row align-items-center">
              <div className="col-lg-6 mb-4 mb-lg-0" data-aos="fade-right" data-aos-duration="1000">
                <p className="fs-5">{aboutUs?.description || 'SouthBayMart was born from our deep love for the vibrant culture, delicious cuisine, and unique products of South Tamil Nadu - particularly the regions of Thoothukudi, Tirunelveli, and Kanyakumari.'}</p>
                <div className="mt-4">
                  <h3 className="fw-bold text-primary mb-3">{aboutUs?.connectionToSouth?.title || 'Our Connection to the South'}</h3>
                  <p>{aboutUs?.connectionToSouth?.description || 'We take pride in showcasing the best of what makes South Tamil Nadu special:'}</p>
                  <ul className="list-unstyled">
                    {aboutUs?.connectionToSouth?.items?.map((item, index) => (
                      <li className="mb-2 d-flex" key={index} data-aos="fade-right" data-aos-delay={(index + 1) * 100}>
                        <span className="me-2 text-warning">•</span>
                        <span><span className="fw-bold">{item.name}:</span> {item.description}</span>
                      </li>
                    )) || (
                      <>
                        <li className="mb-2 d-flex" data-aos="fade-right" data-aos-delay="100">
                          <span className="me-2 text-warning">•</span>
                          <span><span className="fw-bold">Tuticorin Macaroon:</span> The famous eggless Portuguese-origin sweet from Thoothukudi</span>
                        </li>
                        <li className="mb-2 d-flex" data-aos="fade-right" data-aos-delay="200">
                          <span className="me-2 text-warning">•</span>
                          <span><span className="fw-bold">Alwa:</span> Tirunelveli's iconic milk-based sweet that melts in your mouth</span>
                        </li>
                        <li className="mb-2 d-flex" data-aos="fade-right" data-aos-delay="300">
                          <span className="me-2 text-warning">•</span>
                          <span><span className="fw-bold">Halwa:</span> The legendary Tirunelveli wheat halwa that's known worldwide</span>
                        </li>
                        <li className="mb-2 d-flex" data-aos="fade-right" data-aos-delay="400">
                          <span className="me-2 text-warning">•</span>
                          <span><span className="fw-bold">Palm Products:</span> From palm jaggery to palm leaf handicrafts</span>
                        </li>
                        <li className="mb-2 d-flex" data-aos="fade-right" data-aos-delay="500">
                          <span className="me-2 text-warning">•</span>
                          <span><span className="fw-bold">Seafood:</span> Fresh catches from the Gulf of Mannar and Indian Ocean</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="mt-4">
                  <h3 className="fw-bold text-primary mb-3">{aboutUs?.commitment?.title || 'Our Commitment'}</h3>
                  {aboutUs?.commitment?.description?.map((para, index) => (
                    <p className="fs-5" key={index}>{para}</p>
                  )) || (
                    <>
                      <p className="fs-5">We're more than just a store - we're a bridge connecting the rich heritage of South Tamil Nadu to the world. We work directly with local artisans, farmers, and producers to bring you authentic products while supporting the local economy.</p>
                      <p>From the famous macaroons of Tuticorin to the exquisite handicrafts of Kanyakumari, we're proud to showcase the best of what our region has to offer.</p>
                    </>
                  )}
                </div>
              </div>
              <div className="col-lg-6" data-aos="fade-left" data-aos-duration="1000">
                <div className="row g-3">
                  {aboutUs?.images?.map((image, index) => (
                    <div className="col-6" key={index}>
                      <div className="ratio ratio-1x1 hover-animate" data-aos="zoom-in" data-aos-delay={(index * 100)}>
                        <img 
                          src={image.src}
                          alt={image.alt}
                          className="img-fluid rounded shadow object-fit-cover"
                        />
                      </div>
                      <p className="small text-muted mt-2 text-center">{image.caption}</p>
                    </div>
                  )) || (
                    <>
                      <div className="col-6">
                        <div className="ratio ratio-1x1 hover-animate" data-aos="zoom-in" data-aos-delay="100">
                          <img 
                            src="https://blog.swiggy.com/wp-content/uploads/2024/08/Image-1_Thoothukudi-Macaroon-1024x538.png" 
                            alt="Tuticorin Harbor" 
                            className="img-fluid rounded shadow object-fit-cover"
                          />
                        </div>
                        <p className="small text-muted mt-2 text-center">Tuticorin - Gateway to South Tamil Nadu</p>
                      </div>
                      <div className="col-6">
                        <div className="ratio ratio-1x1 hover-animate" data-aos="zoom-in" data-aos-delay="200">
                          <img 
                            src="https://blog.swiggy.com/wp-content/uploads/2024/08/Image-1_Banana-Chips-1024x538.png"
                            alt="Kanyakumari Sunset" 
                            className="img-fluid rounded shadow object-fit-cover"
                          />
                        </div>
                        <p className="small text-muted mt-2 text-center">Kanyakumari - Where Three Seas Meet</p>
                      </div>
                      <div className="col-6">
                        <div className="ratio ratio-1x1 hover-animate" data-aos="zoom-in" data-aos-delay="300">
                          <img 
                            src="https://www.tirunelvelihalwa.net/wp-content/uploads/2023/08/tirunelveli-halwa-online-1.jpg" 
                            alt="Tirunelveli Halwa" 
                            className="img-fluid rounded shadow object-fit-cover"
                          />
                        </div>
                        <p className="small text-muted mt-2 text-center">Tirunelveli Halwa - A Sweet Tradition</p>
                      </div>
                      <div className="col-6">
                        <div className="ratio ratio-1x1 hover-animate" data-aos="zoom-in" data-aos-delay="400">
                          <img 
                            src="https://www.thedivinefoods.com/cdn/shop/products/palmjaggeryproduct.png?v=1745213530" 
                            alt="Palm Products" 
                            className="img-fluid rounded shadow object-fit-cover"
                          />
                        </div>
                        <p className="small text-muted mt-2 text-center">Palm Products - Sustainable Crafts</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="testimonials py-5 mt-5 position-relative">
              <div className="position-absolute top-0 start-0 w-100 h-100 bg-light opacity-25 rounded-4"></div>
              <div className="container position-relative">
                <div className="text-center mb-5" data-aos="fade-up">
                  <h2 className="section-title d-inline-block position-relative mb-4">
                    What Our Customers Say
                  </h2>
                </div>
                <div className="row g-4">
                  {testimonials.map((testimonial, index) => (
                    <div className="col-lg-4" key={testimonial._id} data-aos="fade-up" data-aos-delay={(index + 1) * 100}>
                      <div className="testimonial-card card h-100 border-0 shadow-sm p-4 hover-scale">
                        <div className="card-body d-flex flex-column">
                          <div className="rating mb-3">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className={i < testimonial.rating ? 'text-warning' : 'text-secondary'} />
                            ))}
                          </div>
                          <p className="card-text mb-4 flex-grow-1">{testimonial.comment}</p>
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <img
                                src={testimonial.image}
                                className="rounded-circle"
                                width="50"
                                alt={testimonial.name}
                              />
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <h6 className="mb-0">{testimonial.name}</h6>
                              <small className="text-muted">{testimonial.location}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="py-2"></div>
        <footer id="contact" className="footer bg-dark text-white pt-5 pb-3">
          <div className="container">
            <div className="row g-4 mb-5">
              <div className="col-lg-3 col-md-6">
                <h5 className="text-uppercase mb-4">Customer Service</h5>
                <ul className="list-unstyled">
                  <li className="mb-2">Contact Us</li>
                  <li className="mb-2">FAQs</li>
                  <li className="mb-2">Shipping Policy</li>
                  <li className="mb-2">Returns & Exchanges</li>
                  <li className="mb-2">Track Order</li>
                </ul>
              </div>
              <div className="col-lg-3 col-md-6">
                <h5 className="text-uppercase mb-4">About SouthBayMart</h5>
                <ul className="list-unstyled">
                  <li className="mb-2">Our Story</li>
                  <li className="mb-2">Careers</li>
                  <li className="mb-2">Privacy Policy</li>
                  <li className="mb-2">Terms & Conditions</li>
                  <li className="mb-2">Blog</li>
                </ul>
              </div>
              <div className="col-lg-3 col-md-6">
                <h5 className="text-uppercase mb-4">Shop</h5>
                <ul className="list-unstyled">
                  <li className="mb-2">All Products</li>
                  <li className="mb-2">New Arrivals</li>
                  <li className="mb-2">Best Sellers</li>
                  <li className="mb-2">Deals & Promotions</li>
                  <li className="mb-2">Gift Cards</li>
                </ul>
              </div>
              <div className="col-lg-3 col-md-6">
                <h5 className="text-uppercase mb-4">Connect With Us</h5>
                <div className="social-links mb-4">
                  <a href="#" className="text-white me-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white me-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white me-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.756-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white me-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
                <h6 className="text-uppercase mb-3">Payment Methods</h6>
                <div className="payment-methods d-flex align-items-center mb-4">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" 
                    alt="Visa" 
                    className="me-2" 
                    style={{ height: '20px' }}
                  />
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" 
                    alt="Mastercard" 
                    className="me-2" 
                    style={{ height: '20px' }}
                  />
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/American_Express_logo.svg/1024px-American_Express_logo.svg.png" 
                    alt="American Express" 
                    className="me-2" 
                    style={{ height: '20px' }}
                  />
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png" 
                    alt="PayPal" 
                    style={{ height: '20px' }}
                  />
                </div>
              </div>
            </div>
            <div className="contact-section">
              <div className="row g-0">
                <div className="col-lg-8">
                  <div className="contact-cards-side">
                    <h3 className="about-section-title mb-2">Get In Touch</h3>
                    <div className="row g-10">
                      <div className="col-md-6">
                        <div className="contact-card">
                          <div className="contact-icon">
                            <svg width="22" height="24" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          </div>
                          <div className="contact-info">
                            <h6 className="contact-title">OUR MAIN OFFICE</h6>
                            <div className="contact-content">
                              1A/1-G9, Wavoo Centre<br />
                              Madurai Road, Tirunelveli<br />
                              Tamil Nadu - 627001
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="contact-card">
                          <div className="contact-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1.45 1 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                            </svg>
                          </div>
                          <div className="contact-info">
                            <h6 className="contact-title">PHONE NUMBER</h6>
                            <div className="contact-content">
                              <a href="tel:+919840624407" className="contact-link">+91 98406 24407</a><br />
                              <span className="contact-note">Toll Free</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="contact-card">
                          <div className="contact-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                          </div>
                          <div className="contact-info">
                            <h6 className="contact-title">EMAIL</h6>
                            <div className="contact-content">
                              <a href="mailto:info@southbaymart.com" className="contact-link">info@southbaymart.com</a>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="contact-card">
                          <div className="contact-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                              <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                          </div>
                          <div className="contact-info">
                            <h6 className="contact-title">STORE HOURS</h6>
                            <div className="contact-content">
                              Mon-Sat: 9:00 AM - 8:00 PM<br />
                              Sunday: 10:00 AM - 6:00 PM
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="contact-form-side">
                    <div className="form-container">
                      <h2 className="about-section-title">Send Us Message</h2>
                      <div className="form-section">
                        <div className="contact-form">
                          <div className="form-group mb-3">
                            <input 
                              type="text" 
                              className="form-control custom-input" 
                              placeholder="Your Name"
                            />
                          </div>
                          <div className="form-group mb-3">
                            <input 
                              type="email" 
                              className="form-control custom-input" 
                              placeholder="Your Email"
                            />
                          </div>
                          <div className="form-group mb-4">
                            <textarea 
                              className="form-control custom-input" 
                              rows="5" 
                              placeholder="Your Message"
                            ></textarea>
                          </div>
                          <button type="button" className="btn custom-submit-btn w-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                            SEND MESSAGE
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
export default SouthBayMart;