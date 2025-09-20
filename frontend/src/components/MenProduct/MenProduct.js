import React, { useState, useEffect } from 'react';
import './MenProduct.css'; // This CSS file will be created next
import Item from '../Item/Item';

const API_BASE_URL = 'http://localhost:5000/api';

const MenProduct = () => {
  const [menProducts, setMenProducts] = useState([]);

  useEffect(() => {
    const fetchMenProducts = async () => {
      try {
        // Fetch products with category_id = 1 for Men
        const response = await fetch(`${API_BASE_URL}/products?category_id=1`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        setMenProducts(data);
      } catch (error) {
        console.error("Error fetching men's products:", error);
      }
    };

    fetchMenProducts();
  }, []);

  return (
    <div className="men-products-section">
      <h1 className="men-products-title">MEN'S PRODUCTS</h1>
      <hr className="men-products-hr" />

      <div className="men-products-grid">
        {menProducts.map((item, i) => (
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

export default MenProduct;