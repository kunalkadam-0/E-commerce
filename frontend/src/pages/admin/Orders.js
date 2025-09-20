// frontend/src/pages/admin/Orders.js

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../../components/admin/Sidebar';
import { useNavigate, Link } from 'react-router-dom';

const ALLOWED_ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const ALLOWED_PAYMENT_STATUSES = ['paid', 'failed', 'refunded', 'cod_pending'];


function AdminOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const memoizedFetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/orders', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            console.log("API Response Data for Orders:", response.data);

            if (Array.isArray(response.data)) {
                setOrders(response.data);
            } else {
                console.error("API response for orders is not an array:", response.data);
                setError("Unexpected data format received from server. Check console for details.");
            }
            
            setLoading(false);

        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to fetch orders. Please ensure your backend is running and you are logged in as an admin.');
            setLoading(false);

            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                navigate('/login');
            }
        }
    }, [navigate]);

    useEffect(() => {
        memoizedFetchOrders();
    }, [memoizedFetchOrders]);

    const handleStatusChange = async (orderId, newStatusValue, statusType) => {
        const endpoint = statusType === 'order_status' ? `order-status` : `payment-status`;
        
        try {
            const token = localStorage.getItem('token');
            const payload = statusType === 'order_status' ? { order_status: newStatusValue } : { payment_status: newStatusValue };

            await axios.put(`http://localhost:5000/api/orders/${orderId}/${endpoint}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            window.alert(`${statusType.replace('_', ' ').charAt(0).toUpperCase() + statusType.replace('_', ' ').slice(1)} updated successfully to ${newStatusValue}!`);
            memoizedFetchOrders();
        } catch (err) {
            console.error(`Error updating ${statusType}:`, err);
            let errorMessage = `Failed to update ${statusType}.`;
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage += ` Server message: ${err.response.data.message}`;
            } else {
                errorMessage += ` Check console for details.`;
            }
            window.alert(errorMessage);
        }
    };


    if (loading) {
        return (
            <div className="d-flex" style={{ minHeight: '100vh' }}>
                <Sidebar />
                <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '250px' }}>
                    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
                        <div className="container-fluid">
                            <Link className="navbar-brand" to="/admin/orders">Admin Orders Management</Link>
                            <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                        </div>
                    </nav>
                    <div className="container-fluid p-4 flex-grow-1">
                        <h2 className="mb-3">Manage Orders</h2>
                        <p>Loading orders...</p>
                    </div>
                    <footer className="bg-dark text-white text-center py-3 w-100">
                        <p className="mb-0">&copy; Admin Panel 2024</p>
                    </footer>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="d-flex" style={{ minHeight: '100vh' }}>
                <Sidebar />
                <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '250px' }}>
                    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
                        <div className="container-fluid">
                            <Link className="navbar-brand" to="/admin/orders">Admin Orders Management</Link>
                            <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                        </div>
                    </nav>
                    <div className="container-fluid p-4 flex-grow-1">
                        <h2 className="mb-3">Manage Orders</h2>
                        <div className="alert alert-danger">{error}</div>
                    </div>
                    <footer className="bg-dark text-white text-center py-3 w-100">
                        <p className="mb-0">&copy; Admin Panel 2024</p>
                    </footer>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            <Sidebar />

            <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '250px' }}>
                <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/admin/orders">Admin Orders Management</Link>
                        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                    </div>
                </nav>

                <div className="container-fluid p-4 flex-grow-1">
                    <h2 className="mb-3">Manage Orders</h2>
                    {orders.length === 0 ? (
                        <p>No orders found.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer Name</th>
                                        <th>Total Amount</th>
                                        <th>Order Date</th>
                                        <th>Shipping Address</th>
                                        <th>Payment Method</th>
                                        <th>Payment Status</th>
                                        <th>Order Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.order_id}>
                                            <td>{order.order_id}</td>
                                            <td>{order.first_name} {order.last_name}</td> 
                                            <td>₹{order.total_amount ? parseFloat(order.total_amount).toFixed(2) : '0.00'}</td>
                                            <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                            <td>{order.shipping_address}</td>
                                            <td>{order.payment_method}</td>
                                            <td>
                                                {/* Conditional rendering for Payment Status dropdown */}
                                                {order.payment_method === 'cash' ? (
                                                    // Display dropdown ONLY if payment_method is 'cash' (Cash On Delivery)
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={order.payment_status}
                                                        onChange={(e) => handleStatusChange(order.order_id, e.target.value, 'payment_status')}
                                                    >
                                                        {ALLOWED_PAYMENT_STATUSES.map(status => (
                                                            <option key={status} value={status}>
                                                                {status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    // For 'card' payments, just display the status as plain text (e.g., "Paid")
                                                    <span className="badge bg-success">
                                                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {/* Order Status Dropdown (always editable) */}
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={order.order_status}
                                                    onChange={(e) => handleStatusChange(order.order_id, e.target.value, 'order_status')}
                                                >
                                                    {ALLOWED_ORDER_STATUSES.map(status => (
                                                        <option key={status} value={status}>
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <footer className="bg-dark text-white text-center py-3 w-100 mt-auto">
                    <p className="mb-0">&copy; Admin Panel 2024</p>
                </footer>
            </div>
        </div>
    );
}

export default AdminOrders;