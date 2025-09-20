// frontend/src/pages/user/WomenPage.js
import React from 'react';
import WomenProduct from '../../components/WomenProduct/WomenProduct';
import women_banner from '../../assets/banner_women.png'; 

function WomenPage() {
  return (
    <div>
      <img src={women_banner} alt="women Banner" style={{ width: '100%', marginBottom: '30px', marginTop:'10px' }} />
      {/* This will display ALL women's products */}
      <WomenProduct />
    </div>
  );
}

export default WomenPage;