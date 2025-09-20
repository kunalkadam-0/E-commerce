// frontend/src/pages/admin/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDashboardData, getProducts } from '../../services/api';
import Sidebar from '../../components/admin/Sidebar';

function AdminDashboard({ setUserRole }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductsForCategory = useCallback(async (categoryId = '') => {
    try {
      const response = await getProducts(categoryId);
      console.log(`Fetched ${response.data.length} products for category ${categoryId || 'all'}.`);
    } catch (err) {
      console.error(`Error fetching products for category ${categoryId || 'all'}:`, err);
    }
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData();
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data.');
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          if (setUserRole) setUserRole(null);
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate, fetchProductsForCategory, setUserRole]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userEmail');
    if (setUserRole) {
      setUserRole(null);  // 🔴 ensures Navbar updates
    }
    navigate('/');
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '250px' }}>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm py-3">
          <div className="container-fluid">
            <Link className="navbar-brand fs-4 fw-bold" to="/admin/dashboard">Admin Dashboard</Link>
            <button className="btn btn-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i> Logout
            </button>
          </div>
        </nav>

        <div className="container-fluid p-4 flex-grow-1">
          {loading ? (
            <div className="text-center py-5">
              <h2>Loading Dashboard...</h2>
              <div className="spinner-border text-primary mt-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-danger py-5">
              <h2>Error: {error}</h2>
              <button className="btn btn-danger mt-3" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i> Logout and Return Home
              </button>
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-primary">Welcome to the Admin Panel!</h2>

              <div className="row justify-content-around mt-4">
                <div className="col-md-3 mb-4">
                  <div className="card text-center shadow-sm h-100">
                    <div className="card-body d-flex flex-column justify-content-center">
                      <h5 className="card-title text-info mb-3">Total Orders:</h5>
                      <p className="card-text display-4 fw-bold text-info">{dashboardData.totalOrders}</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-4">
                  <div className="card text-center shadow-sm h-100">
                    <div className="card-body d-flex flex-column justify-content-center">
                      <h5 className="card-title text-success mb-3">Total Users:</h5>
                      <p className="card-text display-4 fw-bold text-success">{dashboardData.totalUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-4">
                  <div className="card text-center shadow-sm h-100">
                    <div className="card-body d-flex flex-column justify-content-center">
                      <h5 className="card-title text-warning mb-3">Total Products:</h5>
                      <p className="card-text display-4 fw-bold text-warning">{dashboardData.totalProducts}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
