import React, { useState } from 'react';

interface NavigationProps {
  currentPage: 'client' | 'chat';
  onNavigate: (page: 'client' | 'chat') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const [activeItem, setActiveItem] = useState('Contact Us');

  const handleItemClick = (itemName: string) => {
    setActiveItem(itemName);
  };

  const [openMenu, setOpenMenu] = React.useState<null | 'company' | 'services' | 'industries'>(null);

  const handleOpen = (menu: 'company' | 'services' | 'industries') => setOpenMenu(menu);
  const handleClose = () => setOpenMenu(null);

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="logo-section">
          <img
            src="https://hutechsolutions.com/wp-content/uploads/2024/08/hutech-logo-1.svg"
            alt="Hutech Solutions"
            className="hutech-logo"
            onError={(e) => { const t = e.currentTarget; t.onerror = null; t.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><rect width="120" height="40" fill="%23f3f4f6"/><text x="10" y="26" font-size="14" fill="%236b7280">Hutech</text></svg>'; }}
          />
        </div>
        <nav className="navigation-menu">
          <button
            className={`nav-item ${activeItem === 'Home' ? 'active' : ''}`}
            onClick={() => handleItemClick('Home')}
          >
            Home
          </button>

          <div className="nav-item-wrapper" onMouseLeave={handleClose}>
            <button
              className={`nav-item ${activeItem === 'Company' ? 'active' : ''}`}
              onMouseEnter={() => handleOpen('company')}
              onFocus={() => handleOpen('company')}
              onClick={() => handleItemClick('Company')}
              aria-haspopup="true"
              aria-expanded={openMenu === 'company'}
            >
              Company
            </button>
            {openMenu === 'company' && (
              <div className="mega-menu">
                <div className="mega-col">
                  <button type="button" className="mega-link">About</button>
                  <button type="button" className="mega-link">Vision, Mission & Values</button>
                  <button type="button" className="mega-link">Life at Hutech</button>
                  <button type="button" className="mega-link">Partnership</button>
                </div>
                <div className="mega-col">
                  <button type="button" className="mega-link">In The News</button>
                  <button type="button" className="mega-link">Award and Recognition</button>
                  <button type="button" className="mega-link">Press Release</button>
                </div>
                <div className="mega-aside">
                  <div className="mega-title">Your Trusted <span>Software Partner.</span></div>
                  <button className="mega-cta" onClick={() => {}}>Discover More</button>
                </div>
              </div>
            )}
          </div>

          <div className="nav-item-wrapper" onMouseLeave={handleClose}>
            <button
              className={`nav-item ${activeItem === 'Services' ? 'active' : ''}`}
              onMouseEnter={() => handleOpen('services')}
              onFocus={() => handleOpen('services')}
              onClick={() => handleItemClick('Services')}
              aria-haspopup="true"
              aria-expanded={openMenu === 'services'}
            >
              Services
            </button>
            {openMenu === 'services' && (
              <div className="mega-menu">
                <div className="mega-col">
                  <button type="button" className="mega-link">AI/ML</button>
                  <button type="button" className="mega-link">Banking & Financial Services</button>
                  <button type="button" className="mega-link">Fintech Application Development</button>
                  <button type="button" className="mega-link">Ecommerce Development</button>
                </div>
                <div className="mega-col">
                  <button type="button" className="mega-link">SRE & DevOps Services</button>
                  <button type="button" className="mega-link">Cloud Transformation</button>
                  <button type="button" className="mega-link">Blockchain Development</button>
                  <button type="button" className="mega-link">ERP Implementation</button>
                </div>
                <div className="mega-col">
                  <button type="button" className="mega-link">Salesforce</button>
                  <button type="button" className="mega-link">Courier Management Software</button>
                  <button type="button" className="mega-link">Port Logistic Solutions</button>
                  <button type="button" className="mega-link">IoT (Internet of Things)</button>
                </div>
              </div>
            )}
          </div>

          <div className="nav-item-wrapper" onMouseLeave={handleClose}>
            <button
              className={`nav-item ${activeItem === 'Industries' ? 'active' : ''}`}
              onMouseEnter={() => handleOpen('industries')}
              onFocus={() => handleOpen('industries')}
              onClick={() => handleItemClick('Industries')}
              aria-haspopup="true"
              aria-expanded={openMenu === 'industries'}
            >
              Industries
            </button>
            {openMenu === 'industries' && (
              <div className="mega-menu">
                <div className="mega-col">
                  <button type="button" className="mega-link">Healthcare</button>
                  <button type="button" className="mega-link">Integrated Logistic Solutions</button>
                </div>
                <div className="mega-col">
                  <button type="button" className="mega-link">Utilities and Energy</button>
                  <button type="button" className="mega-link">Logistics & Supply Chain</button>
                </div>
                <div className="mega-aside">
                  <div className="mega-title">Meet Your <span>Industry Standard.</span></div>
                  <button className="mega-cta" onClick={() => {}}>Book a Consultation</button>
                </div>
              </div>
            )}
          </div>

          <button
            className={`nav-item ${activeItem === 'Blogs' ? 'active' : ''}`}
            onClick={() => handleItemClick('Blogs')}
          >
            Blogs
          </button>
          <button
            className={`nav-item ${activeItem === 'Careers' ? 'active' : ''}`}
            onClick={() => handleItemClick('Careers')}
          >
            Careers
          </button>
          <button
            className={`nav-item ${activeItem === 'Case Studies' ? 'active' : ''}`}
            onClick={() => handleItemClick('Case Studies')}
          >
            Case Studies
          </button>
          <button
            className={`nav-item ${activeItem === 'Contact Us' ? 'active' : ''}`}
            onClick={() => handleItemClick('Contact Us')}
          >
            Contact Us
          </button>
          <button
            className={`nav-item chat-button ${currentPage === 'chat' ? 'chat-active' : ''}`}
            onClick={() => onNavigate('client')}
          >
            Chat
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
