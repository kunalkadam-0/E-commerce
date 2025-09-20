import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState(localStorage.getItem('shippingAddress') || '');
  const [billingAddress, setBillingAddress] = useState(localStorage.getItem('billingAddress') || '');
  const [paymentMethod, setPaymentMethod] = useState(localStorage.getItem('paymentMethod') || 'cash');
  const [selectedSize, setSelectedSize] = useState(localStorage.getItem('selectedSize') || '');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { state } = useLocation();
  const product = state?.product;
  const paymentDone = state?.paymentDone || false;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (product) {
      setLoading(false);
    } else {
      const fetchCartItems = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/cart', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCartItems(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching cart:', error);
          setLoading(false);
        }
      };
      fetchCartItems();
    }
  }, [navigate, token, product]);

  const calculateTotalAmount = () => {
    if (product) return parseFloat(product.price).toFixed(2);
    return cartItems.reduce((total, item) => total + item.quantity * parseFloat(item.price_at_add), 0).toFixed(2);
  };

  const handleProceed = () => {
    if (!shippingAddress || !billingAddress) return alert('Please fill both addresses.');
    if (product && !selectedSize) return alert('Please select a size.');

    // persist values in localStorage
    localStorage.setItem('shippingAddress', shippingAddress);
    localStorage.setItem('billingAddress', billingAddress);
    localStorage.setItem('paymentMethod', paymentMethod);
    if (product) localStorage.setItem('selectedSize', selectedSize);

    if (paymentMethod === 'card' && !paymentDone) {
      navigate('/payment/card', {
        state: {
          product,
          cartItems,
          totalAmount: calculateTotalAmount(),
        },
      });
      return;
    }

    const orderItems = product
      ? [{
          product_id: product.product_id,
          quantity: 1,
          price_at_order: product.price,
          selected_size: selectedSize,
        }]
      : cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_order: item.price_at_add,
          selected_size: item.selected_size,
        }));

    axios.post('http://localhost:5000/api/orders', {
      total_amount: calculateTotalAmount(),
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      payment_method: paymentMethod,
      order_items: orderItems,
      order_from_cart: !product,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      localStorage.removeItem('shippingAddress');
      localStorage.removeItem('billingAddress');
      localStorage.removeItem('paymentMethod');
      localStorage.removeItem('selectedSize');
      alert('Order placed successfully!');
      navigate('/order-success');
    }).catch(err => {
      console.error(err);
      alert('Failed to place order.');
    });
  };

  if (loading) return <div className="container mt-5">Loading checkout...</div>;

  return (
    <div className="container mt-5">
      <h2>Checkout</h2>

      <h4 className="mt-4">Order Summary:</h4>

      {product ? (
        <div className="d-flex align-items-center mb-3">
          <img
            src={product.image_url ? `http://localhost:5000${product.image_url.replace(/\\/g, '/')}` : 'https://placehold.co/50x50'}
            alt={product.name}
            style={{ width: '60px', height: '60px', marginRight: '10px' }}
          />
          <div>
            <strong>{product.name}</strong> — ₹{product.price}
            <div className="mt-1">
              <label>Select Size: </label>
              <select
                className="form-select form-select-sm"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="">Select</option>
                {product.size && product.size.split(',').map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        cartItems.map(item => (
          <div key={item.cart_item_id} className="d-flex align-items-center mb-2">
            <img
              src={item.image_url ? `http://localhost:5000${item.image_url.replace(/\\/g, '/')}` : 'https://placehold.co/50x50'}
              alt={item.product_name}
              style={{ width: '60px', height: '60px', marginRight: '10px' }}
            />
            <div>
              <strong>{item.product_name}</strong> × {item.quantity}
              <div>Size: {item.selected_size}</div>
              <div className="text-muted">₹{(item.quantity * item.price_at_add).toFixed(2)}</div>
            </div>
          </div>
        ))
      )}

      <h5 className="mt-3">Total: ₹{calculateTotalAmount()}</h5>

      <div className="mt-4">
        <label>Shipping Address:</label>
        <textarea className="form-control mb-3" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />

        <label>Billing Address:</label>
        <textarea className="form-control mb-3" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />

        <label><strong>Payment Method:</strong></label>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            value="cash"
            checked={paymentMethod === 'cash'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            id="cashOption"
            disabled={paymentDone}
          />
          <label className="form-check-label" htmlFor="cashOption">Cash on Delivery</label>
        </div>
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="radio"
            value="card"
            checked={paymentMethod === 'card'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            id="cardOption"
            disabled={paymentDone}
          />
          <label className="form-check-label" htmlFor="cardOption">Card Payment</label>
        </div>

        <button className="btn btn-success" onClick={handleProceed}>
          {paymentMethod === 'card' && !paymentDone ? 'Proceed to Card Payment' : 'Confirm Order'}
        </button>
        <button className="btn btn-secondary ms-2" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  );
}

export default CheckoutPage;
