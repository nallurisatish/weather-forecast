import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../services/api';
import HourlyForecast from '../components/HourlyForecast';
import WeeklyForecast from '../components/WeeklyForecast';
import WeatherCharts from '../components/WeatherCharts';
import SearchBar from '../components/SearchBar';
import { Calendar, BarChart3, Loader2 } from 'lucide-react';

const Forecast = () => {
  const [city, setCity] = useState('London');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async (cityName) => {
    setLoading(true);
    try {
      const res = await weatherAPI.getCurrent({ city: cityName });
      const full = res.data?.full || res.data?.data;
      if (full) {
        setWeatherData(full);
        setCity(cityName);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(city);
  }, []);

  return (
    <div className="app-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          Extended <span style={{ color: 'var(--primary)' }}>Forecast</span> Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Comprehensive multi-day meteorological modeling, precipitation chances, and hourly trajectories for {city}.
        </p>
      </div>

      <SearchBar
        onSearch={({ city: newCity }) => fetchForecast(newCity)}
        onGeolocation={() => {
          navigator.geolocation?.getCurrentPosition((pos) => {
            weatherAPI.getByCoordinates(pos.coords.latitude, pos.coords.longitude).then((res) => {
              if (res.data?.data?.current?.city) {
                fetchForecast(res.data.data.current.city);
              }
            });
          });
        }}
        loading={loading}
      />

      {loading && !weatherData && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      )}

      {weatherData && (
        <>
          <HourlyForecast hourly={weatherData.hourly} />
          <WeeklyForecast daily={weatherData.daily} />
          <WeatherCharts hourly={weatherData.hourly} daily={weatherData.daily} />
        </>
      )}
    </div>
  );
};

export default Forecast;
