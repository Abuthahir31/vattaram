import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DistrictsPage.css';
import AdminNavbar from './AdminNavbar';

const AddDistrict = () => {
  const [formData, setFormData] = useState({ name: '', imageFile: null });
  const [districts, setDistricts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => { fetchDistricts(); }, []);

  const fetchDistricts = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/districts');
      setDistricts(data);
    } catch (error) {
      console.error('Failed to fetch districts:', error);
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
        ? await axios.put(`http://localhost:5000/api/districts/${editingId}`, data)
        : await axios.post('http://localhost:5000/api/districts', data);
      
      setStatus(`✅ District ${editingId ? 'updated' : 'added'} successfully!`);
      resetForm();
      fetchDistricts();
    } catch (error) {
      setStatus('❌ Error processing district.');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', imageFile: null });
    setEditingId(null);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this district?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/districts/${id}`);
      setStatus('✅ District deleted');
      fetchDistricts();
    } catch (err) {
      setStatus('❌ Error deleting district');
      console.error(err);
    }
  };

  return (
    <div>
      <AdminNavbar />
      <div className="districts-page">
        <div className="header-section">
          <h1>Districts</h1>
          <button className="add-btn" onClick={() => setShowModal(true)}>
            + Add New District
          </button>
        </div>

        {status && <div className={`status-message ${status.includes('❌') ? 'error' : 'success'}`}>{status}</div>}

        <div className="districts-grid">
          {districts.length > 0 ? (
            districts.map(district => (
              <div key={district._id} className="district-card">
                <img 
                  src={`http://localhost:5000${district.image}`} 
                  alt={district.name} 
                  className="district-img"
                />
                <h3>{district.name}</h3>
                <div className="card-actions">
                  <button onClick={() => { 
                    setFormData({ name: district.name });
                    setEditingId(district._id);
                    setShowModal(true);
                  }}>
                    <i className="edit-icon">✏️</i>
                  </button>
                  <button onClick={() => handleDelete(district._id)}>
                    <i className="delete-icon">🗑️</i>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <img src="/illustration-empty.png" alt="No districts" />
              <p>No districts found. Add your first district!</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editingId ? 'Edit District' : 'Add New District'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>District Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter district name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>District Image</label>
                  <input
                    type="file"
                    name="imageFile"
                    accept="image/*"
                    onChange={handleChange}
                    required={!editingId}
                  />
                </div>
                <button type="submit" className="submit-btn">
                  {editingId ? 'Update District' : 'Add District'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddDistrict;