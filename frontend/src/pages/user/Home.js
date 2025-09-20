// frontend/src/pages/user/Home.js

import React from 'react';
// Only import HomeSections, as Navbar and Footer are provided by UserLayout
import HomeSections from '../../components/HomeSections/HomeSections'; // Assuming HomeSections is in src/components/HomeSections/

function Home() {
  return (
    <div>
      <HomeSections popularLimit={6} /> {/* <--- NEW USAGE HERE */}
      
      
    </div>
  );
}

export default Home;