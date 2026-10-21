import React from 'react';
import { Clock, Droplets } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const HourlyForecast = ({ hourly }) => {
  const { formatTemp } = useTheme();

  if (!hourly || hourly.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="section-header">
        <h2 className="section-title">
          <Clock size={20} style={{ color: 'var(--primary)' }} />
          Hourly Forecast (Next 24 Hours)
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scroll horizontally →</span>
      </div>

      <div className="hourly-scroll-container">
        {hourly.map((item, idx) => {
          const iconUrl = item.icon?.startsWith('http')
            ? item.icon
            : `https://openweathermap.org/img/wn/${item.icon || '01d'}@2x.png`;

          return (
            <div key={`${item.time}-${idx}`} className="glass-panel hourly-card">
              <span className="hourly-time">{item.time}</span>
              <img
                src={iconUrl}
                alt={item.condition}
                className="hourly-icon"
                onError={(e) => {
                  e.target.src = 'https://openweathermap.org/img/wn/02d@2x.png';
                }}
              />
              <span className="hourly-temp">{formatTemp(item.tempC, item.tempF)}</span>
              
              {/* Rain Probability / Condition Badge */}
              <div
                className="hourly-pop"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  opacity: item.pop > 0 ? 1 : 0.6
                }}
              >
                <Droplets size={10} />
                <span>{item.pop}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyForecast;
