// frontend/src/pages/user/ProductPage.js
import React, { useState, useEffect, useContext } from 'react'; // ADDED useContext
import { useParams } from 'react-router-dom';
import ProductDisplay from '../../components/ProductDisplay/ProductDisplay';
import { ShopContext } from '../../Context/ShopContext'; // ADDED THIS IMPORT

const API_BASE_URL = 'http://localhost:5000/api';

function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { updateCartCount } = useContext(ShopContext); // Consume updateCartCount from context

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading product details...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Error: {error}</div>;
  }

  if (!product) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Product not found.</div>;
  }

  return (
    <div className="product-page-container">
      {/* Pass updateCartCount function as a prop to ProductDisplay */}
      <ProductDisplay product={product} API_BASE_URL={API_BASE_URL} updateCartCount={updateCartCount} /> 
    </div>
  );
}

export default ProductPage;