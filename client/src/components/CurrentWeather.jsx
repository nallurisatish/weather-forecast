import React, { useState } from 'react';
import {
  MapPin,
  RefreshCw,
  Heart,
  Droplets,
  Wind,
  Gauge,
  Eye,
  Sunrise,
  Sunset,
  Sun,
  ShieldCheck,
  Check,
  Globe
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { citiesAPI } from '../services/api';

const CurrentWeather = ({ weather, onRefresh, isRefreshing, savedCities, onCitySavedChange }) => {
  const { formatTemp, formatWind } = useTheme();
  const { isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  if (!weather?.current) return null;

  const { current } = weather;
  const isSaved = savedCities?.some(
    (c) => c.cityName?.toLowerCase() === current.city?.toLowerCase()
  );

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('Please sign in or create an account to save cities to your favorites!');
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        const savedItem = savedCities.find(
          (c) => c.cityName?.toLowerCase() === current.city?.toLowerCase()
        );
        const idToDelete = savedItem?._id || current.city;
        await citiesAPI.deleteSaved(idToDelete);
        setSaveSuccessMsg('Removed from favorites');
      } else {
        await citiesAPI.addSaved({
          cityName: current.city,
          country: current.country,
          latitude: current.coordinates?.lat,
          longitude: current.coordinates?.lon
        });
        setSaveSuccessMsg('Added to favorites!');
      }
      if (onCitySavedChange) onCitySavedChange();
      setTimeout(() => setSaveSuccessMsg(''), 2500);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setSaving(false);
    }
  };

  // Weather icon mapping
  const iconUrl = current.icon?.startsWith('http')
    ? current.icon
    : `https://openweathermap.org/img/wn/${current.icon || '01d'}@4x.png`;

  return (
    <div className="glass-panel current-weather-hero">
      <div className="hero-glow-orb"></div>

      {/* Header Row: Location, Time & Controls */}
      <div className="weather-header">
        <div>
          <h1 className="location-title">
            <MapPin size={28} style={{ color: 'var(--primary)' }} />
            <span>
              {current.city}
              {current.country ? `, ${current.country}` : ''}
            </span>
          </h1>
          <div className="location-meta">
            <span>{current.localTime}</span>
            <span>•</span>
            <span style={{ color: 'var(--text-muted)' }}>Source: {current.dataSource}</span>
          </div>
        </div>

        {/* Action Buttons: Favorite & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {saveSuccessMsg && (
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={14} /> {saveSuccessMsg}
            </span>
          )}

          {current.coordinates && (
            <a
              href={`https://zoom.earth/maps/precipitation/#view=${current.coordinates.lat},${current.coordinates.lon},8z`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                textDecoration: 'none',
                color: '#38bdf8',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                background: 'rgba(56, 189, 248, 0.1)',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)'
              }}
              title="Open Zoom Earth to check real-time satellite rain radar for this city"
            >
              <Globe size={14} />
              <span>Zoom Earth Rain ↗</span>
            </a>
          )}

          <button
            className={`btn-icon ${isSaved ? 'active' : ''}`}
            onClick={handleToggleFavorite}
            disabled={saving}
            title={isSaved ? 'Remove from saved cities' : 'Save city to favorites'}
            style={{ color: isSaved ? '#f43f5e' : 'inherit' }}
          >
            <Heart size={18} fill={isSaved ? '#f43f5e' : 'none'} />
          </button>

          <button
            className="btn-icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh weather data"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Temperature & Weather Hero Visual */}
      <div className="weather-main-row">
        <div>
          <div className="temp-huge">
            {formatTemp(current.tempC, current.tempF)}
          </div>
          <div className="weather-condition-desc">
            {current.description || current.condition}
          </div>
          <div className="weather-sub-metrics">
            <span>Feels like: <strong>{formatTemp(current.feelsLikeC, current.feelsLikeF)}</strong></span>
            <span>•</span>
            <span>H: <strong>{formatTemp(current.maxTempC, current.maxTempF)}</strong></span>
            <span>L: <strong>{formatTemp(current.minTempC, current.minTempF)}</strong></span>
          </div>
        </div>

        <div>
          <img
            src={iconUrl}
            alt={current.condition}
            className="weather-icon-hero"
            onError={(e) => {
              // fallback if openweathermap asset fails
              e.target.src = 'https://openweathermap.org/img/wn/02d@4x.png';
            }}
          />
        </div>
      </div>

      {/* Quick Metrics Ribbon */}
      <div className="metrics-grid-ribbon">
        <div className="metric-chip">
          <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Droplets size={13} style={{ color: 'var(--accent-rain)' }} /> Humidity
          </span>
          <span className="metric-val">{current.humidity}%</span>
        </div>

        <div className="metric-chip">
          <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wind size={13} style={{ color: 'var(--primary)' }} /> Wind
          </span>
          <span className="metric-val">
            {formatWind(current.windSpeedKmh, current.windSpeedMph, current.windSpeedMs)}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Dir: {current.windDirection || 'N'} ({current.windDeg || 0}°)
          </span>
        </div>

        <div className="metric-chip">
          <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Gauge size={13} style={{ color: 'var(--secondary)' }} /> Pressure
          </span>
          <span className="metric-val">{current.pressure} hPa</span>
        </div>

        <div className="metric-chip">
          <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={13} style={{ color: 'var(--accent-warning)' }} /> Visibility
          </span>
          <span className="metric-val">{current.visibilityKm} km</span>
        </div>

        <div className="metric-chip">
          <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sun size={13} style={{ color: 'var(--accent-sun)' }} /> UV Index
          </span>
          <span className="metric-val">{current.uvIndex ?? 'N/A'}</span>
          <span style={{ fontSize: '0.78rem', color: current.uvIndex > 5 ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
            {current.uvIndex > 7 ? 'Very High' : current.uvIndex > 5 ? 'High' : current.uvIndex > 2 ? 'Moderate' : 'Low'}
          </span>
        </div>

        <div className="metric-chip">
          <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sunrise size={13} style={{ color: 'var(--accent-sun)' }} /> Sun Cycle
          </span>
          <span className="metric-val" style={{ fontSize: '1rem', marginTop: '2px' }}>
            🌅 {current.sunrise}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            🌇 {current.sunset}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeather;
