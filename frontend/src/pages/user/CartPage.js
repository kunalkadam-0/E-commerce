import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        if (!token) {
          setCartItems([]);
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:5000/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(response.data)) {
          const processedItems = response.data.map((item) => ({
            ...item,
            price_at_add: parseFloat(item.price_at_add),
          }));
          setCartItems(processedItems);
        } else {
          setError('Unexpected data format for cart items.');
        }
      } catch (err) {
        console.error('Error fetching cart items:', err);
        setError('Failed to fetch cart items.');
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [navigate, token]);

  const calculateCartTotal = () =>
    cartItems.reduce((total, item) => total + item.quantity * item.price_at_add, 0).toFixed(2);

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    try {
      await axios.put(
        `http://localhost:5000/api/cart/${cartItemId}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (err) {
      console.error('Error updating quantity:', err);
      window.alert('Failed to update cart item.');
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    if (!window.confirm('Remove this item?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/cart/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.reload();
    } catch (err) {
      console.error('Error removing item:', err);
      window.alert('Failed to remove item.');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Clear entire cart?')) return;
    try {
      await axios.delete('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.reload();
    } catch (err) {
      console.error('Error clearing cart:', err);
      window.alert('Failed to clear cart.');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <h2>Your Shopping Cart</h2>
        <p>Loading items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <h2>Your Shopping Cart</h2>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Your Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <div>
          <p>Your cart is empty.</p>
          <Link to="/" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Size</th>
                  <th>Subtotal</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.cart_item_id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <img
                          src={
                            item.image_url
                              ? `http://localhost:5000${item.image_url.replace(/\\/g, '/')}`
                              : 'https://placehold.co/50x50/cccccc/333333?text=No+Image'
                          }
                          alt={item.product_name}
                          className="img-thumbnail me-3"
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                        <Link
                          to={`/product/${item.product_id}`}
                          className="text-decoration-none text-dark fw-bold"
                        >
                          {item.product_name}
                        </Link>
                      </div>
                    </td>
                    <td>₹{item.price_at_add.toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateQuantity(item.cart_item_id, parseInt(e.target.value))
                        }
                        className="form-control form-control-sm"
                        style={{ maxWidth: '70px' }}
                      />
                    </td>
                    <td>{item.selected_size || 'Free Size'}</td>
                    <td>₹{(item.quantity * item.price_at_add).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveItem(item.cart_item_id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end align-items-center mt-4">
            <h4 className="me-3">Total: ₹{calculateCartTotal()}</h4>
            <button className="btn btn-warning me-2" onClick={handleClearCart}>
              Clear Cart
            </button>
            <button className="btn btn-success" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
