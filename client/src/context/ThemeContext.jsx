import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user, updatePreferences } = useAuth();

  // Mode: dark or light
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('weathersphere_mode') || 'dark';
  });

  // Dynamic Weather Condition Theme (Clear, Clouds, Rain, Snow, Thunderstorm, Mist, Default)
  const [weatherCondition, setWeatherCondition] = useState('Clear');

  // Units
  const [tempUnit, setTempUnit] = useState(() => {
    return localStorage.getItem('weathersphere_tempUnit') || 'celsius';
  });

  const [windUnit, setWindUnit] = useState(() => {
    return localStorage.getItem('weathersphere_windUnit') || 'km/h';
  });

  // Sync with logged-in user profile preferences
  useEffect(() => {
    if (user?.preferredTemperatureUnit) {
      setTempUnit(user.preferredTemperatureUnit);
      localStorage.setItem('weathersphere_tempUnit', user.preferredTemperatureUnit);
    }
    if (user?.preferredWindSpeedUnit) {
      setWindUnit(user.preferredWindSpeedUnit);
      localStorage.setItem('weathersphere_windUnit', user.preferredWindSpeedUnit);
    }
  }, [user]);

  // Persist mode to localStorage & document element
  useEffect(() => {
    localStorage.setItem('weathersphere_mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleTempUnit = async () => {
    const next = tempUnit === 'celsius' ? 'fahrenheit' : 'celsius';
    setTempUnit(next);
    localStorage.setItem('weathersphere_tempUnit', next);
    if (user) {
      await updatePreferences({ preferredTemperatureUnit: next });
    }
  };

  const setSpecificWindUnit = async (unit) => {
    setWindUnit(unit);
    localStorage.setItem('weathersphere_windUnit', unit);
    if (user) {
      await updatePreferences({ preferredWindSpeedUnit: unit });
    }
  };

  // Helper conversion functions
  const formatTemp = (celsius, fahrenheit) => {
    if (tempUnit === 'fahrenheit') {
      if (fahrenheit !== undefined) return `${fahrenheit}°F`;
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  const formatWind = (kmh, mph, ms) => {
    if (windUnit === 'mph') {
      if (mph !== undefined) return `${mph} mph`;
      return `${Math.round(kmh * 0.621371)} mph`;
    }
    if (windUnit === 'm/s') {
      if (ms !== undefined) return `${ms} m/s`;
      return `${(kmh / 3.6).toFixed(1)} m/s`;
    }
    return `${kmh} km/h`;
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleMode,
        weatherCondition,
        setWeatherCondition,
        tempUnit,
        toggleTempUnit,
        windUnit,
        setSpecificWindUnit,
        formatTemp,
        formatWind
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
