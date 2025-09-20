import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function CardPaymentPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiry, setExpiry] = useState('');

  const product = state?.product;
  const cartItems = state?.cartItems;
  const totalAmount = state?.totalAmount;

  useEffect(() => {
    if (!state) {
      navigate('/checkout'); // fallback safety if accessed directly
    }
  }, [state, navigate]);

  const handlePayment = () => {
    if (!cardNumber || !cvv || !expiry) {
      alert('Please fill all card details.');
      return;
    }

    alert('Payment successful!');

    // After payment — navigate back to checkout with paymentDone=true and carry over all relevant values from localStorage
    navigate('/checkout', {
      state: {
        product,
        cartItems,
        totalAmount,
        paymentDone: true,
      },
    });
  };

  return (
    <div className="container mt-5">
      <h2>Card Payment</h2>

      <div className="mb-3">
        <label>Card Number:</label>
        <input
          type="text"
          className="form-control"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="0000 0000 0000 0000"
        />
      </div>

      <div className="mb-3">
        <label>Expiry Date:</label>
        <input
          type="text"
          className="form-control"
          placeholder="MM/YY"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label>CVV:</label>
        <input
          type="text"
          className="form-control"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
          placeholder="123"
        />
      </div>

      <button className="btn btn-success" onClick={handlePayment}>
        Pay ₹{parseFloat(totalAmount).toFixed(2)}
      </button>

      <button className="btn btn-secondary ms-2" onClick={() => navigate(-1)}>
        Cancel
      </button>
    </div>
  );
}

export default CardPaymentPage;
