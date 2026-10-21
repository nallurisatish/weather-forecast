import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendingUp, BarChart3, Droplets, Thermometer } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CustomTooltip = ({ active, payload, label, tempUnit }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '0.75rem 1rem',
          fontSize: '0.85rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-glow)'
        }}
      >
        <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color, margin: '2px 0' }}>
            {entry.name}: <strong>{entry.value}{entry.unit || ''}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const WeatherCharts = ({ hourly, daily }) => {
  const { tempUnit } = useTheme();
  const [activeTab, setActiveTab] = useState('hourly'); // 'hourly' | 'variation' | 'precipitation'

  if (!hourly?.length && !daily?.length) return null;

  // Format hourly chart data
  const hourlyData = (hourly || []).slice(0, 16).map((item) => ({
    time: item.time,
    temp: tempUnit === 'fahrenheit' ? item.tempF : item.tempC,
    feelsLike: tempUnit === 'fahrenheit' ? item.feelsLikeF : item.feelsLikeC,
    pop: item.pop || 0,
    humidity: item.humidity || 50
  }));

  // Format daily variation data
  const variationData = (daily || []).map((day) => ({
    name: day.dayName || day.date,
    High: tempUnit === 'fahrenheit' ? day.maxTempF : day.maxTempC,
    Low: tempUnit === 'fahrenheit' ? day.minTempF : day.minTempC,
    RainChance: day.pop || 0
  }));

  const unitSymbol = tempUnit === 'fahrenheit' ? '°F' : '°C';

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div>
          <h2 className="section-title" style={{ fontSize: '1.25rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
            Interactive Weather Analytics
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time trajectory curves and precipitation probabilities
          </p>
        </div>

        {/* Tab Controls */}
        <div className="chart-tabs-wrapper">
          <button
            className={`chart-tab-btn ${activeTab === 'hourly' ? 'active' : ''}`}
            onClick={() => setActiveTab('hourly')}
          >
            Hourly Temperature
          </button>
          <button
            className={`chart-tab-btn ${activeTab === 'variation' ? 'active' : ''}`}
            onClick={() => setActiveTab('variation')}
          >
            7-Day High / Low
          </button>
          <button
            className={`chart-tab-btn ${activeTab === 'precipitation' ? 'active' : ''}`}
            onClick={() => setActiveTab('precipitation')}
          >
            Precipitation & Humidity
          </button>
        </div>
      </div>

      <div className="chart-canvas-box">
        {activeTab === 'hourly' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="feelsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} unit={unitSymbol} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip content={<CustomTooltip tempUnit={unitSymbol} />} />
              <Area type="monotone" dataKey="temp" name={`Temperature (${unitSymbol})`} stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#tempGradient)" />
              <Area type="monotone" dataKey="feelsLike" name={`Feels Like (${unitSymbol})`} stroke="#818cf8" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#feelsGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'variation' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={variationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} unit={unitSymbol} domain={['dataMin - 3', 'dataMax + 3']} />
              <Tooltip content={<CustomTooltip tempUnit={unitSymbol} />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="High" name={`Max Temp (${unitSymbol})`} fill="#fbbf24" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Low" name={`Min Temp (${unitSymbol})`} fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'precipitation' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="popGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip tempUnit="%" />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" dataKey="pop" name="Rain Probability (%)" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#popGradient)" />
              <Line type="monotone" dataKey="humidity" name="Relative Humidity (%)" stroke="#10b981" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default WeatherCharts;
