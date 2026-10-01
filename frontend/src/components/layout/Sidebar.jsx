import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Clock,
  Settings,
  Zap,
  X,
  User,
  LogOut,
  Sparkles,
  Check,
  Edit2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from './BrandLogo';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: PlusCircle, label: 'New Analysis', path: '/analyze' },
  { icon: FolderOpen, label: 'Projects', path: '/projects' },
  { icon: Clock, label: 'History', path: '/history' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateProfile, loginUser, logoutToNewGuest } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(user.name || '');
  const [editEmail, setEditEmail] = useState(user.email || '');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (editEmail) {
      loginUser(editEmail, editName);
    } else {
      updateProfile({ name: editName });
    }
    setShowProfileModal(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99,
          }}
          id="sidebar-overlay"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <BrandLogo onClick={() => navigate('/')} />

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ position: 'absolute', top: 16, right: 12, display: isOpen ? 'block' : 'none' }}
            id="sidebar-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Workspace badge */}
        <div style={{ padding: '10px 12px 6px' }}>
          <div
            onClick={() => {
              setEditName(user.name || '');
              setEditEmail(user.email || '');
              setShowProfileModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Manage Workspace & Profile"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: user.isGuest ? 'rgba(124, 58, 237, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${user.isGuest ? 'var(--accent-light)' : 'var(--cyan)'}`,
                flexShrink: 0
              }}>
                <User size={12} color={user.isGuest ? 'var(--accent-light)' : 'var(--cyan)'} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {user.isGuest ? 'Private Guest Session' : 'Saved Account'}
                </div>
              </div>
            </div>
            <Edit2 size={12} color="var(--text-muted)" />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '8px 10px', flex: 1 }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 6px 8px' }}>
            Menu
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/analyze' && location.pathname.startsWith('/analyze')) ||
              (item.path === '/history' && location.pathname.startsWith('/history'));
            return (
              <motion.div key={item.path} whileTap={{ scale: 0.98 }}>
                <Link
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                  style={{ marginBottom: 2 }}
                >
                  <item.icon size={16} />
                  {item.label}
                  {item.label === 'New Analysis' && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'var(--accent-primary)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 600,
                    }}>
                      New
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom AI Status */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-subtle)',
          margin: '0 4px 8px',
        }}>
          <div style={{
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-light)', fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={12} /> Live Engine Active
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Vision heuristics & WCAG audit ready
            </div>
          </div>
        </div>
      </aside>

      {/* User Profile / Account Switcher Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                maxWidth: 420,
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                padding: 24,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Workspace Profile</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowProfileModal(false)}>
                  <X size={16} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                Your analyses, projects, and redesign history are securely tied to your unique user workspace.
              </p>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Your Name / Workspace Title
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Email (Optional - To sync account across devices)
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="alex@company.com"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary btn-md" style={{ flex: 1, justifyContent: 'center' }}>
                    <Check size={14} /> Save Profile
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-md"
                    onClick={() => {
                      if (confirm('Start a fresh guest workspace? Past sessions can be switched by email.')) {
                        logoutToNewGuest();
                        setShowProfileModal(false);
                        window.location.reload();
                      }
                    }}
                    title="Start fresh guest session"
                  >
                    <LogOut size={14} /> Reset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
