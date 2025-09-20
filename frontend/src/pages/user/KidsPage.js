// frontend/src/pages/user/KidsPage.js
import React from 'react';
import KidsProduct from '../../components/KidsProduct/KidsProduct';
import kid_banner from '../../assets/banner_kids.png'; // Corrected import path

function KidsPage() {
  return (
    <div>
      {/* Display the kids' banner above the products */}
      <img src={kid_banner} alt="Kids' Banner" style={{ width: '100%', marginBottom: '30px', marginTop:'10px' }} />
      {/* The KidsProduct component will fetch and display kids' products */}
      <KidsProduct />
    </div>
  );
}

export default KidsPage;