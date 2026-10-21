import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Thermometer, Wind, Save, Check, LogOut, Clock, Trash2, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userAPI, historyAPI } from '../services/api';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const { tempUnit, setSpecificWindUnit, toggleTempUnit, windUnit } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [preferredTemp, setPreferredTemp] = useState(user?.preferredTemperatureUnit || tempUnit);
  const [preferredWind, setPreferredWind] = useState(user?.preferredWindSpeedUnit || windUnit);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.preferredTemperatureUnit) setPreferredTemp(user.preferredTemperatureUnit);
    if (user?.preferredWindSpeedUnit) setPreferredWind(user.preferredWindSpeedUnit);

    // Fetch search history
    const loadHistory = async () => {
      try {
        const res = await historyAPI.getHistory(8);
        if (res.data?.success && res.data?.history) {
          setHistory(res.data.history);
        }
      } catch (err) {
        // Ignore
      }
    };
    loadHistory();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await userAPI.updateProfile({ name });
      const prefRes = await userAPI.updatePreferences({
        preferredTemperatureUnit: preferredTemp,
        preferredWindSpeedUnit: preferredWind
      });

      if (res.data?.success) {
        updateUser({
          name,
          preferredTemperatureUnit: preferredTemp,
          preferredWindSpeedUnit: preferredWind
        });
        setSpecificWindUnit(preferredWind);
        setMessage('Preferences and profile successfully updated!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await historyAPI.clearHistory();
      setHistory([]);
    } catch (err) {
      // Ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="app-container" style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={28} style={{ color: 'var(--primary)' }} />
            User Settings & Profile
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Customize your weather display units, account details, and preferences
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{ color: 'var(--accent-danger)' }}
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>

      {message && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-success)', borderRadius: 'var(--radius-md)', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
          <Check size={18} /> {message}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-danger)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Profile Card */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} style={{ color: 'var(--primary)' }} /> Personal Details
          </h2>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Registered)</label>
              <input
                type="email"
                className="form-input-control"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.65, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temperature Unit</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={`btn-secondary ${preferredTemp === 'celsius' ? 'active' : ''}`}
                  style={{ flex: 1, borderColor: preferredTemp === 'celsius' ? 'var(--primary)' : 'var(--border-subtle)' }}
                  onClick={() => setPreferredTemp('celsius')}
                >
                  Celsius (°C)
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${preferredTemp === 'fahrenheit' ? 'active' : ''}`}
                  style={{ flex: 1, borderColor: preferredTemp === 'fahrenheit' ? 'var(--primary)' : 'var(--border-subtle)' }}
                  onClick={() => setPreferredTemp('fahrenheit')}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Wind Speed Unit</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['km/h', 'mph', 'm/s'].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, borderColor: preferredWind === unit ? 'var(--primary)' : 'var(--border-subtle)', padding: '0.5rem' }}
                    onClick={() => setPreferredWind(unit)}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={saving}
            >
              <Save size={16} /> Save Changes
            </button>
          </form>
        </div>

        {/* Recent Search History Card */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: 'var(--primary)' }} /> Recent Search History
            </h2>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
              No recent searches recorded yet. Search for cities to see them here!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {history.map((h, i) => (
                <div
                  key={`${h.cityName}-${i}`}
                  className="glass-panel"
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/?city=${encodeURIComponent(h.cityName)}`)}
                >
                  <span style={{ fontWeight: 600 }}>{h.cityName}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(h.searchedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
