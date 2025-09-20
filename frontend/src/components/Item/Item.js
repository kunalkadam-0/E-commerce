// frontend/src/components/Item/Item.js
import React from 'react';
import './Item.css'; // Assuming you have a CSS file for styling individual items
import { Link } from 'react-router-dom'; // Import Link for navigation to product details

const Item = (props) => {
  // Ensure props.old_price and props.new_price are numbers before calculation
  const oldPrice = parseFloat(props.old_price);
  const newPrice = parseFloat(props.new_price);

  // Calculate discount amount only if prices are valid numbers
  const discountAmount = (!isNaN(oldPrice) && !isNaN(newPrice)) ? (oldPrice - newPrice) : 0;

  return (
    <div className='item'>
      {/* Wrap the image in a Link to navigate to the product detail page */}
      <Link to={`/product/${props.id}`}> 
        <img 
          src={props.image} 
          alt={props.name} 
          onClick={() => window.scrollTo(0,0)} // Scrolls to top when image is clicked for better UX
        />
      </Link>
      {/* Add 'Name:' label before the product name */}
      <p className='item-name'><b>Name:</b> {props.name}</p>
      <div className="item-prices">
        <div className="item-price-new">
          {/* Add 'Amount:' label before the new price */}
          <b>Amount:</b> ${!isNaN(newPrice) ? newPrice.toFixed(2) : 'N/A'}
        </div>
        
        {/* Only display Old Price and Discount if there's an actual discount AND prices are valid numbers */}
        {oldPrice > newPrice && !isNaN(oldPrice) && !isNaN(newPrice) && (
          <>
            <div className="item-price-old">
              {/* Add 'Old Price:' label and strike through the value */}
              <b>Old Price:</b> <span style={{ textDecoration: 'line-through' }}>${oldPrice.toFixed(2)}</span>
            </div>
            <div className="item-discount">
              {/* Add 'Discount:' label and display the calculated discount amount */}
              <b>Discount:</b> ${discountAmount.toFixed(2)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Item;