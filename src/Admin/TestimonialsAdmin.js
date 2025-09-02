import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar } from 'react-icons/fa';
import AdminNavbar from './AdminNavbar';
import './TestimonialsAdmin.css';

const TestimonialsAdmin = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    rating: 5,
    comment: '',
    image: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/testimonials');
      setTestimonials(data);
      setLoading(false);
    } catch (error) {
      setStatus('❌ Failed to fetch testimonials');
      console.error(error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.location || !formData.comment || !formData.image) {
      return setStatus('❌ Please fill all fields');
    }

    try {
      if (editingId) {
        // Update existing testimonial
        await axios.put(`http://localhost:5000/api/testimonials/${editingId}`, formData);
        setStatus('✅ Testimonial updated successfully');
      } else {
        // Create new testimonial
        await axios.post('http://localhost:5000/api/testimonials', formData);
        setStatus('✅ Testimonial added successfully');
      }
      resetForm();
      fetchTestimonials();
    } catch (error) {
      setStatus('❌ Error saving testimonial');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      rating: 5,
      comment: '',
      image: ''
    });
    setEditingId(null);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/testimonials/${id}`);
      setStatus('✅ Testimonial deleted successfully');
      fetchTestimonials();
    } catch (error) {
      setStatus('❌ Error deleting testimonial');
      console.error(error);
    }
  };

  return (
    <div>
      <AdminNavbar />
      <div className="testimonials-page">
        <div className="test-header-section">
          <h1 className="admin-page-title">Products</h1>
            <button className="admin-add-btn" onClick={() => setShowModal(true)}>
              + Add New Testimonials
            </button>
        </div>

        {status && <div className={`status-message ${status.includes('❌') ? 'error' : 'success'}`}>{status}</div>}

        {loading ? (
          <div className="loading-state">Loading testimonials...</div>
        ) : (
          <div className="testimonials-grid">
            {testimonials.length > 0 ? (
              testimonials.map(testimonial => (
                <div key={testimonial._id} className="testimonial-card">
                  <div className="testimonial-header">
                    <img 
                      src={testimonial.image || 'https://via.placeholder.com/50?text=Image'} 
                      alt={testimonial.name}
                      className="testimonial-img"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=Image'; }}
                    />
                    <div className="testimonial-info">
                      <h3>{testimonial.name}</h3>
                      <p>{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="rating">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={i < testimonial.rating ? 'star-filled' : 'star-empty'}
                      />
                    ))}
                  </div>
                  <p className="testimonial-comment">{testimonial.comment}</p>
                  <div className="card-actions">
                    <button onClick={() => {
                      setFormData({
                        name: testimonial.name,
                        location: testimonial.location,
                        rating: testimonial.rating,
                        comment: testimonial.comment,
                        image: testimonial.image
                      });
                      setEditingId(testimonial._id);
                      setShowModal(true);
                    }}>
                      <i className="edit-icon">✏️</i>
                    </button>
                    <button onClick={() => handleDelete(testimonial._id)}>
                      <i className="delete-icon">🗑️</i>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <img src="/illustration-empty.png" alt="No testimonials" />
                <p>No testimonials found. Add your first testimonial!</p>
              </div>
            )}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingId ? 'Edit Testimonial' : 'Add New Testimonial'}</h2>
                <button className="close-btn" onClick={resetForm}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-scroll-container">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Enter location"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Rating</label>
                    <select
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      required
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Comment</label>
                    <textarea
                      name="comment"
                      value={formData.comment}
                      onChange={handleChange}
                      placeholder="Enter testimonial comment"
                      required
                      rows="4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      placeholder="Enter image URL"
                      required
                    />
                    {formData.image && (
                      <img 
                        src={formData.image} 
                        alt="Preview" 
                        className="image-preview"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL'; }}
                      />
                    )}
                  </div>
                </div>
                <button type="submit" className="submit-btn">
                  {editingId ? 'Update Testimonial' : 'Add Testimonial'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestimonialsAdmin;