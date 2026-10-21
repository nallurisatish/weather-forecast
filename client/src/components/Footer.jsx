import React from 'react';
import { Link } from 'react-router-dom';
import { CloudSun, Heart, ExternalLink, Shield, FileText, Mail, Code } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="app-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col">
            <div className="brand-logo" style={{ marginBottom: '0.85rem' }}>
              <div className="brand-icon-wrapper" style={{ width: '34px', height: '34px' }}>
                <CloudSun size={18} />
              </div>
              <span style={{ fontSize: '1.2rem' }}>
                Weather<span style={{ color: 'var(--primary)' }}>Sphere</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '340px' }}>
              "Every Forecast. Every Destination. Every Day."
              An advanced AI-powered weather forecasting intelligence platform built on the modern MERN stack.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <a
                href="https://openweathermap.org/"
                target="_blank"
                rel="noreferrer"
                className="btn-icon"
                title="OpenWeather API Documentation"
              >
                <ExternalLink size={16} />
              </a>
              <a
                href="mailto:support@weathersphere.io"
                className="btn-icon"
                title="Contact WeatherSphere Support"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="footer-col">
            <h4>Quick Navigation</h4>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link">Live Dashboard</Link></li>
              <li><Link to="/forecast" className="footer-link">Extended Forecast</Link></li>
              <li><Link to="/saved" className="footer-link">Saved Favorites</Link></li>
              <li><Link to="/map" className="footer-link">Interactive Radar</Link></li>
              <li><Link to="/compare" className="footer-link">City Comparison</Link></li>
            </ul>
          </div>

          {/* Legal & Data */}
          <div className="footer-col">
            <h4>Attribution & Legal</h4>
            <ul className="footer-links">
              <li>
                <a href="https://openweathermap.org/" target="_blank" rel="noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  OpenWeatherMap API <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Open-Meteo Engine <ExternalLink size={12} />
                </a>
              </li>
              <li><Link to="/about" className="footer-link">Privacy Policy</Link></li>
              <li><Link to="/about" className="footer-link">Terms and Conditions</Link></li>
            </ul>
          </div>

          {/* Technologies */}
          <div className="footer-col">
            <h4>Technology Stack</h4>
            <ul className="footer-links">
              <li style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>• React 18 + Vite</li>
              <li style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>• Node.js & Express REST API</li>
              <li style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>• MongoDB & Mongoose ODM</li>
              <li style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>• JWT & bcryptjs Security</li>
              <li style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>• Recharts & Lucide Icons</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} WeatherSphere. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Live Global Forecast Intelligence</span>
            <span>•</span>
            <span style={{ color: 'var(--accent-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-success)', display: 'inline-block' }}></span>
              API Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
