import React, { useState, useEffect } from 'react';
import { FaSave, FaTrash, FaPlus, FaEdit, FaSearch, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import AdminNavbar from './AdminNavbar';
import './DealAdmin.css'

const DealAdminPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableWeights, setAvailableWeights] = useState([]);
  const [isManualDiscount, setIsManualDiscount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingDeals, setExistingDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); 
  const [currentDealId, setCurrentDealId] = useState(null);
  const [popupDeal, setPopupDeal] = useState(null);

  const getOneDayFromNow = () => {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return oneDayLater.toISOString().slice(0, 16);
  };

  // Default deal settings
  const defaultDealSettings = {
    title: "OFFER on All South Tamil Nadu Specialties!",
    badgeText: "SouthBayMart Special",
    discountPercentage: 50,
    videoId: "9N8fqzB1c4Q",
    endDate: getOneDayFromNow(),
    active: true,
  };

  const [dealSettings, setDealSettings] = useState({...defaultDealSettings});
  const [dealItems, setDealItems] = useState([]);
  const [newItem, setNewItem] = useState({
    productName: "",
    weight: "",
    originalPrice: "",
    discountedPrice: "",
    image: "",
    description: ""
  });

  // Fetch products and existing deals
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, dealsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/products'),
          axios.get('http://localhost:5000/api/deals')
        ]);
        setProducts(productsRes.data);
        setExistingDeals(dealsRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-calculate discounted price
  useEffect(() => {
    if (newItem.originalPrice && dealSettings.discountPercentage && !isManualDiscount) {
      setNewItem(prev => ({
        ...prev,
        discountedPrice: Math.round(prev.originalPrice * (1 - dealSettings.discountPercentage / 100))
      }));
    }
  }, [dealSettings.discountPercentage, newItem.originalPrice, isManualDiscount]);

  // Handler functions
  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDealSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    if (name === 'discountedPrice') {
      setIsManualDiscount(true);
    }
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductSelect = (e) => {
    const productName = e.target.value;
    if (!productName) {
      setSelectedProduct(null);
      setAvailableWeights([]);
      resetNewItem();
      return;
    }
    const product = products.find(p => p.name === productName);
    if (product) {
      setSelectedProduct(product);
      const weightVariants = products
        .filter(p => p.name === productName)
        .map(p => ({
          value: p.weight.value,
          unit: p.weight.unit,
          price: p.weight.price,
          image: p.imageUrl || p.image,
          description: p.description || p.subtitle
        }));  
      setAvailableWeights(weightVariants);
    } else {
      setAvailableWeights([]);
      resetNewItem();
    }
  };

  const handleWeightSelect = (weight) => {
    if (!weight) {
      resetNewItem();
      return;
    }
    setNewItem({
      productName: selectedProduct.name,
      weight: `${weight.value} ${weight.unit}`,
      originalPrice: weight.price,
      discountedPrice: Math.round(weight.price * (1 - dealSettings.discountPercentage / 100)),
      image: weight.image,
      description: weight.description
    });
    setIsManualDiscount(false);
  };

  const resetNewItem = () => {
    setNewItem({
      productName: "",
      weight: "",
      originalPrice: "",
      discountedPrice: "",
      image: "",
      description: ""
    });
    setIsManualDiscount(false);
  };

  const addDealItem = (e) => {
    e.preventDefault();
    if (!newItem.productName || !newItem.weight || !newItem.originalPrice || !newItem.discountedPrice) return;
    const exists = dealItems.find(item => 
      item.productName === newItem.productName && item.weight === newItem.weight
    );
    if (exists) {
      alert('This product with the same weight is already added to the deal!');
      return;
    }
    const item = {
      id: Date.now(),
      productName: newItem.productName,
      weight: newItem.weight,
      originalPrice: parseFloat(newItem.originalPrice),
      discountedPrice: parseFloat(newItem.discountedPrice),
      image: newItem.image,
      description: newItem.description
    };
    setDealItems([...dealItems, item]);
    resetNewItem();
    setSelectedProduct(null);
    setAvailableWeights([]);
  };

  const removeDealItem = (id) => {
    setDealItems(dealItems.filter(item => item.id !== id));
  };

  const saveDeal = async (e) => {
    e.preventDefault();
    if (dealItems.length === 0) {
      alert('Please add at least one item to the deal before saving!');
      return;
    }   
    setSaving(true);    
    try {
      const dealData = {
        title: dealSettings.title,
        badgeText: dealSettings.badgeText,
        discountPercentage: dealSettings.discountPercentage,
        videoId: dealSettings.videoId,
        endDate: dealSettings.endDate,
        active: dealSettings.active,
        items: dealItems.map(item => ({
          productName: item.productName,
          weight: item.weight,
          originalPrice: item.originalPrice,
          discountedPrice: item.discountedPrice,
          image: item.image,
          description: item.description
        }))
      };
      
      let response;
      if (currentDealId) {
        // Update existing deal
        response = await axios.put(`http://localhost:5000/api/deals/${currentDealId}`, dealData);
      } else {
        // Create new deal
        response = await axios.post('http://localhost:5000/api/deals', dealData);
      }
      
      console.log("Deal saved successfully:", response.data);
      alert("Deal saved successfully!");
      
      // Refresh deals list
      const dealsRes = await axios.get('http://localhost:5000/api/deals');
      setExistingDeals(dealsRes.data);
      
      // Reset form
      setDealItems([]);
      setDealSettings({...defaultDealSettings, endDate: getOneDayFromNow()});
      resetNewItem();
      setViewMode('list');
      setCurrentDealId(null);
    } catch (err) {
      console.error("Error saving deal:", err);
      alert(`Failed to save deal: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const editDeal = (deal) => {
    setDealSettings({
      title: deal.title,
      badgeText: deal.badgeText,
      discountPercentage: deal.discountPercentage,
      videoId: deal.videoId,
      endDate: getOneDayFromNow(), // Set to 1 day from now when editing
      active: deal.active,
    });
    setDealItems(deal.items.map(item => ({
      ...item,
      id: Date.now() + Math.random() // Generate new IDs for editing
    })));
    setCurrentDealId(deal._id);
    setViewMode('edit');
  };

  const deleteDeal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/deals/${id}`);
      setExistingDeals(existingDeals.filter(deal => deal._id !== id));
      alert('Deal deleted successfully');
      setPopupDeal(null); // Close popup after deletion
    } catch (err) {
      console.error('Error deleting deal:', err);
      alert(`Failed to delete deal: ${err.response?.data?.error || err.message}`);
    }
  };

  const createNewDeal = () => {
    setDealSettings({...defaultDealSettings, endDate: getOneDayFromNow()});
    setDealItems([]);
    resetNewItem();
    setCurrentDealId(null);
    setViewMode('create');
  };

  const cancelEditing = () => {
    setViewMode('list');
    setCurrentDealId(null);
  };

  const openDealPopup = (deal) => {
    setPopupDeal(deal);
  };

  const closeDealPopup = () => {
    setPopupDeal(null);
  };

  const filteredDeals = existingDeals.filter(deal => 
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.badgeText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const uniqueProductNames = [...new Set(products.map(product => product.name))];
  
  if (loading) return <div className="deal-admin-loading">Loading products and deals...</div>;
  if (error) return <div className="deal-admin-error">Error: {error}</div>;

  return (
    <div className="deal-admin-container">
      <AdminNavbar />
      <div className="deal-admin-content">
        {viewMode === 'list' ? (
          <>
            <div className="deal-admin-header">
              <h1>Deal Management</h1>
              <div className="deal-admin-actions">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <FaTimes 
                      className="clear-search" 
                      onClick={() => setSearchTerm('')} 
                    />
                  )}
                </div>
                <button 
                  className="btn-primary"
                  onClick={createNewDeal}
                >
                  <FaPlus /> Create New Deal
                </button>
              </div>
            </div>

            {filteredDeals.length === 0 ? (
              <div className="no-deals">
                {searchTerm ? (
                  <p>No deals match your search criteria</p>
                ) : (
                  <>
                    <p>No deals available</p>
                    <button 
                      className="btn-primary"
                      onClick={createNewDeal}
                    >
                      <FaPlus /> Create Your First Deal
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="deals-list">
                {filteredDeals.map(deal => (
                  <div key={deal._id} className="deal-card">
                    <div 
                      className="deal-card-header"
                      onClick={() => openDealPopup(deal)}
                    >
                      <div className="deal-header-content">
                        <h3>{deal.title}</h3>
                        <div className="deal-header-meta">
                          <span className={`badge ${deal.active ? 'active' : 'inactive'}`}>
                            {deal.active ? 'Active' : 'Inactive'}
                          </span>
                          <span>Ends: {new Date(deal.endDate).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="deal-admin-header">
              <h1>{currentDealId ? 'Edit Deal' : 'Create New Deal'}</h1>
              <button 
                className="btn-secondary"
                onClick={cancelEditing}
              >
                Back to List
              </button>
            </div>

            <form onSubmit={saveDeal}>
              <div className="deal-section">
                <h2>General Settings</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Deal Title</label>
                    <input
                      type="text"
                      name="title"
                      value={dealSettings.title}
                      onChange={handleSettingsChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Badge Text</label>
                    <input
                      type="text"
                      name="badgeText"
                      value={dealSettings.badgeText}
                      onChange={handleSettingsChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount Percentage (%)</label>
                    <input
                      type="number"
                      name="discountPercentage"
                      value={dealSettings.discountPercentage}
                      onChange={handleSettingsChange}
                      min="1"
                      max="99"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>YouTube Video ID</label>
                    <input
                      type="text"
                      name="videoId"
                      value={dealSettings.videoId}
                      onChange={handleSettingsChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Offer End Date & Time</label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={dealSettings.endDate}
                      onChange={handleSettingsChange}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                    <small className="hint">Automatically set to 1 day from now</small>
                  </div>
                  <div className="form-group switch-group">
                    <label className="switch">
                      <input
                        type="checkbox"
                        name="active"
                        checked={dealSettings.active}
                        onChange={handleSettingsChange}
                      />
                      <span className="slider"></span>
                    </label>
                    <span>Active Deal</span>
                  </div>
                </div>
              </div>

              <div className="deal-section">
                <h2>Deal Items ({dealItems.length})</h2>
                {dealItems.length === 0 ? (
                  <div className="empty-state">
                    No items added to this deal yet
                  </div>
                ) : (
                  <div className="items-list">
                    {dealItems.map(item => (
                      <div key={item.id} className="item-card">
                        <div className="item-image">
                          {item.image && (
                            <img src={item.image} alt={item.productName} />
                          )}
                        </div>
                        <div className="item-details">
                          <h4>{item.productName} - {item.weight}</h4>
                          <div className="item-prices">
                            <span className="discounted-price">₹{item.discountedPrice}</span>
                            <span className="original-price">₹{item.originalPrice}</span>
                            <span className="discount-badge">
                              {Math.round((1 - item.discountedPrice / item.originalPrice) * 100)}% OFF
                            </span>
                          </div>
                          <p className="item-description">{item.description}</p>
                        </div>
                        <button
                          type="button"
                          className="item-delete"
                          onClick={() => removeDealItem(item.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="add-item-form">
                  <h3>Add New Deal Item</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Select Product</label>
                      <select
                        value={newItem.productName}
                        onChange={handleProductSelect}
                      >
                        <option value="">-- Select a product --</option>
                        {uniqueProductNames.map(name => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {availableWeights.length > 0 && (
                      <div className="form-group">
                        <label>Select Weight</label>
                        <select
                          value={newItem.weight}
                          onChange={(e) => {
                            const selectedWeight = availableWeights.find(
                              w => `${w.value} ${w.unit}` === e.target.value
                            );
                            handleWeightSelect(selectedWeight);
                          }}
                        >
                          <option value="">-- Select weight --</option>
                          {availableWeights.map((weight, index) => (
                            <option 
                              key={index}
                              value={`${weight.value} ${weight.unit}`}
                            >
                              {weight.value} {weight.unit} (₹{weight.price})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {newItem.productName && newItem.weight && (
                    <>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Original Price (₹)</label>
                          <input
                            type="number"
                            name="originalPrice"
                            value={newItem.originalPrice}
                            readOnly
                          />
                        </div>
                        <div className="form-group">
                          <label>Discounted Price (₹)</label>
                          <input
                            type="number"
                            name="discountedPrice"
                            min="1"
                            step="0.01"
                            value={newItem.discountedPrice}
                            onChange={handleNewItemChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Discount</label>
                          <input
                            type="text"
                            value={newItem.originalPrice ? `${Math.round((1 - newItem.discountedPrice / newItem.originalPrice) * 100)}% OFF` : ''}
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Image URL</label>
                          <input
                            type="url"
                            name="image"
                            value={newItem.image}
                            readOnly
                          />
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <input
                            type="text"
                            name="description"
                            value={newItem.description}
                            readOnly
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={addDealItem}
                    disabled={!newItem.productName || !newItem.weight || !newItem.discountedPrice}
                  >
                    <FaPlus /> Add Item
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={saving || dealItems.length === 0}
                >
                  <FaSave /> {saving ? 'Saving...' : 'Save Deal'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Deal Popup */}
      {popupDeal && (
        <div className="deal-popup-overlay">
          <div className="deal-popup">
            <div className="deal-popup-header">
              <h3>{popupDeal.title}</h3>
              <button className="close-popup" onClick={closeDealPopup}>
                &times;
              </button>
            </div>
            
            <div className="deal-popup-content">
              <div className="deal-meta">
                <span className={`badge ${popupDeal.active ? 'active' : 'inactive'}`}>
                  {popupDeal.active ? 'Active' : 'Inactive'}
                </span>
                <span>Discount: {popupDeal.discountPercentage}%</span>
                <span>Badge: {popupDeal.badgeText}</span>
                <span>Ends: {new Date(popupDeal.endDate).toLocaleString()}</span>
              </div>
              
              <div className="deal-items-preview">
                <h4>Included Items ({popupDeal.items.length})</h4>
                <div className="preview-items-grid">
                  {popupDeal.items.slice(0, 6).map((item, index) => (
                    <div key={index} className="preview-item">
                      <div className="preview-item-image">
                        {item.image && (
                          <img src={item.image} alt={item.productName} />
                        )}
                      </div>
                      <div className="preview-item-info">
                        <div className="preview-item-name">{item.productName}</div>
                        <div className="preview-item-weight">{item.weight}</div>
                        <div className="preview-item-price">
                          <span className="discounted">₹{item.discountedPrice}</span>
                          <span className="original">₹{item.originalPrice}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {popupDeal.items.length > 6 && (
                    <div className="preview-more-items">
                      +{popupDeal.items.length - 6} more items
                    </div>
                  )}
                </div>
              </div>
              
              <div className="deal-popup-actions">
                <button 
                  className="btn-edit"
                  onClick={() => {
                    editDeal(popupDeal);
                    closeDealPopup();
                  }}
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => deleteDeal(popupDeal._id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealAdminPage;