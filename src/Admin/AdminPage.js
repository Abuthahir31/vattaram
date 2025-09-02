import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminPage.css";
import AdminNavbar from "./AdminNavbar";
import { FiRefreshCw, FiAlertCircle, FiTrash2, FiUsers } from "react-icons/fi";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get("http://localhost:5000/admin/users");
      setUsers(res.data);
    } catch (err) {
      setError("Failed to load users. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (uid) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`http://localhost:5000/admin/users/${uid}`);
      setUsers(users.filter((u) => u.uid !== uid));
      alert("User deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const getProviderBadge = (provider) => {
    const providerMap = {
      'email': { class: 'provider-email', text: 'Email' },
      'phone': { class: 'provider-phone', text: 'Phone' },
      'google': { class: 'provider-google', text: 'Google' },
  
    };
    
    const providerInfo = providerMap[provider] || { class: 'provider-email', text: provider };
    
    return (
      <span className={`provider-badge ${providerInfo.class}`}>
        {providerInfo.text}
      </span>
    );
  };

  const formatUID = (uid) => {
    return uid ? uid.substring(0, 8) + '...' : 'N/A';
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="admin-app">
      <AdminNavbar />
      <div className="admin-container">
        <div className="admin-content">
          <div className="admin-header">
            {/* <div>
              <h1 className="admin-title">User Management</h1>
              <p className="admin-subtitle">
                View and manage all registered users in the system. 
                You can delete users or refresh the list to see recent changes.
              </p>
            </div> */}
            <div className="header-right">
              <span className="users-count">
                <FiUsers style={{ marginRight: '8px' }} />
                {users.length} {users.length === 1 ? 'User' : 'Users'}
              </span>
              <button 
                onClick={fetchUsers} 
                className="refresh-btn" 
                disabled={loading}
              >
                <FiRefreshCw className={loading ? "spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <FiAlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No Users Found</div>
              <div className="empty-state-subtitle">
                There are currently no registered users in the system. 
                Try refreshing the page or check your connection.
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Provider</th>
                    <th>User ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.uid}>
                      <td>
                        <div className="user-name">{u.name || "Anonymous User"}</div>
                      </td>
                      <td>
                        <div className="user-email">{u.email || "No email"}</div>
                        {u.phone && (
                          <div className="user-phone">{u.phone}</div>
                        )}
                      </td>
                      <td>
                        {getProviderBadge(u.provider)}
                      </td>
                      <td>
                        <div className="user-uid" title={u.uid}>
                          {formatUID(u.uid)}
                        </div>
                      </td>
                      <td>
                        <button 
                          onClick={() => deleteUser(u.uid)}
                          className="delete-btn"
                        >
                          <FiTrash2 size={14} style={{ marginRight: '1px' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;