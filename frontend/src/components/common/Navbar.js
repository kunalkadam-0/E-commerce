// frontend/src/components/common/Navbar.js
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

import logo from '../../assets/logo.png';
import cart_icon from '../../assets/cart_icon.png';

import { ShopContext } from '../../Context/ShopContext';

// Navbar component now accepts userRole and setUserRole as props
const Navbar = ({ userRole, setUserRole }) => { // ADDED userRole, setUserRole as props
  const [menu, setMenu] = useState("shop");
  const { cartItemsCount, updateCartCount } = useContext(ShopContext);
  const navigate = useNavigate();

  // State for user initial, derived from props or localStorage
  const [userInitial, setUserInitial] = useState('');

  // Use useEffect to react to changes in userRole prop
  useEffect(() => {
    const firstName = localStorage.getItem('userFirstName');
    if (userRole && firstName) { // If userRole is set and firstName exists
      setUserInitial(firstName.charAt(0).toUpperCase());
    } else {
      setUserInitial(''); // Clear initial if not logged in
    }
    updateCartCount(); // Always update cart count when login status potentially changes
  }, [userRole, updateCartCount]); // Depend on userRole prop and updateCartCount from context

  // Keep the localStorage listener mainly for cross-tab sync
  // For same-tab login/logout, the userRole prop update is primary
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'token' || event.key === 'userRole' || event.key === 'userFirstName') {
        // When localStorage changes, inform App.js via setUserRole if needed
        // This handles cases where user logs out from *another tab* or clears localStorage
        const updatedRole = localStorage.getItem('userRole');
        // If setUserRole prop is available, call it. This helps App.js stay in sync.
        if (setUserRole) {
            setUserRole(updatedRole); 
        }
        // Also update local Navbar state based on refreshed localStorage
        const firstName = localStorage.getItem('userFirstName');
        if (updatedRole && firstName) {
          setUserInitial(firstName.charAt(0).toUpperCase());
        } else {
          setUserInitial('');
        }
        updateCartCount();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setUserRole, updateCartCount]); // Depend on setUserRole prop and updateCartCount


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userFirstName'); 
    localStorage.removeItem('userLastName');  
    localStorage.removeItem('userEmail');     
    
    // Call setUserRole from props to immediately update App.js's state
    if (setUserRole) {
        setUserRole(null); // Or an empty string, to indicate logged out
    }
    setUserInitial(''); // Clear local initial
    updateCartCount(); // Reset cart count
    navigate('/login'); // Redirect to login page
  };

  const isLoggedIn = !!userRole; // Determine login status directly from userRole prop

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm py-3 px-4"> 
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logo} alt="E-commerce Logo" width="40" height="40" className="d-inline-block align-text-top me-2" />
          <p className="mb-0 fs-4 fw-bold text-dark">E-COMMERCE</p>
        </Link>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item" onClick={() => { setMenu("shop") }}>
              <Link className={`nav-link ${menu === "shop" ? "active" : ""}`} aria-current="page" to="/">Shop</Link>
              {menu === "shop" ? <hr className="nav-menu-hr d-lg-none" /> : <></>}
            </li>
            <li className="nav-item" onClick={() => { setMenu("mens") }}>
              <Link className={`nav-link ${menu === "mens" ? "active" : ""}`} to="/mens">Men</Link>
              {menu === "mens" ? <hr className="nav-menu-hr d-lg-none" /> : <></>}
            </li>
            <li className="nav-item" onClick={() => { setMenu("womens") }}>
              <Link className={`nav-link ${menu === "womens" ? "active" : ""}`} to="/womens">Women</Link>
              {menu === "womens" ? <hr className="nav-menu-hr d-lg-none" /> : <></>}
            </li>
            <li className="nav-item" onClick={() => { setMenu("kids") }}>
              <Link className={`nav-link ${menu === "kids" ? "active" : ""}`} to="/kids">Kid</Link>
              {menu === "kids" ? <hr className="nav-menu-hr d-lg-none" /> : <></>}
            </li>
          </ul>

          <div className="d-flex align-items-center">
            {isLoggedIn ? (
              <div className="nav-item dropdown me-3">
                <button 
                  className="nav-link dropdown-toggle text-dark fw-bold border-0 bg-transparent" 
                  type="button" 
                  id="navbarDropdown" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}
                >
                  {userInitial}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li><Link className="dropdown-item" to="/profile">My Profile</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                </ul>
              </div>
            ) : (
              <Link to='login'><button className="btn btn-outline-secondary rounded-pill me-3 px-4 py-2">Login</button></Link>
            )}
            
            <Link to='/cart' className="position-relative">
              <img src={cart_icon} alt="Cart Icon" width="30" height="30" />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {cartItemsCount}
                <span className="visually-hidden">cart items</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;