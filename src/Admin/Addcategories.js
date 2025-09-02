import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddCategories.css';
import AdminNavbar from './AdminNavbar';

const AddCategories = () => {
  const [formData, setFormData] = useState({ name: '', imageFile: null });
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/categories');
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || (!formData.imageFile && !editingId)) {
      return setStatus('Please provide both name and image.');
    }

    const data = new FormData();
    data.append('name', formData.name);
    if (formData.imageFile) data.append('image', formData.imageFile);

    try {
      editingId 
        ? await axios.put(`http://localhost:5000/api/categories/${editingId}`, data)
        : await axios.post('http://localhost:5000/api/categories', data);
      
      setStatus(`✅ Category ${editingId ? 'updated' : 'added'} successfully!`);
      resetForm();
      fetchCategories();
    } catch (error) {
      setStatus('❌ Error processing category.');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', imageFile: null });
    setEditingId(null);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/categories/${id}`);
      setStatus('✅ Category deleted');
      fetchCategories();
    } catch (err) {
      setStatus('❌ Error deleting category');
      console.error(err);
    }
  };

  return (
    <div>
    <AdminNavbar />
    <div className="categories-page">
      <div className="header-section">
        <h1>Product Categories</h1>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add New Category
        </button>
      </div>

      {status && <div className={`status-message ${status.includes('❌') ? 'error' : 'success'}`}>{status}</div>}

      <div className="categories-grid">
        {categories.length > 0 ? (
          categories.map(category => (
            <div key={category._id} className="category-card">
              <img 
                src={`http://localhost:5000${category.image}`} 
                alt={category.name} 
                className="category-img"
              />
              <h3>{category.name}</h3>
              <div className="card-actions">
                <button onClick={() => { 
                  setFormData({ name: category.name });
                  setEditingId(category._id);
                  setShowModal(true);
                }}>
                  <i className="edit-icon">✏️</i>
                </button>
                <button onClick={() => handleDelete(category._id)}>
                  <i className="delete-icon">🗑️</i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <img src="/illustration-empty.png" alt="No categories" />
            <p>No categories found. Add your first category!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingId ? 'Edit Category' : 'Add New Category'}</h2>
            <button className="close-btn" onClick={resetForm}>×</button>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category Image</label>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleChange}
                  required={!editingId}
                />
              </div>
              <button type="submit" className="submit-btn">
                {editingId ? 'Update Category' : 'Add Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AddCategories;