import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminNavbar.css';
import { 
  FiShoppingBag, FiList, FiMapPin, FiMenu, FiX, 
  FiHome, FiInfo, FiStar, FiDollarSign, 
  FiUser,FiPackage, FiLogOut
} from 'react-icons/fi';
import { FaPiggyBank
} from 'react-icons/fa';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const AdminNavbar = () => {
  const [adminMobileMenuOpen, setAdminMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const adminTabs = [
    { id: 'home', label: 'Home', icon: <FiHome />, path: '/admin' },
    { id: 'products', label: 'Products', icon: <FiShoppingBag />, path: '/AddProd' },
    { id: 'users', label: 'Users', icon: <FiUser />, path: '/users' },
    { id: 'categories', label: 'Categories', icon: <FiList />, path: '/AddCat' },
    { id: 'districts', label: 'Districts', icon: <FiMapPin />, path: '/AddDis' },
    { id: 'deals', label: 'Deals', icon: <FaPiggyBank />, path: '/deal' },
    { id: 'aboutus', label: 'About US', icon: <FiInfo />, path: '/about-us' },
    { id: 'testimonials', label: 'Testimonials', icon: <FiStar />, path: '/testimonial' },
    { id: 'orders', label: 'Orders', icon: <FiPackage />, path: '/adminorders' }
  ];

  const isActiveAdminTab = (path) => {
    return window.location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="admin-header-navbar">
      <div className="admin-navbar-brand">
        <h1 className="admin-brand-title">
          <span className="admin-text-primary">South</span>
          <span className="admin-text-danger">Bay</span>
          Mart
        </h1>
      </div>
      
      <div className="admin-nav-container">
        <button 
          className="admin-mobile-menu-btn"
          onClick={() => setAdminMobileMenuOpen(!adminMobileMenuOpen)}
        >
          {adminMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        
        <div className="admin-desktop-nav">
          {adminTabs.map(tab => (
            <Link
              key={tab.id}
              to={tab.path}
              className={`admin-nav-item ${isActiveAdminTab(tab.path) ? 'admin-nav-active' : ''}`}
            >
              {tab.icon}
              <span className="admin-nav-label">{tab.label}</span>
            </Link>
          ))}
          <button 
            className="admin-nav-item admin-logout-btn"
            onClick={handleLogout}
          >
            <FiLogOut />
            <span className="admin-nav-label">Logout</span>
          </button>
        </div>
      </div>
      
      <div className={`admin-mobile-nav ${adminMobileMenuOpen ? 'admin-mobile-nav-open' : ''}`}>
        {adminTabs.map(tab => (
          <Link
            key={tab.id}
            to={tab.path}
            className={`admin-nav-item ${isActiveAdminTab(tab.path) ? 'admin-nav-active' : ''}`}
            onClick={() => setAdminMobileMenuOpen(false)}
          >
            {tab.icon}
            <span className="admin-nav-label">{tab.label}</span>
          </Link>
        ))}
        <button 
          className="admin-nav-item admin-logout-btn"
          onClick={() => {
            handleLogout();
            setAdminMobileMenuOpen(false);
          }}
        >
          <FiLogOut />
          <span className="admin-nav-label">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;