// frontend/src/components/WomenProduct/WomenProduct.js
import React, { useState, useEffect } from 'react';
import './WomenProduct.css';
import Item from '../Item/Item';

const API_BASE_URL = 'http://localhost:5000/api';

// Accept 'limit' as a prop to control the number of displayed products
const WomenProduct = ({ limit }) => { // <--- Added 'limit' prop here
  const [womenProducts, setWomenProducts] = useState([]);

  useEffect(() => {
    const fetchWomenProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products?category_id=2`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        setWomenProducts(data);
      } catch (error) {
        console.error("Error fetching women's products:", error);
      }
    };

    fetchWomenProducts();
  }, []);

  // --- NEW LOGIC: Determine which products to display based on the 'limit' prop ---
  const productsToDisplay = limit ? womenProducts.slice(0, limit) : womenProducts;

  return (
    <div className="women-products-section">
      <h1 className="women-products-title">WOMEN PRODUCTS</h1>
      <hr className="women-products-hr" />

      <div className="women-products-grid">
        {/* Use productsToDisplay for mapping */}
        {productsToDisplay.map((item, i) => (
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

export default WomenProduct;