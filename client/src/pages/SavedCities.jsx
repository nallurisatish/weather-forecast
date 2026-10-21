import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ArrowUpRight, Plus, MapPin, Loader2, LogIn } from 'lucide-react';
import { citiesAPI, weatherAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SavedCities = () => {
  const { isAuthenticated } = useAuth();
  const { formatTemp } = useTheme();
  const navigate = useNavigate();

  const [savedList, setSavedList] = useState([]);
  const [cityWeatherData, setCityWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [newCityName, setNewCityName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const fetchSavedCities = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await citiesAPI.getSaved();
      if (res.data?.success && res.data?.cities) {
        setSavedList(res.data.cities);

        // Fetch live weather for each saved city
        res.data.cities.forEach(async (c) => {
          try {
            const wRes = await weatherAPI.getCurrent({ city: c.cityName });
            const curr = wRes.data?.data;
            if (curr) {
              setCityWeatherData((prev) => ({ ...prev, [c.cityName]: curr }));
            }
          } catch (e) {
            // ignore individual fail
          }
        });
      }
    } catch (err) {
      setError('Failed to load saved cities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedCities();
  }, [isAuthenticated]);

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCityName.trim()) return;

    setAdding(true);
    setError(null);
    try {
      const res = await citiesAPI.addSaved({ cityName: newCityName.trim() });
      if (res.data?.success) {
        setNewCityName('');
        fetchSavedCities();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add city.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, cityName, e) => {
    e.stopPropagation();
    try {
      await citiesAPI.deleteSaved(id || cityName);
      setSavedList((prev) => prev.filter((c) => c._id !== id && c.cityName !== cityName));
    } catch (err) {
      setError('Could not remove city.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '520px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}
          >
            <Heart size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Save Your Favorite Locations
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Sign in to synchronize your favorite destinations across all your devices, monitor live conditions at a glance, and receive tailored forecasts.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/login" className="btn-primary">
              <LogIn size={16} /> Sign In
            </Link>
            <Link to="/register" className="btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Heart size={28} style={{ color: '#f43f5e' }} fill="#f43f5e" />
            Favorite Cities
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage and track live weather conditions across your saved destinations
          </p>
        </div>

        {/* Quick Add City Form */}
        <form onSubmit={handleAddCity} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input-control"
            placeholder="Add new city..."
            style={{ width: '180px', padding: '0.5rem 0.85rem' }}
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={adding || !newCityName.trim()}>
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-danger)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : savedList.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <MapPin size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Favorite Cities Saved Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            Search for any city on the dashboard and click the heart icon, or use the form above to add your first favorite destination.
          </p>
          <Link to="/" className="btn-primary">Explore Weather Dashboard</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {savedList.map((city) => {
            const live = cityWeatherData[city.cityName];
            const iconUrl = live?.icon?.startsWith('http')
              ? live.icon
              : `https://openweathermap.org/img/wn/${live?.icon || '01d'}@2x.png`;

            return (
              <div
                key={city._id || city.cityName}
                className="glass-panel glass-card-interactive"
                style={{ padding: '1.5rem', position: 'relative' }}
                onClick={() => navigate(`/?city=${encodeURIComponent(city.cityName)}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{city.cityName}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{city.country || live?.country || ''}</div>
                  </div>

                  <button
                    className="btn-icon"
                    style={{ width: '32px', height: '32px', color: 'var(--text-muted)' }}
                    onClick={(e) => handleDelete(city._id, city.cityName, e)}
                    title="Remove from favorites"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {live ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>
                        {formatTemp(live.tempC, live.tempF)}
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {live.condition}
                      </div>
                    </div>
                    <img
                      src={iconUrl}
                      alt={live.condition}
                      style={{ width: '60px', height: '60px' }}
                      onError={(e) => { e.target.src = 'https://openweathermap.org/img/wn/02d@2x.png'; }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={14} className="animate-spin" /> Loading live conditions...
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '1.25rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, alignItems: 'center', gap: '2px' }}>
                  <span>View Full Details</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedCities;
