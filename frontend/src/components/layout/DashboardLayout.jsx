import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Footer from './Footer';
import BrandLogo from './BrandLogo';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Mobile topbar */}
        <div className="topbar" style={{ display: 'none', alignItems: 'center', padding: '0 16px' }} id="mobile-topbar">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSidebarOpen(true)}
            style={{ marginRight: 12 }}
          >
            <Menu size={18} />
          </button>
          <BrandLogo size="sm" />
        </div>

        <div style={{ flex: 1 }}>
          <Outlet />
        </div>

        {/* Global Footer */}
        <Footer />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99,
          }}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          #mobile-topbar { display: flex !important; }
          #sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
