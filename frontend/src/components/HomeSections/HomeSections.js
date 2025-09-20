// frontend/src/components/HomeSections/HomeSections.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomeSections.css';

import hand_icon from '../../assets/hand_icon.png';
import arrow_icon from '../../assets/arrow.png';
import hero_image from '../../assets/hero_image.png';

import Offers from '../Offers/Offers';
import Item from '../Item/Item';
import WomenProduct from '../WomenProduct/WomenProduct';

const API_BASE_URL_FOR_FETCH = 'http://localhost:5000/api';

const HomeSections = ({ popularLimit }) => {
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL_FOR_FETCH}/products/popular`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();

        // ✅ Shuffle the products array
        const shuffled = data.sort(() => 0.5 - Math.random());
        setPopularProducts(shuffled);

      } catch (error) {
        console.error("Error fetching popular products:", error);
      }
    };

    fetchPopularProducts();
  }, []);

  const popularProductsToDisplay = popularLimit
    ? popularProducts.slice(0, popularLimit)
    : popularProducts;

  return (
    <div>
      <div className="hero container d-flex flex-column flex-md-row justify-content-center align-items-center mb-5">
        <div className="hero-left col-md-6 d-flex flex-column justify-content-center px-3">
          <h2>NEW ARRIVALS ONLY</h2>
          <div>
            <div className="hero-hand-icon d-flex align-items-center">
              <p>new</p>
              <img src={hand_icon} alt="Hand icon" style={{ width: '105px' }} />
            </div>
            <p>collections</p>
            <p>for everyone</p>
          </div>
          <Link to="/womens" style={{ textDecoration: 'none' }}>
            <button className="hero-latest-btn d-flex justify-content-center align-items-center gap-2 mt-4">
              <div>Latest Collection</div>
              <img src={arrow_icon} alt="Right arrow" />
            </button>
          </Link>
        </div>

        <div className="hero-right col-md-6 d-none d-md-flex justify-content-center align-items-center">
          <img src={hero_image} alt="Stylish model posing" className="img-fluid hero-image" style={{ height: '700px' }} />
        </div>
      </div>

      <div className="popular">
        <h1 className="text-dark popular-title">POPULAR PRODUCTS</h1>
        <hr className="popular-hr" />
        <div className="popular-item">
          {popularProductsToDisplay.map((item, i) => (
            <Item
              key={i}
              id={item.id}
              name={item.name}
              image={item.image ? `${API_BASE_URL_FOR_FETCH.replace('/api', '')}${item.image}` : null}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))}
        </div>
      </div>

      <Offers />

      <WomenProduct limit={6} />
    </div>
  );
};

export default HomeSections;
