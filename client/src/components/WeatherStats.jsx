import React from 'react';
import {
  Droplets,
  Wind,
  Gauge,
  Eye,
  Sun,
  Cloud,
  Compass,
  Activity,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const WeatherStats = ({ current }) => {
  const { formatWind } = useTheme();

  if (!current) return null;

  // Compute dew point approximation: T - ((100 - RH)/5)
  const dewPoint = current.tempC !== undefined && current.humidity !== undefined
    ? Math.round(current.tempC - (100 - current.humidity) / 5)
    : null;

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div className="section-header">
        <h2 className="section-title">
          <Activity size={20} style={{ color: 'var(--primary)' }} />
          Detailed Atmospheric Conditions
        </h2>
      </div>

      <div className="stats-grid">
        {/* Humidity Card */}
        <div className="glass-panel stat-card">
          <div className="stat-card-header">
            <span>HUMIDITY</span>
            <Droplets size={18} style={{ color: 'var(--accent-rain)' }} />
          </div>
          <div>
            <div className="stat-card-val">{current.humidity}%</div>
            <div className="stat-card-meta">
              {dewPoint !== null ? `Dew point is around ${dewPoint}°C` : 'Optimal comfort levels'}
            </div>
          </div>
          <div style={{ marginTop: '0.85rem' }}>
            <div className="temp-bar-bg" style={{ height: '4px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${current.humidity}%`,
                  background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                  borderRadius: '9999px'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Wind & Gust Card */}
        <div className="glass-panel stat-card">
          <div className="stat-card-header">
            <span>WIND SPEED & VECTOR</span>
            <Wind size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div className="stat-card-val">
              {formatWind(current.windSpeedKmh, current.windSpeedMph, current.windSpeedMs)}
            </div>
            <div className="stat-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={14} style={{ color: 'var(--primary)' }} />
              Direction: <strong>{current.windDirection || 'N'}</strong> ({current.windDeg || 0}°)
            </div>
          </div>
          <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {current.windSpeedKmh > 25 ? '💨 Breezy to strong breeze' : '🍃 Light to gentle breeze'}
          </div>
        </div>

        {/* Atmospheric Pressure */}
        <div className="glass-panel stat-card">
          <div className="stat-card-header">
            <span>BAROMETRIC PRESSURE</span>
            <Gauge size={18} style={{ color: 'var(--secondary)' }} />
          </div>
          <div>
            <div className="stat-card-val">{current.pressure} <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>hPa</span></div>
            <div className="stat-card-meta">
              {current.pressure >= 1013 ? 'High pressure system (fair skies)' : 'Low pressure system (possible clouds/rain)'}
            </div>
          </div>
          <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Standard sea-level: 1013.25 hPa
          </div>
        </div>

        {/* Visibility */}
        <div className="glass-panel stat-card">
          <div className="stat-card-header">
            <span>VISIBILITY RANGE</span>
            <Eye size={18} style={{ color: 'var(--accent-warning)' }} />
          </div>
          <div>
            <div className="stat-card-val">{current.visibilityKm} <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>km</span></div>
            <div className="stat-card-meta">
              {parseFloat(current.visibilityKm) >= 10 ? '✨ Perfectly clear horizon' : '🌫️ Reduced visibility or haze'}
            </div>
          </div>
          <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Equivalent to {current.visibilityMiles} miles
          </div>
        </div>

        {/* UV Index Card */}
        <div className="glass-panel stat-card">
          <div className="stat-card-header">
            <span>UV RADIATION INDEX</span>
            <Sun size={18} style={{ color: 'var(--accent-sun)' }} />
          </div>
          <div>
            <div className="stat-card-val">{current.uvIndex ?? 3.5}</div>
            <div className="stat-card-meta">
              {current.uvIndex >= 6 ? '⚠️ Sun protection needed (SPF 30+)' : '🛡️ Safe for moderate outdoor exposure'}
            </div>
          </div>
          <div style={{ marginTop: '0.85rem' }}>
            <div className="temp-bar-bg" style={{ height: '4px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, ((current.uvIndex || 3.5) / 11) * 100)}%`,
                  background: 'linear-gradient(90deg, #10b981 0%, #fbbf24 60%, #ef4444 100%)',
                  borderRadius: '9999px'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Cloud Coverage */}
        <div className="glass-panel stat-card">
          <div className="stat-card-header">
            <span>CLOUD COVERAGE</span>
            <Cloud size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <div className="stat-card-val">{current.cloudCover ?? 20}%</div>
            <div className="stat-card-meta">
              {(current.cloudCover || 0) < 20
                ? 'Mostly sunny skies'
                : (current.cloudCover || 0) < 60
                ? 'Partly cloudy conditions'
                : 'Overcast skies'}
            </div>
          </div>
          <div style={{ marginTop: '0.85rem' }}>
            <div className="temp-bar-bg" style={{ height: '4px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${current.cloudCover ?? 20}%`,
                  background: 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                  borderRadius: '9999px'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherStats;
