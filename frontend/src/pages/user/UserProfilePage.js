import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

function UserProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const storedFirstName = localStorage.getItem('userFirstName');
        const storedLastName = localStorage.getItem('userLastName');
        const storedEmail = localStorage.getItem('userEmail');

        if (storedFirstName && storedLastName && storedEmail) {
          setUser({
            first_name: storedFirstName,
            last_name: storedLastName,
            email: storedEmail
          });
        } else {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/orders/myorders`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setOrders(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load orders.');
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="mt-3">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return <div className="container mt-5 text-center alert alert-danger">{error}</div>;
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4 text-center fw-bold text-primary">My Profile</h2>
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* User Details */}
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0"><i className="fas fa-user me-2"></i>User Information</h5>
            </div>
            <div className="card-body">
              <p><i className="fas fa-user-circle me-2"></i><strong>First Name:</strong> {user.first_name}</p>
              <p><i className="fas fa-user-circle me-2"></i><strong>Last Name:</strong> {user.last_name}</p>
              <p><i className="fas fa-envelope me-2"></i><strong>Email:</strong> {user.email}</p>
            </div>
          </div>

          {/* Orders */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0"><i className="fas fa-box-open me-2"></i>My Orders</h5>
            </div>
            <div className="card-body">
              {orders.length === 0 ? (
                <p className="text-center">No orders placed yet.</p>
              ) : (
                <div className="accordion" id="ordersAccordion">
                  {orders.map(order => (
                    <div className="accordion-item" key={order.order_id}>
                      <h2 className="accordion-header" id={`heading${order.order_id}`}>
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#collapse${order.order_id}`}
                          aria-expanded="false"
                          aria-controls={`collapse${order.order_id}`}
                        >
                          <strong>Order #{order.order_id}</strong>
                          <span className="ms-2 badge bg-success">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                          <span className="ms-2 badge bg-secondary">{order.order_status.toUpperCase()}</span>
                        </button>
                      </h2>
                      <div
                        id={`collapse${order.order_id}`}
                        className="accordion-collapse collapse"
                        aria-labelledby={`heading${order.order_id}`}
                        data-bs-parent="#ordersAccordion"
                      >
                        <div className="accordion-body">
                          <p><i className="fas fa-calendar-day me-2"></i><strong>Date:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
                          <p><i className="fas fa-credit-card me-2"></i><strong>Payment:</strong> {order.payment_method} 
                            <span className={`ms-2 badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}>{order.payment_status}</span>
                          </p>
                          <p><i className="fas fa-map-marker-alt me-2"></i><strong>Shipping Address:</strong> {order.shipping_address}</p>
                          <p><i className="fas fa-file-invoice me-2"></i><strong>Billing Address:</strong> {order.billing_address}</p>
                          <h6 className="mt-4">Items:</h6>
                          <ul className="list-group list-group-flush">
                            {order.items.map(item => (
                              <li key={item.order_item_id} className="list-group-item d-flex align-items-center">
                                <img
                                  src={item.image_url ? `http://localhost:5000${item.image_url.replace(/\\/g, '/')}` : 'https://placehold.co/50x50?text=No+Image'}
                                  alt={item.product_name}
                                  className="me-3"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }}
                                />
                                <div>
                                  <strong>{item.product_name}</strong> × {item.quantity}
                                  <div className="text-muted">Size: {item.selected_size}</div>
                                  <div className="text-muted">₹{parseFloat(item.price_at_order).toFixed(2)} each</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
