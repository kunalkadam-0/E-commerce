import React from 'react';
import { useNavigate } from 'react-router-dom';

function OrderSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: '80vh' }}>
      <div className="text-center">
        {/* ✅ Font Awesome success icon */}
        <i className="fas fa-check-circle text-success mb-4" style={{ fontSize: '5rem' }}></i>

        <h2 className="text-success fw-bold mb-3">Order Confirmed!</h2>
        <p className="lead text-secondary mb-4">
          Thank you for your purchase. You can track your order in the <strong>My Orders</strong> section of your profile.
        </p>

        <div className="d-flex flex-wrap justify-content-center gap-3">
          <button
            className="btn btn-primary px-4 py-2"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-home me-2"></i>Back to Home
          </button>

          <button
            className="btn btn-outline-success px-4 py-2"
            onClick={() => navigate('/profile')}
          >
            <i className="fas fa-box-open me-2"></i>View My Orders
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
