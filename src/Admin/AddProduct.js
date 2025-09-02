import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminNavbar from './AdminNavbar';
import './ProductsPage.css';

const AddProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    subtitle: '',
    description: '',
    category: '',
    district: '',
    ratingValue: '',
    variants: [{
      weights: [{
        value: '',
        unit: 'g',
        price: '',
        quantity: 0
      }]
    }]
  });

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTrendingModal, setShowTrendingModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);
  const [cats, setCats] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCats();
    fetchDistricts();
    fetchTrendingProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, selectedDistrict]);

  const filterProducts = () => {
    let result = [...products];
    
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    if (selectedDistrict) {
      result = result.filter(product => product.district === selectedDistrict);
    }
    
    setFilteredProducts(result);
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data } = await axios.get('http://localhost:5000/api/products');
      const groupedProducts = [];
      const productMap = new Map();
      
      data.forEach(item => {
        if (!productMap.has(item._id)) {
          productMap.set(item._id, {
            _id: item._id,
            name: item.name,
            image: item.image,
            imageUrl: item.imageUrl,
            subtitle: item.subtitle,
            description: item.description,
            category: item.category,
            district: item.district,
            ratingValue: item.ratingValue,
            variants: [],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          });
        }
        
        const product = productMap.get(item._id);
        let variant = product.variants[item.variantIndex];
        
        if (!variant) {
          variant = { weights: [] };
          product.variants[item.variantIndex] = variant;
        }
        
        variant.weights[item.weightIndex] = item.weight;
      });
      
      const processedProducts = Array.from(productMap.values()).map(product => ({
        ...product,
        variants: product.variants.filter(v => v !== undefined)
      }));
      
      groupedProducts.push(...processedProducts);
      
      setProducts(groupedProducts);
      setFilteredProducts(groupedProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setStatus('❌ Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      setLoadingTrending(true);
      const response = await axios.get('http://localhost:5000/api/products/trending');
      setTrendingProducts(response.data);
    } catch (error) {
      console.error('Error fetching trending products:', error);
      setStatus('❌ Failed to load trending products');
    } finally {
      setLoadingTrending(false);
    }
  };

  const addToTrending = async (productId) => {
    try {
      await axios.put(`http://localhost:5000/api/products/${productId}/trending`, { isTrending: true });
      setStatus('✅ Product added to trending successfully!');
      fetchTrendingProducts();
    } catch (error) {
      console.error('Error adding to trending:', error);
      setStatus('❌ Failed to add product to trending');
    }
  };

  const removeFromTrending = async (productId) => {
    try {
      await axios.put(`http://localhost:5000/api/products/${productId}/trending`, { isTrending: false });
      setStatus('✅ Product removed from trending successfully!');
      fetchTrendingProducts();
    } catch (error) {
      console.error('Error removing from trending:', error);
      setStatus('❌ Failed to remove product from trending');
    }
  };

  const fetchCats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/categories');
      const data = await res.json();
      setCats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCats([
        { name: 'Sweets' },
        { name: 'Sweeteners' },
        { name: 'Dry Fruits' },
        { name: 'Snacks' },
        { name: 'Spices' }
      ]);
    }
  };

  const fetchDistricts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/districts');
      const data = await res.json();
      setDistricts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching districts:', err);
      setDistricts([
        { name: 'Chennai' },
        { name: 'Coimbatore' },
        { name: 'Madurai' },
        { name: 'Salem' },
        { name: 'Tirupur' }
      ]);
    }
  };

  const handleChange = (e, variantIdx, weightIdx) => {
    const { name, value, type, files } = e.target;

    if (name === 'imageFile') {
      const f = files[0];
      if (f) {
        setFile(f);
        setFormData(prev => ({ ...prev, image: '' }));
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(f);
      }
      return;
    }

    if (name.startsWith('weight-')) {
      const field = name.split('-')[1];
      setFormData(prev => {
        const newVars = [...prev.variants];
        newVars[variantIdx].weights[weightIdx] = { 
          ...newVars[variantIdx].weights[weightIdx], 
          [field]: type === 'number' ? (value === '' ? '' : (field === 'quantity' ? parseInt(value) : parseFloat(value))) : value 
        };
        return { ...prev, variants: newVars };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'image') {
        setPreview(value);
        setFile(null);
      }
    }
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          weights: [{
            value: '',
            unit: 'g',
            price: '',
            quantity: 0
          }]
        }
      ]
    }));
  };

  const removeVariant = (idx) => {
    if (formData.variants.length === 1) {
      setStatus('❌ At least one variant is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx)
    }));
  };

  const addWeight = (variantIdx) => {
    setFormData(prev => {
      const newVars = [...prev.variants];
      newVars[variantIdx].weights.push({
        value: '',
        unit: 'g',
        price: '',
        quantity: 0
      });
      return { ...prev, variants: newVars };
    });
  };

  const removeWeight = (variantIdx, weightIdx) => {
    if (formData.variants[variantIdx].weights.length === 1) {
      setStatus('❌ At least one weight option is required per variant');
      return;
    }
    setFormData(prev => {
      const newVars = [...prev.variants];
      newVars[variantIdx].weights = newVars[variantIdx].weights.filter((_, i) => i !== weightIdx);
      return { ...prev, variants: newVars };
    });
  };

  const validateForm = () => {
    const { name, subtitle, description, category, district, image, variants, ratingValue } = formData;

    if (!name?.trim() || !subtitle?.trim() || !description?.trim() || !category?.trim() || !district?.trim()) {
      setStatus('❌ Please fill all required fields: Name, Subtitle, Description, Category, District.');
      return false;
    }

    if (!image?.trim() && !file) {
      setStatus('❌ Please provide either an image URL or upload an image file.');
      return false;
    }

    if (ratingValue && (isNaN(parseFloat(ratingValue)) || parseFloat(ratingValue) < 0 || parseFloat(ratingValue) > 5)) {
      setStatus('❌ Rating value must be a number between 0 and 5.');
      return false;
    }

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];

      for (let j = 0; j < variant.weights.length; j++) {
        const weight = variant.weights[j];
        
        if (!weight.value || !weight.unit?.trim() || !weight.price || weight.quantity === '' || weight.quantity === undefined) {
          setStatus(`❌ Please fill all weight fields for variant ${i + 1}, weight option ${j + 1}.`);
          return false;
        }

        const weightValue = parseFloat(weight.value);
        if (isNaN(weightValue) || weightValue <= 0) {
          setStatus(`❌ Weight value for variant ${i + 1}, option ${j + 1} must be a positive number.`);
          return false;
        }

        const priceValue = parseFloat(weight.price);
        if (isNaN(priceValue) || priceValue <= 0) {
          setStatus(`❌ Price for variant ${i + 1}, option ${j + 1} must be a positive number.`);
          return false;
        }

        const quantityValue = parseInt(weight.quantity);
        if (isNaN(quantityValue) || quantityValue < 0) {
          setStatus(`❌ Quantity for variant ${i + 1}, option ${j + 1} must be a non-negative number.`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    if (!validateForm()) return;

    let imgPath = formData.image;

    try {
      if (file) {
        const data = new FormData();
        data.append('image', file);

        const uploadRes = await axios.post('http://localhost:5000/api/products/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imgPath = uploadRes.data.imagePath;
      }

      const finalData = {
        name: formData.name.trim(),
        image: imgPath,
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        district: formData.district.trim(),
        ratingValue: formData.ratingValue ? parseFloat(formData.ratingValue) : undefined,
        variants: formData.variants.map(variant => ({
          weights: variant.weights.map(weight => ({
            value: parseFloat(weight.value),
            unit: weight.unit.trim(),
            price: parseFloat(weight.price),
            quantity: parseInt(weight.quantity)
          }))
        }))
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/products/${editingId}`, finalData);
        setStatus('✅ Product updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/products', finalData);
        setStatus('✅ Product added successfully!');
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error('Error:', err);
      const errMsg = err.response?.data?.error || 'Failed to process product. Please try again.';
      setStatus(`❌ ${errMsg}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      subtitle: '',
      description: '',
      category: '',
      district: '',
      ratingValue: '',
      variants: [{
        weights: [{
          value: '',
          unit: 'g',
          price: '',
          quantity: 0
        }]
      }]
    });
    setPreview('');
    setFile(null);
    setEditingId(null);
    setShowModal(false);
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name || '',
      image: product.image || '',
      subtitle: product.subtitle || '',
      description: product.description || '',
      category: product.category || '',
      district: product.district || '',
      ratingValue: product.ratingValue?.toString() || '',
      variants: product.variants.map(variant => ({
        weights: variant.weights.map(weight => ({
          value: weight.value?.toString() || '',
          unit: weight.unit || 'g',
          price: weight.price?.toString() || '',
          quantity: weight.quantity || 0
        }))
      }))
    });
    setPreview(product.imageUrl || product.image);
    setEditingId(product._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      setStatus('✅ Product deleted successfully');
      fetchProducts();
    } catch (err) {
      setStatus('❌ Error deleting product');
      console.error(err);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="admin-star admin-filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="admin-star admin-half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="admin-star admin-empty">☆</span>);
    }

    return stars;
  };

  const renderProductDetail = () => {
    return (
      <div className="admin-product-detail">
        <div className="admin-detail-image-container">
          <img 
            src={selectedProduct.imageUrl || selectedProduct.image} 
            alt={selectedProduct.name} 
            className="admin-detail-img"
          />
        </div>
        <div className="admin-detail-content">
          <h2>{selectedProduct.name}</h2>
          <p className="admin-detail-subtitle">{selectedProduct.subtitle}</p>
          <p className="admin-detail-description">{selectedProduct.description}</p>
          
          <div className="admin-detail-meta">
            <div className="admin-detail-meta-item">
              <span className="admin-label">Category:</span>
              <span className="admin-value">{selectedProduct.category}</span>
            </div>
            <div className="admin-detail-meta-item">
              <span className="admin-label">District:</span>
              <span className="admin-value">{selectedProduct.district}</span>
            </div>
            {selectedProduct.ratingValue && (
              <div className="admin-detail-meta-item">
                <span className="admin-label">Rating:</span>
                <div className="admin-rating">
                  {renderStars(selectedProduct.ratingValue)}
                  <span className="admin-rating-value">({selectedProduct.ratingValue})</span>
                </div>
              </div>
            )}
          </div>

          <div className="admin-detail-variants">
            <h3>Available Options</h3>
            {selectedProduct.variants.map((variant, vIdx) => (
              <div key={vIdx} className="admin-detail-variant-group">
                {variant.weights.map((weight, wIdx) => (
                  <div key={wIdx} className="admin-detail-variant-item">
                    <div className="admin-detail-variant-row">
                      <span className="admin-label">Weight:</span>
                      <span className="admin-value">{weight.value}{weight.unit}</span>
                    </div>
                    <div className="admin-detail-variant-row">
                      <span className="admin-label">Price:</span>
                      <span className="admin-value">₹{weight.price}</span>
                    </div>
                    <div className="admin-detail-variant-row">
                      <span className="admin-label">Stock:</span>
                      <span className="admin-value">{weight.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="admin-detail-actions">
            <button 
              className="admin-edit-btn"
              onClick={() => {
                handleEdit(selectedProduct);
                setShowDetailModal(false);
              }}
            >
              Edit Product
            </button>
            <button 
              className="admin-delete-btn"
              onClick={() => {
                handleDelete(selectedProduct._id);
                setShowDetailModal(false);
              }}
            >
              Delete Product
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendingModal = () => {
    return (
      <div className="admin-modal-overlay">
        <div className="admin-modal-content admin-trending-modal">
          <button 
            className="admin-close-btn" 
            onClick={() => setShowTrendingModal(false)}
          >
            ×
          </button>
          <h2>Manage Trending Products</h2>
          
          <div className="admin-trending-section">
            <div className="admin-add-trending">
              <h3>Add Product to Trending</h3>
              <select
                className="admin-trending-select"
                onChange={(e) => {
                  if (e.target.value) {
                    addToTrending(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Select a product to add</option>
                {products
                  .filter(p => !trendingProducts.some(tp => tp._id === p._id))
                  .map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
              </select>
            </div>
            
            <div className="admin-current-trending">
              <h3>Current Trending Products</h3>
              {loadingTrending ? (
                <div className="admin-loading">Loading trending products...</div>
              ) : trendingProducts.length === 0 ? (
                <p>No trending products currently selected</p>
              ) : (
                <ul className="admin-trending-list">
                  {trendingProducts.map(product => (
                    <li key={product._id} className="admin-trending-item">
                      <div className="admin-trending-product">
                        <img 
                          src={product.imageUrl || product.image} 
                          alt={product.name}
                          className="admin-trending-img"
                        />
                        <span className="admin-trending-name">{product.name}</span>
                      </div>
                      <button
                        className="admin-remove-trending-btn"
                        onClick={() => removeFromTrending(product._id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <AdminNavbar />
      <div className="admin-panel-container">
        <div className="admin-products-page">
          <div className="admin-header-section">
            <h1 className="admin-page-title">Products</h1>
            <div className="admin-action-buttons">
              <button className="admin-add-btn" onClick={() => setShowModal(true)}>
                + Add New Product
              </button>
              <button 
                className="admin-trending-btn"
                onClick={() => setShowTrendingModal(true)}
              >
                Manage Trending
              </button>
            </div>
          </div>

          <div className="admin-filters-section">
            <div className="admin-search-filter">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-search-input"
              />
            </div>
            <div className="admin-dropdown-filters">
              <select
                className="admin-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {cats.map((cat, idx) => (
                  <option key={`cat-${idx}`} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                className="admin-filter-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="">All Districts</option>
                {districts.map((dist, idx) => (
                  <option key={`dist-${idx}`} value={dist.name}>
                    {dist.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {status && (
            <div className={`admin-status-message ${status.includes('❌') ? 'admin-error' : 'admin-success'}`}>
              {status}
            </div>
          )}

          <div className="admin-products-grid">
            {loadingProducts ? (
              <div className="admin-loading">Loading products...</div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div 
                    key={product._id} 
                    className="admin-product-card"
                    onClick={() => handleProductClick(product)}
                >
                    <div className="admin-product-image-container">
                    <img 
                        src={product.imageUrl || product.image} 
                        alt={product.name} 
                        className="admin-product-img"
                    />
                    {trendingProducts.some(tp => tp._id === product._id) && (
                      <span className="admin-trending-badge">Trending</span>
                    )}
                    <span className="admin-category-badge">{product.category}</span>
                    <span className="admin-district-badge">{product.district}</span>
                    </div>
                    
                    <div className="admin-product-info">
                    <h3 className="admin-product-name">{product.name}</h3>
                    <p className="admin-product-subtitle">{product.subtitle}</p>
                    </div>
                </div>
                ))
            ) : (
              <div className="admin-empty-state">
                <img src="/illustration-empty.png" alt="No products" />
                <p>No products found matching your criteria</p>
              </div>
            )}
          </div>
          {showModal && (
            <div className="admin-modal-overlay">
              <div className="admin-modal-content admin-large-modal">
                <h2 className="admin-modal-title">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                <button className="admin-close-btn" onClick={resetForm}>×</button>
                
                <form onSubmit={handleSubmit} className="admin-product-form">
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Product Name *</label>
                      <input
                        className="admin-form-input"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Subtitle *</label>
                      <input
                        className="admin-form-input"
                        name="subtitle"
                        value={formData.subtitle}
                        onChange={handleChange}
                        placeholder="Enter product subtitle"
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Description *</label>
                    <textarea
                      className="admin-form-textarea"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter product description"
                      rows="4"
                      required
                    />
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Category *</label>
                      <select 
                        className="admin-form-select"
                        name="category" 
                        value={formData.category} 
                        onChange={handleChange} 
                        required
                      >
                        <option value="">Select Category</option>
                        {cats.map((cat, idx) => (
                          <option key={`cat-${cat.name}-${idx}`} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">District *</label>
                      <select 
                        className="admin-form-select"
                        name="district" 
                        value={formData.district} 
                        onChange={handleChange} 
                        required
                      >
                        <option value="">Select District</option>
                        {districts.map((dist, idx) => (
                          <option key={`dist-${dist.name}-${idx}`} value={dist.name}>
                            {dist.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Rating (0-5)</label>
                    <input
                      className="admin-form-input"
                      name="ratingValue"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.ratingValue}
                      onChange={handleChange}
                      placeholder="Enter rating (optional)"
                    />
                  </div>

                  <div className="admin-image-section">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Image URL</label>
                      <input
                        className="admin-form-input"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        placeholder="Paste image URL or upload below"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">OR Upload Image File</label>
                      <input
                        className="admin-form-input"
                        type="file"
                        name="imageFile"
                        accept="image/*"
                        onChange={handleChange}
                      />
                    </div>
                    {preview && (
                      <div className="admin-image-preview">
                        <img src={preview} alt="Preview" />
                      </div>
                    )}
                  </div>

                  <div className="admin-variants-section">
                    <h3 className="admin-variants-section-title">Product Weights</h3>
                    {formData.variants.map((variant, vIdx) => (
                      <div key={vIdx} className="admin-variant-form-group">
                        <div className="admin-variant-header">
                          <h4 className="admin-variant-form-title">weights</h4>
                          {formData.variants.length > 1 && (
                            <button
                              type="button"
                              className="admin-remove-variant-btn"
                              onClick={() => removeVariant(vIdx)}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="admin-weights-section">
                          {variant.weights.map((weight, wIdx) => (
                            <div key={wIdx} className="admin-weight-form-group">
                              <div className="admin-weight-header">
                                {variant.weights.length > 1 && (
                                  <button
                                    type="button"
                                    className="admin-remove-weight-btn"
                                    onClick={() => removeWeight(vIdx, wIdx)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              
                              <div className="admin-weight-inputs">
                                <div className="admin-form-group">
                                  <label className="admin-form-label">Value *</label>
                                  <input
                                    className="admin-form-input"
                                    name="weight-value"
                                    type="number"
                                    step="0.01"
                                    value={weight.value}
                                    onChange={(e) => handleChange(e, vIdx, wIdx)}
                                    placeholder="250"
                                    required
                                  />
                                </div>
                                
                                <div className="admin-form-group">
                                  <label className="admin-form-label">Unit *</label>
                                  <select
                                    className="admin-form-select"
                                    name="weight-unit"
                                    value={weight.unit}
                                    onChange={(e) => handleChange(e, vIdx, wIdx)}
                                    required
                                  >
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="l">l</option>
                                    <option value="pcs">pcs</option>
                                  </select>
                                </div>
                                
                                <div className="admin-form-group">
                                  <label className="admin-form-label">Price (₹) *</label>
                                  <input
                                    className="admin-form-input"
                                    name="weight-price"
                                    type="number"
                                    step="0.01"
                                    value={weight.price}
                                    onChange={(e) => handleChange(e, vIdx, wIdx)}
                                    placeholder="199.99"
                                    required
                                  />
                                </div>

                                <div className="admin-form-group">
                                  <label className="admin-form-label">Stock Quantity *</label>
                                  <input
                                    className="admin-form-input"
                                    name="weight-quantity"
                                    type="number"
                                    min="0"
                                    value={weight.quantity}
                                    onChange={(e) => handleChange(e, vIdx, wIdx)}
                                    placeholder="100"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <button type="button" className="admin-add-variant-btn" onClick={addVariant}>
                      + Add Another Weight
                    </button>
                  </div>

                  <button type="submit" className="admin-submit-btn">
                    {editingId ? 'Update Product' : 'Add Product'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {showDetailModal && (
            <div className="admin-modal-overlay">
              <div className="admin-modal-content admin-detail-modal">
                <button 
                  className="admin-close-btn" 
                  onClick={() => setShowDetailModal(false)}
                >
                  ×
                </button>
                {renderProductDetail()}
              </div>
            </div>
          )}

          {showTrendingModal && renderTrendingModal()}
        </div>
      </div>
    </div>
  );
};

export default AddProductForm;