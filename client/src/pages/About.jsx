import React from 'react';
import { CloudSun, Shield, Code, Database, Sparkles, Cpu, Layers } from 'lucide-react';

const About = () => {
  return (
    <div className="app-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary) 0%, #0284c7 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}
        >
          <CloudSun size={34} />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
          About Weather<span style={{ color: 'var(--primary)' }}>Sphere</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto' }}>
          "Every Forecast. Every Destination. Every Day." — Next-generation global weather intelligence engineered with high-precision forecasting models and intelligent AI assistance.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
        {/* Architecture & Tech Stack */}
        <div className="glass-panel" style={{ padding: '2.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Layers size={22} style={{ color: 'var(--primary)' }} /> Full-Stack Architecture
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Frontend</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                React 18, Vite, React Router DOM, Recharts data visualization, Lucide React icons, and modern glassmorphic CSS.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>Backend</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Node.js & Express RESTful API, Helmet security, JWT HTTP-only auth cookies, bcryptjs password hashing, and rate limiting.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>Database</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                MongoDB with Mongoose ODM schemas for users, saved cities, search history, and TTL cached weather queries.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#a855f7' }}>AI Intelligence</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                WeatherSphere Smart Meteorological Assistant with rainfall risk evaluation, clothing advice, and outdoor activity indexes.
              </p>
            </div>
          </div>
        </div>

        {/* Data Attribution */}
        <div className="glass-panel" style={{ padding: '2.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Database size={22} style={{ color: '#10b981' }} /> Meteorological API Attributions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
            WeatherSphere utilizes the <strong>OpenWeatherMap API</strong> for hyper-local current observations, 5-day / 3-hour forecasts, and air pollution measurements. As an ultra-reliable live fallback engine, <strong>Open-Meteo</strong> supplies real-time global weather grids without fabricated data.
          </p>
        </div>

        {/* Privacy Policy & Terms */}
        <div className="glass-panel" style={{ padding: '2.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Shield size={22} style={{ color: 'var(--accent-warning)' }} /> Privacy & Security Commitment
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
            We respect your privacy. Geolocation access is strictly requested on demand and never logged or tracked without explicit permission. Passwords are cryptographically salted and hashed using bcryptjs, and authentication tokens are secured via industry-standard HTTP-only cookies and bearer headers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
