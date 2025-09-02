import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './foodedibles.css';
import Navbar from './navbar';

const FoodEdibles = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [districtFilters, setDistrictFilters] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [priceFilters, setPriceFilters] = useState([]);
  const [ratingFilter, setRatingFilter] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const priceRanges = [
    { label: 'Under ₹200', min: 0, max: 200, _id: 'under-200' },
    { label: '₹200 - ₹300', min: 200, max: 300, _id: '200-300' },
    { label: '₹300 - ₹500', min: 300, max: 500, _id: '300-500' },
    { label: 'Over ₹500', min: 500, max: Infinity, _id: 'over-500' }
  ];
  const ratingOptions = [
    { label: '★★★★★', value: 5, _id: 'rating-5' },
    { label: '★★★★☆', value: 4, _id: 'rating-4' },
    { label: '★★★☆☆', value: 3, _id: 'rating-3' }
  ];
  
  useEffect(() => {
    fetchProducts();
    fetchDistricts();
    fetchCategories();
    if (location.state) {
      const { filterType, filterValue } = location.state;
      if (filterType === 'district') {
        setDistrictFilters([filterValue]);
      } else if (filterType === 'category') {
        setCategoryFilters([filterValue]);
      }
    }
  }, [location.state]);

  useEffect(() => {
    applyFilters();
  }, [products, districtFilters, categoryFilters, priceFilters, ratingFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const groupedProducts = groupProductsByOriginalId(data);
      setProducts(groupedProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const groupProductsByOriginalId = (flattenedProducts) => {
    const grouped = {};
    flattenedProducts.forEach(item => {
      const productId = item._id;
      if (!grouped[productId]) {
        grouped[productId] = {
          _id: productId,
          name: item.name,
          image: item.image,
          imageUrl: item.imageUrl,
          subtitle: item.subtitle,
          description: item.description,
          category: item.category,
          district: item.district,
          ratingValue: item.ratingValue,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          variants: [],
          inStock: false
        };
      }
      let variant = grouped[productId].variants.find(v => v.index === item.variantIndex);
      if (!variant) {
        variant = {
          index: item.variantIndex,
          weights: []
        };
        grouped[productId].variants.push(variant);
      }
      variant.weights.push({
        index: item.weightIndex,
        value: item.weight.value,
        unit: item.weight.unit,
        price: item.weight.price,
        quantity: item.weight.quantity
      });
      
      if (item.weight.quantity > 0) {
        grouped[productId].inStock = true;
      }
    });
    
    Object.values(grouped).forEach(product => {
      product.variants.sort((a, b) => a.index - b.index);
      product.variants.forEach(variant => {
        variant.weights.sort((a, b) => a.index - b.index);
      });
    });
    return Object.values(grouped);
  };

  const fetchDistricts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/districts`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDistricts([{ name: 'All', _id: 'all' }, ...data]);
    } catch (err) {
      console.error('Error fetching districts:', err);
      setDistricts([
        { name: 'All', _id: 'all' },
        { name: 'Tirunelveli', _id: 'tirunelveli' },
        { name: 'Tuticorin', _id: 'tuticorin' },
        { name: 'Tuti', _id: 'tuti' }
      ]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCategories([{ name: 'All', _id: 'all' }, ...data]);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([
        { name: 'All', _id: 'all' },
        { name: 'Sweets', _id: 'sweets' },
        { name: 'Spicy', _id: 'spicy' },
        { name: 'Dry fruits', _id: 'dry-fruits' }
      ]);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (districtFilters.length > 0 && !districtFilters.includes('All')) {
      filtered = filtered.filter(product => 
        districtFilters.includes(product.district)
      );
    }

    if (categoryFilters.length > 0 && !categoryFilters.includes('All')) {
      filtered = filtered.filter(product => 
        categoryFilters.includes(product.category)
      );
    }

    if (priceFilters.length > 0) {
      filtered = filtered.filter(product => {
        if (!product.variants || product.variants.length === 0) return false;
        const allPrices = product.variants.flatMap(variant => 
          variant.weights.map(weight => weight.price)
        );
        const minPrice = Math.min(...allPrices);   
        return priceFilters.some(range => 
          minPrice >= range.min && minPrice <= range.max
        );
      });
    }

    if (ratingFilter) {
      filtered = filtered.filter(product => 
        product.ratingValue >= ratingFilter
      );
    }

    setFilteredProducts(filtered);
  };

  const handleDistrictFilterChange = (district, isChecked) => {
    if (district === 'All') {
      setDistrictFilters(isChecked ? ['All'] : []);
    } else {
      if (isChecked) {
        const newFilters = districtFilters.filter(d => d !== 'All');
        setDistrictFilters([...newFilters, district]);
      } else {
        setDistrictFilters(districtFilters.filter(d => d !== district));
      }
    }
  };

  const handleCategoryFilterChange = (category, isChecked) => {
    if (category === 'All') {
      setCategoryFilters(isChecked ? ['All'] : []);
    } else {
      if (isChecked) {
        const newFilters = categoryFilters.filter(c => c !== 'All');
        setCategoryFilters([...newFilters, category]);
      } else {
        setCategoryFilters(categoryFilters.filter(c => c !== category));
      }
    }
  };

  const handlePriceFilterChange = (range, isChecked) => {
    if (isChecked) {
      setPriceFilters([...priceFilters, range]);
    } else {
      setPriceFilters(priceFilters.filter(r => r.label !== range.label));
    }
  };

  const handleRatingFilterChange = (ratingValue) => {
    setRatingFilter(ratingFilter === ratingValue ? null : ratingValue);
  };

  const clearAllFilters = () => {
    setDistrictFilters([]);
    setCategoryFilters([]);
    setPriceFilters([]);
    setRatingFilter(null);
  };

  const removeDistrictFilter = (district) => {
    setDistrictFilters(districtFilters.filter(d => d !== district));
  };

  const removeCategoryFilter = (category) => {
    setCategoryFilters(categoryFilters.filter(c => c !== category));
  };

  const removePriceFilter = (range) => {
    setPriceFilters(priceFilters.filter(r => r.label !== range.label));
  };

  const removeRatingFilter = () => {
    setRatingFilter(null);
  };

  const getProductPrice = (product) => {
    if (!product.variants || product.variants.length === 0) {
      return 'Price not available';
    }
    const allPrices = product.variants.flatMap(variant => 
      variant.weights.map(weight => weight.price)
    ).filter(price => price != null);
    if (allPrices.length === 0) {
      return 'Price not available';
    }
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    if (minPrice === maxPrice) {
      return `₹${minPrice}`;
    }
    return `₹${minPrice} - ₹${maxPrice}`;
  };

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

  const renderStars = (rating) => {
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

  if (loading) {
    return (
      <div>
        <div className="main-container">
          <Navbar />
          <div className="loading-container">
            <p>Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="main-container">
          <div className="error-container">
            <p>{error}</p>
            <button onClick={fetchProducts} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="main-container">
        <div className="content-layout">
          {/* Fixed Sidebar - Always visible on the left */}
          <div className="sidebar sidebar-fixed">
            <div className="filters-container">
              <div className="filters-header">
                <h2 className="filters-title">Filters</h2>
                <div className="filter-header-actions">
                  {(districtFilters.length > 0 || categoryFilters.length > 0 || priceFilters.length > 0 || ratingFilter) && (
                    <button className="clear-all-btn" onClick={clearAllFilters}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filters */}
              {(districtFilters.length > 0 || categoryFilters.length > 0 || priceFilters.length > 0 || ratingFilter) && (
                <div className="filter-section">
                  <h3 className="filter-section-title">Active Filters</h3>
                  <div className="filter-options" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '8px' }}>
                    {districtFilters.map((district) => (
                      <div key={district} className="active-filter-tag">
                        {district}
                        <button onClick={() => removeDistrictFilter(district)} className="remove-filter-btn">
                          ×
                        </button>
                      </div>
                    ))}
                    {categoryFilters.map((category) => (
                      <div key={category} className="active-filter-tag">
                        {category}
                        <button onClick={() => removeCategoryFilter(category)} className="remove-filter-btn">
                          ×
                        </button>
                      </div>
                    ))}
                    {priceFilters.map((range) => (
                      <div key={range.label} className="active-filter-tag">
                        {range.label}
                        <button onClick={() => removePriceFilter(range)} className="remove-filter-btn">
                          ×
                        </button>
                      </div>
                    ))}
                    {ratingFilter && (
                      <div className="active-filter-tag">
                        {ratingOptions.find(r => r.value === ratingFilter)?.label || `${ratingFilter} stars`}
                        <button onClick={removeRatingFilter} className="remove-filter-btn">
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Districts Filter */}
              <div className="filter-section">
                <h3 className="filter-section-title">Districts</h3>
                <div className="filter-options">
                  {districts.map((district) => (
                    <label key={district._id} className="filter-option">
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={districtFilters.includes(district.name)}
                        onChange={(e) => handleDistrictFilterChange(district.name, e.target.checked)}
                      />
                      <span className="filter-text">{district.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories Filter */}
              <div className="filter-section">
                <h3 className="filter-section-title">Categories</h3>
                <div className="filter-options">
                  {categories.map((category) => (
                    <label key={category._id} className="filter-option">
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={categoryFilters.includes(category.name)}
                        onChange={(e) => handleCategoryFilterChange(category.name, e.target.checked)}
                      />
                      <span className="filter-text">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="filter-section">
                <h3 className="filter-section-title">Price Range</h3>
                <div className="filter-options">
                  {priceRanges.map((range) => (
                    <label key={range._id} className="filter-option">
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={priceFilters.some(f => f.label === range.label)}
                        onChange={(e) => handlePriceFilterChange(range, e.target.checked)}
                      />
                      <span className="filter-text">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="filter-section">
                <h3 className="filter-section-title">Rating</h3>
                <div className="filter-options">
                  {ratingOptions.map((rating) => (
                    <label key={rating._id} className="filter-option">
                      <input
                        type="radio"
                        name="rating"
                        className="filter-checkbox"
                        checked={ratingFilter === rating.value}
                        onChange={() => handleRatingFilterChange(rating.value)}
                      />
                      <span className="filter-text">{rating.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            {filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map((product, index) => (
                  <div key={product._id} className="product-card">
                    <div className="image-container">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="product-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://i.imgur.com/YCa6FJD.jpg';
                        }}
                      />
                      <div className="image-overlay"></div>
                      <span className="category-badge">{product.category}</span>
                      {!product.inStock && <span className="out-of-stock-badge">Out of Stock</span>}
                    </div>
                    <div className="content">
                      <h3 className="product-name">{product.name}</h3>
                      <div className="name-line"></div>

                      <div className="details">
                        <p className="subtitle">{product.subtitle}</p>
                        <p className="price">{getProductPrice(product)}</p>
                        {product.ratingValue && (
                          <div className="rating">
                            <span className="stars">{renderStars(product.ratingValue)}</span>
                            <span className="rating-value">({product.ratingValue})</span>
                          </div>
                        )}
                      </div>
                      <button
                        className={`shop-btn btn-color-${(index % 4) + 1} ${!product.inStock ? 'disabled' : ''}`}
                        onClick={() => product.inStock && navigate('/fooditem', { state: product })}
                        disabled={!product.inStock}
                      >
                        {product.inStock ? 'Shop Now' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <h3>No products match your filters</h3>
                <p>Try adjusting your filters to see more results</p>
                <button className="clear-filters-btn" onClick={clearAllFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodEdibles;