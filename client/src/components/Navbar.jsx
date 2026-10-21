import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  CloudSun,
  Sun,
  Moon,
  Search,
  MapPin,
  Heart,
  BarChart2,
  Map,
  Sparkles,
  User,
  LogOut,
  Menu,
  X,
  Scale
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onOpenAssistant }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleMode, tempUnit, toggleTempUnit } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="app-container">
        <div className="nav-wrapper">
          {/* Brand Logo */}
          <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-icon-wrapper">
              <CloudSun size={24} />
            </div>
            <span>
              Weather<span style={{ color: 'var(--primary)' }}>Sphere</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav>
            <ul className="nav-links">
              <li>
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/forecast" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <BarChart2 size={16} /> Forecast
                </NavLink>
              </li>
              <li>
                <NavLink to="/saved" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Heart size={16} /> Saved Cities
                </NavLink>
              </li>
              <li>
                <NavLink to="/map" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Map size={16} /> Radar Maps
                </NavLink>
              </li>
              <li>
                <NavLink to="/compare" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Scale size={16} /> Compare
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  About
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Right Action Controls */}
          <div className="nav-actions">
            {/* AI Assistant Quick Trigger */}
            <button
              className="btn-icon"
              onClick={onOpenAssistant}
              title="Open AI Weather Assistant"
              style={{ color: '#a855f7' }}
            >
              <Sparkles size={18} />
            </button>

            {/* Celsius / Fahrenheit Toggle Switch */}
            <div
              className="badge-unit-toggle"
              onClick={toggleTempUnit}
              title={`Switch to ${tempUnit === 'celsius' ? 'Fahrenheit' : 'Celsius'}`}
            >
              <span className={`unit-chip ${tempUnit === 'celsius' ? 'active' : ''}`}>°C</span>
              <span className={`unit-chip ${tempUnit === 'fahrenheit' ? 'active' : ''}`}>°F</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              className="btn-icon"
              onClick={toggleMode}
              title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {mode === 'dark' ? <Sun size={18} style={{ color: '#fbbf24' }} /> : <Moon size={18} style={{ color: '#6366f1' }} />}
            </button>

            {/* User Profile / Auth State */}
            {isAuthenticated ? (
              <div style={{ position: 'relative' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-full)' }}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <User size={16} />
                  <span>{user?.name?.split(' ')[0] || 'Account'}</span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 10px)',
                      width: '210px',
                      padding: '0.5rem',
                      zIndex: 1001,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}
                  >
                    <div style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                    <Link
                      to="/profile"
                      className="nav-link"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User size={16} /> Profile & Settings
                    </Link>
                    <Link
                      to="/saved"
                      className="nav-link"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Heart size={16} /> Favorite Cities
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="nav-link"
                      style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--accent-danger)' }}
                    >
                      <LogOut size={16} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}>
                Sign In
              </Link>
            )}

            {/* Mobile Menu Hamburger Toggle */}
            <button
              className="btn-icon mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: 'none' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div
            className="glass-panel"
            style={{
              padding: '1rem',
              marginTop: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <NavLink to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/forecast" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              <BarChart2 size={16} /> Forecast
            </NavLink>
            <NavLink to="/saved" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Heart size={16} /> Saved Cities
            </NavLink>
            <NavLink to="/map" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Map size={16} /> Radar Maps
            </NavLink>
            <NavLink to="/compare" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Scale size={16} /> Compare
            </NavLink>
            <NavLink to="/about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              About
            </NavLink>
            {!isAuthenticated && (
              <Link to="/login" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Sign In / Register
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
