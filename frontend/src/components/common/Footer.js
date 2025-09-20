// frontend/src/components/common/Footer.js
import React from 'react'
import './Footer.css' // For specific overrides not covered by Bootstrap
// Corrected asset paths: Using 'assets' (lowercase 'a')
import footer_logo from '../../assets/logo_big.png' 
import instagram_icon from '../../assets/instagram_icon.png'
import pintester_icon from '../../assets/pintester_icon.png'
import whatsapp_icon from '../../assets/whatsapp_icon.png'

const Footer = () => {
  return (
    // Using Bootstrap's container-fluid, padding, background, text alignment,
    // and flex utilities for overall footer layout.
    <footer className='container-fluid py-5 bg-light text-center d-flex flex-column align-items-center justify-content-center'>
        
        {/* Footer Logo Section */}
        <div className="d-flex align-items-center mb-4"> {/* Bootstrap flex for alignment and margin-bottom */}
            <img src={footer_logo} alt="E-commerce Logo" width="60" height="60" className="me-3" /> {/* Bootstrap margin-end */}
            <p className="mb-0 fs-1 fw-bold text-dark">E-Commerce</p> {/* Bootstrap font size, weight, and color */}
        </div>

        {/* Footer Links Section */}
        <ul className="list-unstyled d-flex flex-wrap justify-content-center gap-5 mb-4"> {/* Bootstrap list-unstyled, flex-wrap, justify-content, gap, margin-bottom */}
            <li>Company</li>
            <li>Products</li>
            <li>Offices</li>
            <li>About</li>
            <li>Contacts</li>
        </ul>

        {/* Footer Social Icons Section */}
        <div className="d-flex gap-3 mb-4"> {/* Bootstrap flex and gap for spacing */}
            <div className="p-2 border border-secondary rounded-circle d-flex justify-content-center align-items-center"> {/* Bootstrap padding, border, rounded, flex for centering icon */}
                <img src={instagram_icon} alt="Instagram Icon" width="24" height="24" /> {/* Set specific width/height */}
            </div>
            <div className="p-2 border border-secondary rounded-circle d-flex justify-content-center align-items-center">
                <img src={pintester_icon} alt="Pinterest Icon" width="24" height="24" />
            </div>
            <div className="p-2 border border-secondary rounded-circle d-flex justify-content-center align-items-center">
                <img src={whatsapp_icon} alt="WhatsApp Icon" width="24" height="24" />
            </div>
        </div>

        {/* Footer Copyright Section */}
        <div className="text-center w-100 mt-4 pt-4 border-top border-secondary"> {/* Bootstrap text-center, width, margin-top, padding-top, border-top */}
            <p className="mb-0 text-muted fs-6">Copyright &copy; 2025 - All Rights Reserved.</p> {/* Bootstrap text color, font size */}
        </div>
    </footer>
  )
}

export default Footer