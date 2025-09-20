import React, { useState, useEffect } from 'react';
import './KidsProduct.css'; // Create this CSS file
import Item from '../Item/Item';

const API_BASE_URL = 'http://localhost:5000/api';

const KidsProduct = () => {
  const [kidsProducts, setKidsProducts] = useState([]);

  useEffect(() => {
    const fetchKidsProducts = async () => {
      try {
        // Fetch products with category_id = 3 for Kids
        const response = await fetch(`${API_BASE_URL}/products?category_id=3`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        setKidsProducts(data);
      } catch (error) {
        console.error("Error fetching kids' products:", error);
      }
    };

    fetchKidsProducts();
  }, []);

  return (
    <div className="kids-products-section">
      <h1 className="kids-products-title">KIDS' PRODUCTS</h1>
      <hr className="kids-products-hr" />

      <div className="kids-products-grid">
        {kidsProducts.map((item, i) => (
          <Item
            key={i}
            id={item.product_id}
            name={item.name}
            image={item.image_url ? `${API_BASE_URL.replace('/api', '')}${item.image_url}` : null}
            new_price={
              item.discount_percentage
                ? (item.price * (1 - item.discount_percentage / 100)).toFixed(2)
                : item.price
            }
            old_price={item.price}
          />
        ))}
      </div>
    </div>
  );
};

export default KidsProduct;