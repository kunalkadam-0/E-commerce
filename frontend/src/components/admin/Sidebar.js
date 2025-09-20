// frontend/src/components/admin/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  const linkClasses = ({ isActive }) =>
    isActive
      ? 'list-group-item list-group-item-action bg-primary text-white py-3 fw-bold'
      : 'list-group-item list-group-item-action bg-dark text-white-50 py-3';

  return (
    <div
      className="bg-dark text-white d-flex flex-column vh-100 position-fixed shadow-lg"
      style={{ width: '250px' }}
    >
      <h4 className="p-3 text-center border-bottom border-secondary mb-0">Admin Panel</h4>

      <div className="list-group list-group-flush flex-grow-1">
        <NavLink to="/admin/dashboard" className={linkClasses}>
          <i className="bi bi-speedometer2 me-2"></i> Dashboard
        </NavLink>
        <NavLink to="/admin/products" className={linkClasses}>
          <i className="bi bi-box-seam me-2"></i> Products
        </NavLink>
        <NavLink to="/admin/orders" className={linkClasses}>
          <i className="bi bi-cart me-2"></i> Orders
        </NavLink>
        <NavLink to="/admin/users" className={linkClasses}>
          <i className="bi bi-people me-2"></i> Users
        </NavLink>
      </div>
    </div>
  );
}

export default Sidebar;
