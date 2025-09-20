import React, { useState, useEffect } from 'react';
import './ProductDisplay.css';
import star_icon from '../../assets/star_icon.png';
import star_dull_icon from '../../assets/star_dull_icon.png';
import Breadcrums from '../Breadcrums/Breadcrums';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ProductDisplay = ({ product, API_BASE_URL, updateCartCount }) => {
  const [mainImage, setMainImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (product?.all_image_urls?.length > 0) {
      setMainImage(`${API_BASE_URL.replace('/api', '')}${product.all_image_urls[0]}`);
    } else if (product?.image_url) {
      setMainImage(`${API_BASE_URL.replace('/api', '')}${product.image_url}`);
    } else {
      setMainImage('https://placehold.co/600x400/dddddd/333333?text=No+Image');
    }
  }, [product, API_BASE_URL]);

  if (!product) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Product data not available.</div>;
  }

  const oldPrice = parseFloat(product.price);
  const newPrice = product.discount_percentage
    ? oldPrice * (1 - product.discount_percentage / 100)
    : oldPrice;

  const discountAmount = oldPrice - newPrice;
  const sizes = product.size ? product.size.split(',').map((s) => s.trim().toUpperCase()) : [];

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.alert('Please log in to add items to your cart.');
      navigate('/login');
      return;
    }

    if (sizes.length > 0 && !selectedSize) {
      alert('Please select a size.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:5000/api/cart',
        {
          product_id: product.product_id,
          quantity: 1,
          selected_size: selectedSize || 'Free Size',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.alert('Product added to cart!');
      if (updateCartCount) updateCartCount();
    } catch (error) {
      console.error('Error adding to cart:', error);
      window.alert('Failed to add product to cart.');
    }
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.alert('Please log in to proceed.');
      navigate('/login');
      return;
    }

    if (sizes.length > 0 && !selectedSize) {
      alert('Please select a size.');
      return;
    }

    navigate('/checkout', {
      state: { product, selectedSize },
    });
  };

  return (
    <>
      <Breadcrums product={product} />

      <div className="productdisplay">
        <div className="productdisplay-left">
          <div className="productdisplay-img-list">
            {(product.all_image_urls?.length > 0 ? product.all_image_urls : [product.image_url]).map((imgUrl, idx) => {
              const imageSrc = imgUrl ? `${API_BASE_URL.replace('/api', '')}${imgUrl}` : null;
              return imageSrc && (
                <img
                  key={idx}
                  src={imageSrc}
                  alt={`Product ${idx + 1}`}
                  onClick={() => setMainImage(imageSrc)}
                  className={mainImage === imageSrc ? 'active-thumbnail' : ''}
                />
              );
            })}
          </div>

          <div className="productdisplay-img">
            {mainImage && (
              <img className="productdisplay-main-img" src={mainImage} alt={product.name} />
            )}
          </div>
        </div>

        <div className="productdisplay-right">
          <h1>{product.name}</h1>
          <div className="productdisplay-right-stars">
            {[...Array(4)].map((_, i) => (
              <img key={i} src={star_icon} alt="star" />
            ))}
            <img src={star_dull_icon} alt="star" />
            <p>(122)</p>
          </div>

          <div className="productdisplay-right-prices">
            {product.discount_percentage ? (
              <>
                <div className="productdisplayright-price-old">₹{oldPrice.toFixed(2)}</div>
                <div className="productdisplayright-price-new">₹{newPrice.toFixed(2)}</div>
                <div className="productdisplay-right-discount">
                  Save ₹{discountAmount.toFixed(2)} ({product.discount_percentage}%)
                </div>
              </>
            ) : (
              <div className="productdisplayright-price-new">₹{oldPrice.toFixed(2)}</div>
            )}
          </div>

          <div className="productdisplay-right-description">
            <p>{product.description || 'No description available.'}</p>
          </div>

          {sizes.length > 0 && (
            <div className="productdisplay-right-size">
              <h5>Select Size</h5>
              <div className="productdisplay-right-sizes">
                {sizes.map((size, idx) => (
                  <div
                    key={idx}
                    className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="d-flex gap-3 mt-3">
            <button onClick={handleAddToCart} className="btn btn-warning">
              Add to Cart
            </button>
            <button onClick={handleBuyNow} className="btn btn-success">
              Buy Now
            </button>
          </div>

          <p className="productdisplay-right-category mt-3">
            <strong>Category:</strong> {product.gender || 'N/A'}
          </p>
          <p className="productdisplay-right-category">
            <strong>Brand:</strong> {product.brand || 'N/A'}
          </p>
          <p className="productdisplay-right-category">
            <strong>Material:</strong> {product.material || 'N/A'}
          </p>
          <p className="productdisplay-right-category">
            <strong>Color:</strong> {product.color || 'N/A'}
          </p>
          <p className="productdisplay-right-category">
            <strong>Availability:</strong> {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
          </p>
        </div>
      </div>
    </>
  );
};

export default ProductDisplay;
