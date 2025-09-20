// frontend/src/pages/user/MenPage.js
import React from 'react';
import MenProduct from '../../components/MenProduct/MenProduct';
import men_banner from '../../assets/banner_mens.png'; // Corrected import path

function MenPage() {
  return (
    <div>
      {/* Display the men's banner above the products */}
      <img src={men_banner} alt="Men's Banner" style={{ width: '100%', marginBottom: '30px', marginTop:'10px' }} />
      {/* The MenProduct component will fetch and display men's products */}
      <MenProduct />
    </div>
  );
}

export default MenPage;