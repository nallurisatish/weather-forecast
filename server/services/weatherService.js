import axios from 'axios';
import mongoose from 'mongoose';
import WeatherCache from '../models/WeatherCache.js';
import { memoryStore } from './memoryStore.js';

const CACHE_TTL_SECONDS = 600; // 10 minutes

// Helper to convert wind degrees to compass direction
export const getWindDirection = (deg) => {
  if (deg === undefined || deg === null) return 'N';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5);
  return directions[index % 16];
};

// Weather code to standard condition mapping for Open-Meteo
const mapWmoCode = (code) => {
  switch (code) {
    case 0:
      return { condition: 'Clear', description: 'Clear sky', icon: '01d' };
    case 1:
      return { condition: 'Mainly Clear', description: 'Mainly clear', icon: '02d' };
    case 2:
      return { condition: 'Partly Cloudy', description: 'Partly cloudy', icon: '03d' };
    case 3:
      return { condition: 'Overcast', description: 'Overcast', icon: '04d' };
    case 45:
    case 48:
      return { condition: 'Fog', description: 'Foggy conditions', icon: '50d' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Drizzle', description: 'Light drizzle', icon: '09d' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain', description: 'Rain showers', icon: '10d' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Snow', description: 'Snowfall', icon: '13d' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Heavy Rain', description: 'Heavy showers', icon: '09d' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Thunderstorm', description: 'Thunderstorm with precipitation', icon: '11d' };
    default:
      return { condition: 'Clouds', description: 'Cloudy', icon: '03d' };
  }
};

// Check cache
const getCachedWeather = async (key) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const cached = await WeatherCache.findOne({ locationKey: key });
      if (cached && new Date() < cached.expiresAt) {
        return cached.weatherData;
      }
    } else {
      return memoryStore.getCache(key);
    }
  } catch (err) {
    console.warn('Cache lookup warning:', err.message);
  }
  return null;
};

// Save cache
const setCachedWeather = async (key, data) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await WeatherCache.findOneAndUpdate(
        { locationKey: key },
        {
          weatherData: data,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + CACHE_TTL_SECONDS * 1000)
        },
        { upsert: true, new: true }
      );
    } else {
      memoryStore.setCache(key, data, CACHE_TTL_SECONDS);
    }
  } catch (err) {
    console.warn('Cache save warning:', err.message);
  }
};

/**
 * Geocode search: Returns matching cities with lat/lon
 */
export const searchCities = async (query) => {
  if (!query || !query.trim()) return [];
  const q = query.trim();
  const apiKey = process.env.WEATHER_API_KEY;

  if (apiKey && apiKey !== 'your_openweathermap_api_key') {
    try {
      const res = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: { q, limit: 5, appid: apiKey },
        timeout: 5000
      });
      return res.data.map((item) => ({
        name: item.name,
        country: item.country,
        state: item.state || '',
        lat: item.lat,
        lon: item.lon,
        displayName: `${item.name}${item.state ? `, ${item.state}` : ''}, ${item.country}`
      }));
    } catch (err) {
      console.warn('OpenWeatherMap geocoding failed, falling back to geocoding-api.open-meteo.com:', err.message);
    }
  }

  // Fallback to Open-Meteo Geocoding
  try {
    const res = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: q, count: 5, language: 'en', format: 'json' },
      timeout: 5000
    });
    if (!res.data.results) return [];
    return res.data.results.map((item) => ({
      name: item.name,
      country: item.country_code || item.country || '',
      state: item.admin1 || '',
      lat: item.latitude,
      lon: item.longitude,
      displayName: `${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country_code || item.country}`
    }));
  } catch (error) {
    console.error('Geocoding service error:', error.message);
    return [];
  }
};

/**
 * Fetch Weather via OpenWeatherMap
 */
const fetchFromOpenWeather = async (lat, lon, cityName, apiKey) => {
  // Current weather
  const currentReq = axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: { lat, lon, units: 'metric', appid: apiKey },
    timeout: 7000
  });

  // 5-day / 3-hour forecast
  const forecastReq = axios.get('https://api.openweathermap.org/data/2.5/forecast', {
    params: { lat, lon, units: 'metric', appid: apiKey },
    timeout: 7000
  });

  // Air Pollution
  const airReq = axios.get('https://api.openweathermap.org/data/2.5/air_pollution', {
    params: { lat, lon, appid: apiKey },
    timeout: 5000
  }).catch(() => null);

  const [currentRes, forecastRes, airRes] = await Promise.all([currentReq, forecastReq, airReq]);

  const curr = currentRes.data;
  const fc = forecastRes.data;

  const resolvedCity = cityName || curr.name;
  const country = curr.sys?.country || '';

  // Hourly forecasts (next 8 3-hr blocks = 24 hrs)
  const hourly = fc.list.slice(0, 10).map((item) => {
    const date = new Date(item.dt * 1000);
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: item.dt * 1000,
      tempC: Math.round(item.main.temp),
      tempF: Math.round((item.main.temp * 9) / 5 + 32),
      feelsLikeC: Math.round(item.main.feels_like),
      feelsLikeF: Math.round((item.main.feels_like * 9) / 5 + 32),
      condition: item.weather[0].main,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      pop: Math.round((item.pop || 0) * 100),
      humidity: item.main.humidity,
      windSpeedKmh: Math.round(item.wind.speed * 3.6),
      windSpeedMph: Math.round(item.wind.speed * 2.237),
      pressure: item.main.pressure
    };
  });

  // Aggregate 5-day forecast by date
  const dailyMap = {};
  fc.list.forEach((item) => {
    const d = new Date(item.dt * 1000);
    const dayKey = d.toISOString().split('T')[0];
    if (!dailyMap[dayKey]) {
      dailyMap[dayKey] = {
        date: dayKey,
        dayName: d.toLocaleDateString([], { weekday: 'short' }),
        temps: [],
        conditions: [],
        pops: [],
        humidities: [],
        winds: [],
        icons: []
      };
    }
    dailyMap[dayKey].temps.push(item.main.temp);
    dailyMap[dayKey].conditions.push(item.weather[0].main);
    dailyMap[dayKey].pops.push((item.pop || 0) * 100);
    dailyMap[dayKey].humidities.push(item.main.humidity);
    dailyMap[dayKey].winds.push(item.wind.speed * 3.6);
    dailyMap[dayKey].icons.push(item.weather[0].icon);
  });

  const daily = Object.values(dailyMap).map((day) => {
    const minTemp = Math.round(Math.min(...day.temps));
    const maxTemp = Math.round(Math.max(...day.temps));
    // pick middle icon / most frequent condition
    const midIdx = Math.floor(day.conditions.length / 2);
    return {
      date: day.date,
      dayName: day.dayName,
      minTempC: minTemp,
      minTempF: Math.round((minTemp * 9) / 5 + 32),
      maxTempC: maxTemp,
      maxTempF: Math.round((maxTemp * 9) / 5 + 32),
      condition: day.conditions[midIdx] || 'Clear',
      description: day.conditions[midIdx] || 'Clear',
      icon: day.icons[midIdx] || '01d',
      pop: Math.round(day.pops.reduce((a, b) => Math.max(a, b), 0)),
      humidity: Math.round(day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length),
      windSpeedKmh: Math.round(day.winds.reduce((a, b) => a + b, 0) / day.winds.length)
    };
  });

  const uvIndex = airRes?.data?.list?.[0]?.main?.aqi ? (airRes.data.list[0].main.aqi * 2).toFixed(1) : 4.5;

  return {
    current: {
      city: resolvedCity,
      country,
      coordinates: { lat, lon },
      localTime: new Date(Date.now() + (curr.timezone || 0) * 1000).toUTCString().replace('GMT', ''),
      condition: curr.weather[0].main,
      description: curr.weather[0].description,
      icon: curr.weather[0].icon,
      tempC: Math.round(curr.main.temp),
      tempF: Math.round((curr.main.temp * 9) / 5 + 32),
      feelsLikeC: Math.round(curr.main.feels_like),
      feelsLikeF: Math.round((curr.main.feels_like * 9) / 5 + 32),
      minTempC: Math.round(curr.main.temp_min),
      minTempF: Math.round((curr.main.temp_min * 9) / 5 + 32),
      maxTempC: Math.round(curr.main.temp_max),
      maxTempF: Math.round((curr.main.temp_max * 9) / 5 + 32),
      humidity: curr.main.humidity,
      windSpeedKmh: Math.round(curr.wind.speed * 3.6),
      windSpeedMph: Math.round(curr.wind.speed * 2.237),
      windSpeedMs: Math.round(curr.wind.speed * 10) / 10,
      windDeg: curr.wind.deg,
      windDirection: getWindDirection(curr.wind.deg),
      pressure: curr.main.pressure,
      visibilityKm: curr.visibility ? (curr.visibility / 1000).toFixed(1) : '10.0',
      visibilityMiles: curr.visibility ? (curr.visibility / 1609).toFixed(1) : '6.2',
      cloudCover: curr.clouds?.all ?? 20,
      uvIndex: Number(uvIndex),
      sunrise: new Date(curr.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sunset: new Date(curr.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dataSource: 'OpenWeatherMap'
    },
    hourly,
    daily,
    alerts: []
  };
};

/**
 * Fetch Weather via Open-Meteo (High reliability live fallback without API key)
 */
const fetchFromOpenMeteo = async (lat, lon, cityName, country = '') => {
  const url = 'https://api.open-meteo.com/v1/forecast';
  const res = await axios.get(url, {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,surface_pressure,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max',
      timezone: 'auto'
    },
    timeout: 8000
  });

  const d = res.data;
  const currentWmo = mapWmoCode(d.current.weather_code);
  const tempC = Math.round(d.current.temperature_2m);
  const feelsLikeC = Math.round(d.current.apparent_temperature);
  const windSpeedKmh = Math.round(d.current.wind_speed_10m);

  // Hourly (next 24 hours)
  const hourly = [];
  const currentHour = new Date().getHours();
  const times = d.hourly.time || [];
  for (let i = 0; i < Math.min(24, times.length); i++) {
    const timeStr = times[i];
    const hourDate = new Date(timeStr);
    const wmo = mapWmoCode(d.hourly.weather_code[i]);
    hourly.push({
      time: hourDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: hourDate.getTime(),
      tempC: Math.round(d.hourly.temperature_2m[i]),
      tempF: Math.round((d.hourly.temperature_2m[i] * 9) / 5 + 32),
      feelsLikeC: Math.round(d.hourly.apparent_temperature[i]),
      feelsLikeF: Math.round((d.hourly.apparent_temperature[i] * 9) / 5 + 32),
      condition: wmo.condition,
      description: wmo.description,
      icon: wmo.icon,
      pop: d.hourly.precipitation_probability ? d.hourly.precipitation_probability[i] || 0 : 0,
      humidity: d.hourly.relative_humidity_2m ? d.hourly.relative_humidity_2m[i] : 65,
      windSpeedKmh: Math.round(d.hourly.wind_speed_10m ? d.hourly.wind_speed_10m[i] : 10),
      windSpeedMph: Math.round((d.hourly.wind_speed_10m ? d.hourly.wind_speed_10m[i] : 10) * 0.621371),
      pressure: Math.round(d.hourly.surface_pressure ? d.hourly.surface_pressure[i] : 1013)
    });
  }

  // Daily (7 days)
  const daily = [];
  const dailyTimes = d.daily.time || [];
  for (let i = 0; i < dailyTimes.length; i++) {
    const dayDate = new Date(dailyTimes[i]);
    const wmo = mapWmoCode(d.daily.weather_code[i]);
    const minC = Math.round(d.daily.temperature_2m_min[i]);
    const maxC = Math.round(d.daily.temperature_2m_max[i]);
    daily.push({
      date: dailyTimes[i],
      dayName: dayDate.toLocaleDateString([], { weekday: 'short' }),
      minTempC: minC,
      minTempF: Math.round((minC * 9) / 5 + 32),
      maxTempC: maxC,
      maxTempF: Math.round((maxC * 9) / 5 + 32),
      condition: wmo.condition,
      description: wmo.description,
      icon: wmo.icon,
      pop: d.daily.precipitation_probability_max ? d.daily.precipitation_probability_max[i] || 0 : 0,
      humidity: 60,
      windSpeedKmh: 12
    });
  }

  const sunrise = d.daily.sunrise?.[0] ? new Date(d.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:00 AM';
  const sunset = d.daily.sunset?.[0] ? new Date(d.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:30 PM';
  const uv = d.daily.uv_index_max?.[0] ? Math.round(d.daily.uv_index_max[0] * 10) / 10 : 5.0;

  return {
    current: {
      city: cityName || 'Selected Location',
      country: country || '',
      coordinates: { lat, lon },
      localTime: new Date().toLocaleString(),
      condition: currentWmo.condition,
      description: currentWmo.description,
      icon: currentWmo.icon,
      tempC,
      tempF: Math.round((tempC * 9) / 5 + 32),
      feelsLikeC,
      feelsLikeF: Math.round((feelsLikeC * 9) / 5 + 32),
      minTempC: daily[0]?.minTempC ?? (tempC - 3),
      minTempF: daily[0]?.minTempF ?? Math.round(((tempC - 3) * 9) / 5 + 32),
      maxTempC: daily[0]?.maxTempC ?? (tempC + 4),
      maxTempF: daily[0]?.maxTempF ?? Math.round(((tempC + 4) * 9) / 5 + 32),
      humidity: d.current.relative_humidity_2m || 50,
      windSpeedKmh,
      windSpeedMph: Math.round(windSpeedKmh * 0.621371),
      windSpeedMs: Math.round((windSpeedKmh / 3.6) * 10) / 10,
      windDeg: d.current.wind_direction_10m || 0,
      windDirection: getWindDirection(d.current.wind_direction_10m),
      pressure: Math.round(d.current.surface_pressure || 1013),
      visibilityKm: '10.0',
      visibilityMiles: '6.2',
      cloudCover: d.current.cloud_cover || 10,
      uvIndex: uv,
      sunrise,
      sunset,
      dataSource: 'Live Weather (Open-Meteo fallback)'
    },
    hourly,
    daily,
    alerts: []
  };
};

/**
 * Main function: Get full weather by lat/lon or city query
 */
export const getWeather = async ({ city, lat, lon }) => {
  let targetLat = lat;
  let targetLon = lon;
  let cityName = city;
  let country = '';

  // If city is specified, resolve coordinates first
  if (cityName && (!targetLat || !targetLon)) {
    const results = await searchCities(cityName);
    if (!results || results.length === 0) {
      throw new Error(`City '${cityName}' not found. Please verify spelling or try another location.`);
    }
    targetLat = results[0].lat;
    targetLon = results[0].lon;
    cityName = results[0].name;
    country = results[0].country;
  }

  if (targetLat === undefined || targetLon === undefined) {
    throw new Error('Valid city name or latitude and longitude must be provided.');
  }

  // Rounded key for cache
  const cacheKey = `weather_${Number(targetLat).toFixed(2)}_${Number(targetLon).toFixed(2)}`;
  const cached = await getCachedWeather(cacheKey);
  if (cached) {
    return { ...cached, isCached: true };
  }

  const apiKey = process.env.WEATHER_API_KEY;
  let weatherData;

  if (apiKey && apiKey !== 'your_openweathermap_api_key') {
    try {
      weatherData = await fetchFromOpenWeather(targetLat, targetLon, cityName, apiKey);
    } catch (err) {
      console.warn('OpenWeatherMap API request failed, falling back to Open-Meteo:', err.message);
      weatherData = await fetchFromOpenMeteo(targetLat, targetLon, cityName, country);
    }
  } else {
    weatherData = await fetchFromOpenMeteo(targetLat, targetLon, cityName, country);
  }

  // Save in cache
  await setCachedWeather(cacheKey, weatherData);

  return weatherData;
};
