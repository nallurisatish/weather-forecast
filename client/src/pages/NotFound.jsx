import React from 'react';
import { Link } from 'react-router-dom';
import { CloudOff, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="app-container" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
      <div className="glass-panel" style={{ maxWidth: '520px', margin: '0 auto', padding: '3.5rem 2rem' }}>
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--accent-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}
        >
          <CloudOff size={36} />
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.5rem', color: 'var(--primary)' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Destination Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          The weather coordinates or page you requested could not be located in our atmosphere. Let's get you back to safe ground.
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Home size={18} /> Return to Live Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
