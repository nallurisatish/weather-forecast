import React from 'react';
import { Calendar, Droplets } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const WeeklyForecast = ({ daily }) => {
  const { formatTemp } = useTheme();

  if (!daily || daily.length === 0) return null;

  // Calculate lowest min and highest max across the week for relative temperature bars
  const weekMin = Math.min(...daily.map((d) => d.minTempC));
  const weekMax = Math.max(...daily.map((d) => d.maxTempC));
  const tempSpan = Math.max(1, weekMax - weekMin);

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div className="section-header">
        <h2 className="section-title">
          <Calendar size={20} style={{ color: 'var(--primary)' }} />
          7-Day Forecast & Trends
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {daily.length} Days Predicted
        </span>
      </div>

      <div className="daily-forecast-list">
        {daily.map((day, idx) => {
          const iconUrl = day.icon?.startsWith('http')
            ? day.icon
            : `https://openweathermap.org/img/wn/${day.icon || '01d'}@2x.png`;

          // Bar offset and width percentage
          const leftPercent = Math.max(0, ((day.minTempC - weekMin) / tempSpan) * 100);
          const widthPercent = Math.max(15, ((day.maxTempC - day.minTempC) / tempSpan) * 100);

          return (
            <div key={`${day.date}-${idx}`} className="glass-panel daily-row">
              {/* Day Name & Date */}
              <div className="daily-day-col">
                <div>{idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : day.dayName}</div>
                <div className="daily-day-date">{day.date}</div>
              </div>

              {/* Weather Condition & Icon */}
              <div className="daily-condition-col">
                <img
                  src={iconUrl}
                  alt={day.condition}
                  style={{ width: '36px', height: '36px' }}
                  onError={(e) => {
                    e.target.src = 'https://openweathermap.org/img/wn/02d@2x.png';
                  }}
                />
                <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{day.condition}</span>

                {day.pop > 0 && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      marginLeft: '0.5rem'
                    }}
                  >
                    <Droplets size={12} /> {day.pop}%
                  </span>
                )}
              </div>

              {/* Temperature Bar & Min/Max */}
              <div className="daily-temp-bar-col">
                <span style={{ width: '45px', textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {formatTemp(day.minTempC, day.minTempF)}
                </span>

                <div className="temp-bar-bg">
                  <div
                    className="temp-bar-fill"
                    style={{
                      marginLeft: `${leftPercent}%`,
                      width: `${Math.min(100 - leftPercent, widthPercent)}%`
                    }}
                  ></div>
                </div>

                <span style={{ width: '45px', textAlign: 'left', fontSize: '0.92rem', fontWeight: 700 }}>
                  {formatTemp(day.maxTempC, day.maxTempF)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyForecast;
