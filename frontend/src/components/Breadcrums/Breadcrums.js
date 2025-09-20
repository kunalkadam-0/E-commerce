import React from 'react';
import './Breadcrums.css';
import arrow_icon from '../../assets/breadcrum_arrow.png'; // Path to your arrow icon in assets

const Breadcrums = (props) => {
    const { product } = props;

    if (!product) {
        return null;
    }

  return (
    <div className='breadcrum'>
        HOME <img src={arrow_icon} alt="arrow" /> SHOP <img src={arrow_icon} alt="arrow" /> {product.gender || 'N/A'} <img src={arrow_icon} alt="arrow" /> {product.name}
    </div>
  );
};

export default Breadcrums;