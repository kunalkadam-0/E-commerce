// frontend/src/components/layout/UserLayout.js
import React from 'react';
import Navbar from '../common/Navbar'; // Adjust path if necessary
import Footer from '../common/Footer'; // Adjust path if necessary

// UserLayout component receives children (the page content)
// and userRole, setUserRole from App.js
const UserLayout = ({ children, userRole, setUserRole }) => {
    return (
        <div className="user-layout">
            {/* Pass userRole and setUserRole to Navbar */}
            <Navbar userRole={userRole} setUserRole={setUserRole} />
            <main className="main-content">
                {children} {/* This renders the actual page content */}
            </main>
            <Footer />
        </div>
    );
};

export default UserLayout;