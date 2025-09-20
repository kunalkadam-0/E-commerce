// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout Components
import UserLayout from './components/layout/UserLayout';

// User Pages
import HomePage from './pages/user/Home';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import MenPage from './pages/user/MenPage';
import WomenPage from './pages/user/WomenPage';
import KidsPage from './pages/user/KidsPage';
import ProductPage from './pages/user/ProductPage';
import CartPage from './pages/user/CartPage';
import UserProfilePage from './pages/user/UserProfilePage';
import CheckoutPage from './pages/user/CheckoutPage';
import CardPaymentPage from './pages/user/CardPaymentPage';
import OrderSuccessPage from './pages/user/OrderSuccessPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import AdminEditProduct from './pages/admin/EditProduct';

// Context
import ShopContextProvider from './Context/ShopContext';

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const roleFromStorage = localStorage.getItem('userRole');
    if (roleFromStorage) {
      setUserRole(roleFromStorage);
    }
    setIsAuthChecked(true);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedRole = localStorage.getItem('userRole');
      setUserRole(updatedRole);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!isAuthChecked) {
    return <div>Loading application...</div>;
  }

  const isAdmin = userRole === 'admin';

  return (
    <ShopContextProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<UserLayout userRole={userRole} setUserRole={setUserRole}><HomePage /></UserLayout>} />
          <Route path="/login" element={<UserLayout userRole={userRole}><LoginPage setUserRole={setUserRole} /></UserLayout>} />
          <Route path="/register" element={<UserLayout userRole={userRole}><RegisterPage /></UserLayout>} />
          <Route path="/mens" element={<UserLayout userRole={userRole}><MenPage /></UserLayout>} />
          <Route path="/womens" element={<UserLayout userRole={userRole}><WomenPage /></UserLayout>} />
          <Route path="/kids" element={<UserLayout userRole={userRole}><KidsPage /></UserLayout>} />
          <Route path="/product/:productId" element={<UserLayout userRole={userRole}><ProductPage /></UserLayout>} />
          <Route path="/cart" element={<UserLayout userRole={userRole}><CartPage /></UserLayout>} />
          <Route path="/profile" element={<UserLayout userRole={userRole}><UserProfilePage /></UserLayout>} />
          <Route path="/checkout" element={<UserLayout userRole={userRole}><CheckoutPage /></UserLayout>} />
          <Route path="/payment/card" element={<UserLayout userRole={userRole}><CardPaymentPage /></UserLayout>} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={isAdmin ? <AdminDashboard setUserRole={setUserRole} /> : <Navigate to="/login" replace />} />
          <Route path="/admin/products" element={isAdmin ? <AdminProducts /> : <Navigate to="/login" replace />} />
          <Route path="/admin/products/edit/:productId" element={isAdmin ? <AdminEditProduct /> : <Navigate to="/login" replace />} />
          <Route path="/admin/users" element={isAdmin ? <AdminUsers /> : <Navigate to="/login" replace />} />
          <Route path="/admin/orders" element={isAdmin ? <AdminOrders /> : <Navigate to="/login" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ShopContextProvider>
  );
}

export default App;
