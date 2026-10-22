import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import CurrentWeather from '../components/CurrentWeather';
import HourlyForecast from '../components/HourlyForecast';
import WeeklyForecast from '../components/WeeklyForecast';
import WeatherStats from '../components/WeatherStats';
import WeatherCharts from '../components/WeatherCharts';
import CityComparison from '../components/CityComparison';
import { weatherAPI, citiesAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, RefreshCw } from 'lucide-react';

const Home = ({ onOpenAssistant }) => {
  const { setWeatherCondition } = useTheme();
  const { isAuthenticated } = useAuth();

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [savedCities, setSavedCities] = useState([]);
  const [lastSearchParams, setLastSearchParams] = useState({ city: 'London' });

  // Load saved cities if user is logged in
  const loadSavedCities = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedCities([]);
      return;
    }
    try {
      const res = await citiesAPI.getSaved();
      if (res.data?.success && res.data?.cities) {
        setSavedCities(res.data.cities);
      }
    } catch (err) {
      // Ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSavedCities();
  }, [loadSavedCities]);

  // Fetch weather by city name or lat/lon
  const fetchWeather = useCallback(async (params, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let res;
      if (params.lat !== undefined && params.lon !== undefined) {
        res = await weatherAPI.getByCoordinates(params.lat, params.lon);
      } else {
        res = await weatherAPI.getCurrent({ city: params.city });
      }

      const fullData = res.data?.full || res.data?.data;
      if (fullData) {
        setWeatherData(fullData);
        setLastSearchParams(params);

        // Update ThemeContext dynamic condition
        if (fullData.current?.condition) {
          setWeatherCondition(fullData.current.condition);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      if (msg.includes('429')) {
        setError('Weather data service rate limit reached. Reconnecting with backup meteorological network...');
      } else {
        setError(
          msg || 'Unable to retrieve weather data. Please verify your connection or city name.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setWeatherCondition]);

  // Initial load
  useEffect(() => {
    fetchWeather({ city: 'London' });
  }, [fetchWeather]);

  // Handle Search submit
  const handleSearch = (searchTarget) => {
    fetchWeather(searchTarget);
  };

  // Handle Geolocation with automatic IP fallback
  const handleGeolocation = () => {
    setLoading(true);

    if (!navigator.geolocation) {
      fallbackToIpLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather({ lat: latitude, lon: longitude });
      },
      (geoError) => {
        fallbackToIpLocation();
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const fallbackToIpLocation = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data?.city) {
        fetchWeather({
          city: data.city,
          lat: data.latitude,
          lon: data.longitude
        });
        return;
      }
    } catch (err) {
      // Ignore
    }
    setLoading(false);
    fetchWeather({ city: 'London' });
  };

  return (
    <div className="app-container">
      {/* Search Header */}
      <SearchBar
        onSearch={handleSearch}
        onGeolocation={handleGeolocation}
        loading={loading}
      />

      {/* Error Alert */}
      {error && (
        <div
          className="glass-panel"
          style={{
            maxWidth: '680px',
            margin: '0 auto 1.5rem auto',
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.12)',
            borderColor: 'var(--accent-danger)',
            color: 'var(--accent-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{error}</span>
          </div>
          <button
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => fetchWeather(lastSearchParams)}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && !weatherData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="skeleton" style={{ height: '340px', width: '100%' }}></div>
          <div className="skeleton" style={{ height: '140px', width: '100%' }}></div>
          <div className="skeleton" style={{ height: '280px', width: '100%' }}></div>
        </div>
      )}

      {/* Main Weather Sections */}
      {weatherData && (
        <>
          <CurrentWeather
            weather={weatherData}
            onRefresh={() => fetchWeather(lastSearchParams, true)}
            isRefreshing={refreshing}
            savedCities={savedCities}
            onCitySavedChange={loadSavedCities}
          />

          <HourlyForecast hourly={weatherData.hourly} />

          <WeeklyForecast daily={weatherData.daily} />

          <WeatherStats current={weatherData.current} />

          <WeatherCharts hourly={weatherData.hourly} daily={weatherData.daily} />

          <CityComparison />
        </>
      )}
    </div>
  );
};

export default Home;
