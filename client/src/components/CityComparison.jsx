import React, { useState } from 'react';
import { Scale, Plus, Trash2, ArrowRight, Loader2, Thermometer, Droplets, Wind, Sun } from 'lucide-react';
import { weatherAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const PRESET_COMPARISONS = [
  ['London', 'Paris'],
  ['Tokyo', 'New York'],
  ['Sydney', 'Dubai'],
  ['Hyderabad', 'Visakhapatnam']
];

const CityComparison = () => {
  const { formatTemp, formatWind } = useTheme();
  const [citiesInput, setCitiesInput] = useState(['London', 'Paris']);
  const [newCity, setNewCity] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComparison = async (citiesToCompare) => {
    const list = citiesToCompare || citiesInput;
    if (list.length < 2) {
      setError('Please provide at least 2 cities to compare.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await weatherAPI.compareCities(list);
      if (res.data?.success) {
        setComparisonData(res.data.comparison);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compare cities.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = (e) => {
    e.preventDefault();
    if (!newCity.trim()) return;
    if (citiesInput.some((c) => c.toLowerCase() === newCity.trim().toLowerCase())) {
      setError('City is already in comparison list.');
      return;
    }
    const updated = [...citiesInput, newCity.trim()];
    setCitiesInput(updated);
    setNewCity('');
    fetchComparison(updated);
  };

  const handleRemoveCity = (cityToRemove) => {
    const updated = citiesInput.filter((c) => c !== cityToRemove);
    setCitiesInput(updated);
    if (updated.length >= 2) {
      fetchComparison(updated);
    } else {
      setComparisonData(null);
    }
  };

  const handlePreset = (preset) => {
    setCitiesInput(preset);
    fetchComparison(preset);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 className="section-title">
            <Scale size={20} style={{ color: 'var(--primary)' }} />
            Multi-City Weather Comparison
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Compare temperatures, conditions, and humidity side-by-side
          </p>
        </div>

        {/* Preset Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PRESET_COMPARISONS.map(([c1, c2]) => (
            <button
              key={`${c1}-${c2}`}
              className="quick-chip"
              onClick={() => handlePreset([c1, c2])}
            >
              {c1} vs {c2}
            </button>
          ))}
        </div>
      </div>

      {/* City Chips & Add input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {citiesInput.map((city) => (
          <div
            key={city}
            className="glass-panel"
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            <span>{city}</span>
            {citiesInput.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemoveCity(city)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}

        {citiesInput.length < 4 && (
          <form onSubmit={handleAddCity} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="+ Add city..."
              className="form-input-control"
              style={{ width: '140px', padding: '0.35rem 0.75rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
            />
          </form>
        )}

        <button
          className="btn-primary"
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          onClick={() => fetchComparison()}
          disabled={loading}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Compare Now'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-danger)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Comparison Grid */}
      {comparisonData && comparisonData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparisonData.length}, minmax(220px, 1fr))`, gap: '1rem', overflowX: 'auto' }}>
          {comparisonData.map((data, idx) => {
            const curr = data.current;
            const iconUrl = curr.icon?.startsWith('http')
              ? curr.icon
              : `https://openweathermap.org/img/wn/${curr.icon || '01d'}@2x.png`;

            return (
              <div key={`${curr.city}-${idx}`} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{curr.city}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{curr.country}</div>

                <img
                  src={iconUrl}
                  alt={curr.condition}
                  style={{ width: '64px', height: '64px', margin: '0 auto' }}
                  onError={(e) => { e.target.src = 'https://openweathermap.org/img/wn/02d@2x.png'; }}
                />

                <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>
                  {formatTemp(curr.tempC, curr.tempF)}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '1.25rem' }}>
                  {curr.condition}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', textAlign: 'left', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Feels like:</span>
                    <strong>{formatTemp(curr.feelsLikeC, curr.feelsLikeF)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Humidity:</span>
                    <strong>{curr.humidity}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Wind:</span>
                    <strong>{formatWind(curr.windSpeedKmh, curr.windSpeedMph, curr.windSpeedMs)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pressure:</span>
                    <strong>{curr.pressure} hPa</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>UV Index:</span>
                    <strong>{curr.uvIndex ?? 'N/A'}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CityComparison;
