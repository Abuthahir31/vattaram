import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminNavbar from './AdminNavbar';
import './AboutUsAdmin.css';

const AboutUsAdmin = () => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    connectionToSouth: {
      title: '',
      description: '',
      items: [{ name: '', description: '' }],
    },
    commitment: {
      title: '',
      description: [''],
    },
    images: [{ src: '', alt: '', caption: '' }],
  });
  const [aboutUsData, setAboutUsData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAboutUsData(); }, []);

  const fetchAboutUsData = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/about-us');
      setAboutUsData(data);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 404) {
        setAboutUsData(null);
      } else {
        console.error('Failed to fetch About Us data:', error);
      }
      setLoading(false);
    }
  };

  const handleChange = (e, section = null, index = null, field = null) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      if (section === 'connectionToSouth' && index !== null) {
        const newItems = [...prev.connectionToSouth.items];
        newItems[index] = { ...newItems[index], [name]: value };
        return {
          ...prev,
          connectionToSouth: { ...prev.connectionToSouth, items: newItems }
        };
      }
      
      if (section === 'commitment' && index !== null) {
        const newDescription = [...prev.commitment.description];
        newDescription[index] = value;
        return {
          ...prev,
          commitment: { ...prev.commitment, description: newDescription }
        };
      }
      
      if (section === 'images' && index !== null) {
        const newImages = [...prev.images];
        newImages[index] = { ...newImages[index], [name]: value };
        return { ...prev, images: newImages };
      }
      
      if (section === 'connectionToSouth') {
        return {
          ...prev,
          connectionToSouth: { ...prev.connectionToSouth, [name]: value }
        };
      }
      
      if (section === 'commitment' && field === 'title') {
        return {
          ...prev,
          commitment: { ...prev.commitment, title: value }
        };
      }
      
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const method = editingId ? 'put' : 'post';
      const { data } = await axios[method]('http://localhost:5000/api/about-us', formData);
      
      setStatus(`About Us content ${editingId ? 'updated' : 'created'} successfully!`);
      setAboutUsData(data);
      resetForm();
      fetchAboutUsData();
    } catch (error) {
      setStatus('Error processing About Us content.');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      connectionToSouth: {
        title: '',
        description: '',
        items: [{ name: '', description: '' }],
      },
      commitment: {
        title: '',
        description: [''],
      },
      images: [{ src: '', alt: '', caption: '' }],
    });
    setEditingId(null);
    setShowModal(false);
  };

  const handleEdit = () => {
    if (aboutUsData) {
      setFormData(aboutUsData);
      setEditingId(aboutUsData._id);
      setShowModal(true);
    }
  };

  const addItem = (type) => {
    setFormData(prev => {
      if (type === 'connectionItem') {
        return {
          ...prev,
          connectionToSouth: {
            ...prev.connectionToSouth,
            items: [...prev.connectionToSouth.items, { name: '', description: '' }]
          }
        };
      }
      if (type === 'commitmentDesc') {
        return {
          ...prev,
          commitment: {
            ...prev.commitment,
            description: [...prev.commitment.description, '']
          }
        };
      }
      if (type === 'image') {
        return {
          ...prev,
          images: [...prev.images, { src: '', alt: '', caption: '' }]
        };
      }
      return prev;
    });
  };

  const removeItem = (type, index) => {
    setFormData(prev => {
      if (type === 'connectionItem') {
        return {
          ...prev,
          connectionToSouth: {
            ...prev.connectionToSouth,
            items: prev.connectionToSouth.items.filter((_, i) => i !== index)
          }
        };
      }
      if (type === 'commitmentDesc') {
        return {
          ...prev,
          commitment: {
            ...prev.commitment,
            description: prev.commitment.description.filter((_, i) => i !== index)
          }
        };
      }
      if (type === 'image') {
        return {
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
        };
      }
      return prev;
    });
  };

  if (loading) {
    return (
      <div>
        <AdminNavbar />
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading About Us data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminNavbar />
      <div className="admin-container">
        <div className="page-header">
          <h1 className="page-title">About Us Management</h1>
          <button 
            className="edit-icon-btn"
            onClick={() => aboutUsData ? handleEdit() : setShowModal(true)}
          >
            {aboutUsData ? '✏️ ' : '+ Create Content'}
          </button>
        </div>

        {status && (
          <div className={`status-alert ${status.includes('Error') ? 'error' : 'success'}`}>
            {status}
          </div>
        )}

        {aboutUsData ? (
          <div className="content-card">
            <div className="content-header">
              <h2 className="content-title">{aboutUsData.title}</h2>
              <h4 className="content-subtitle">{aboutUsData.subtitle}</h4>
            </div>
            <p className="content-description">{aboutUsData.description}</p>
            
            <div className="section-divider"></div>
            
            <div className="content-section">
              <h5 className="section-title">{aboutUsData.connectionToSouth.title}</h5>
              <p className="section-description">{aboutUsData.connectionToSouth.description}</p>
              <ul className="items-list">
                {aboutUsData.connectionToSouth.items.map((item, index) => (
                  <li key={index} className="list-item">
                    <strong>{item.name}:</strong> {item.description}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="section-divider"></div>
            
            <div className="content-section">
              <h5 className="section-title">{aboutUsData.commitment.title}</h5>
              {aboutUsData.commitment.description.map((para, index) => (
                <p key={index} className="commitment-paragraph">{para}</p>
              ))}
            </div>
            
            {aboutUsData.images.length > 0 && (
              <>
                <div className="section-divider"></div>
                <div className="content-section">
                  <h5 className="section-title">Images</h5>
                  <div className="images-grid">
                    {aboutUsData.images.map((img, index) => (
                      <div key={index} className="image-card">
                        <img src={img.src} alt={img.alt} className="content-image" />
                        <p className="image-caption">{img.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">📄</div>
              <p className="empty-text">No About Us content found. Create your first content!</p>
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingId ? 'Edit About Us Content' : 'Create About Us Content'}
                </h5>
                <button type="button" className="modal-close" onClick={resetForm}>
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="modal-body">
                  {/* Basic Fields */}
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      name="title"
                      className="form-input"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Subtitle</label>
                    <input
                      type="text"
                      name="subtitle"
                      className="form-input"
                      value={formData.subtitle}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-textarea"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Connection to South */}
                  <div className="form-section">
                    <h5 className="form-section-title">Connection to South</h5>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        name="title"
                        className="form-input"
                        value={formData.connectionToSouth.title}
                        onChange={(e) => handleChange(e, 'connectionToSouth')}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        className="form-textarea"
                        rows="3"
                        value={formData.connectionToSouth.description}
                        onChange={(e) => handleChange(e, 'connectionToSouth')}
                        required
                      />
                    </div>
                    
                    <label className="form-label">Items</label>
                    {formData.connectionToSouth.items.map((item, index) => (
                      <div key={index} className="dynamic-item">
                        <div className="item-fields">
                          <input
                            type="text"
                            name="name"
                            className="form-input"
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => handleChange(e, 'connectionToSouth', index)}
                            required
                          />
                          <input
                            type="text"
                            name="description"
                            className="form-input"
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => handleChange(e, 'connectionToSouth', index)}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-remove"
                            onClick={() => removeItem('connectionItem', index)}
                            disabled={formData.connectionToSouth.items.length === 1}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-add"
                      onClick={() => addItem('connectionItem')}
                    >
                      + Add Item
                    </button>
                  </div>

                  {/* Commitment */}
                  <div className="form-section">
                    <h5 className="form-section-title">Commitment</h5>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        name="title"
                        className="form-input"
                        value={formData.commitment.title}
                        onChange={(e) => handleChange(e, 'commitment', null, 'title')}
                        required
                      />
                    </div>
                    
                    <label className="form-label">Description Paragraphs</label>
                    {formData.commitment.description.map((para, index) => (
                      <div key={index} className="dynamic-item">
                        <div className="item-fields">
                          <textarea
                            className="form-textarea"
                            rows="2"
                            placeholder={`Paragraph ${index + 1}`}
                            value={para}
                            onChange={(e) => handleChange(e, 'commitment', index)}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-remove"
                            onClick={() => removeItem('commitmentDesc', index)}
                            disabled={formData.commitment.description.length === 1}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-add"
                      onClick={() => addItem('commitmentDesc')}
                    >
                      + Add Paragraph
                    </button>
                  </div>

                  {/* Images */}
                  <div className="form-section">
                    <h5 className="form-section-title">Images</h5>
                    {formData.images.map((image, index) => (
                      <div key={index} className="dynamic-item">
                        <div className="item-fields image-fields">
                          <input
                            type="text"
                            name="src"
                            className="form-input"
                            placeholder="Image URL"
                            value={image.src}
                            onChange={(e) => handleChange(e, 'images', index)}
                            required
                          />
                          <input
                            type="text"
                            name="alt"
                            className="form-input"
                            placeholder="Alt text"
                            value={image.alt}
                            onChange={(e) => handleChange(e, 'images', index)}
                            required
                          />
                          <input
                            type="text"
                            name="caption"
                            className="form-input"
                            placeholder="Caption"
                            value={image.caption}
                            onChange={(e) => handleChange(e, 'images', index)}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-remove"
                            onClick={() => removeItem('image', index)}
                            disabled={formData.images.length === 1}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-add"
                      onClick={() => addItem('image')}
                    >
                      + Add Image
                    </button>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update Content' : 'Create Content'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutUsAdmin;