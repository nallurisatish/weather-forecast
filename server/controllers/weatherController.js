import { getWeather, searchCities } from '../services/weatherService.js';
import mongoose from 'mongoose';
import SearchHistory from '../models/SearchHistory.js';
import { memoryStore } from '../services/memoryStore.js';

// Record search history if user is logged in
const recordHistory = async (userId, data) => {
  if (!userId || !data?.current?.city) return;
  try {
    const payload = {
      cityName: data.current.city,
      country: data.current.country || '',
      latitude: data.current.coordinates?.lat,
      longitude: data.current.coordinates?.lon
    };

    if (mongoose.connection.readyState === 1) {
      await SearchHistory.create({
        userId,
        ...payload
      });
    } else {
      await memoryStore.addSearchHistory(userId, payload);
    }
  } catch (err) {
    console.warn('Could not record search history:', err.message);
  }
};

export const getCurrentWeather = async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;

    if (!city && (lat === undefined || lon === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a city name or latitude and longitude.'
      });
    }

    let normalizedLat = undefined;
    let normalizedLon = undefined;
    if (lat !== undefined && lon !== undefined) {
      const coords = normalizeCoordinates(lat, lon);
      if (coords) {
        normalizedLat = coords.lat;
        normalizedLon = coords.lon;
      }
    }

    const data = await getWeather({
      city,
      lat: normalizedLat,
      lon: normalizedLon
    });

    if (req.user) {
      recordHistory(req.user._id || req.user.id, data);
    }

    res.status(200).json({
      success: true,
      data: data.current,
      full: data
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

export const getForecast = async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;

    if (!city && (lat === undefined || lon === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a city name or latitude and longitude.'
      });
    }

    const data = await getWeather({
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined
    });

    res.status(200).json({
      success: true,
      hourly: data.hourly,
      daily: data.daily
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

const normalizeCoordinates = (lat, lon) => {
  let parsedLat = parseFloat(lat);
  let parsedLon = parseFloat(lon);
  if (isNaN(parsedLat) || isNaN(parsedLon)) return null;

  // Clamp latitude to [-90, 90]
  parsedLat = Math.max(-89.9, Math.min(89.9, parsedLat));

  // Wrap longitude to [-180, 180]
  parsedLon = ((parsedLon + 180) % 360 + 360) % 360 - 180;

  return { lat: Number(parsedLat.toFixed(4)), lon: Number(parsedLon.toFixed(4)) };
};

export const getCoordinatesWeather = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;

    if (lat === undefined || lon === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Both latitude (lat) and longitude (lon) are required.'
      });
    }

    const coords = normalizeCoordinates(lat, lon);
    if (!coords) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude coordinates provided.'
      });
    }

    const data = await getWeather({
      lat: coords.lat,
      lon: coords.lon
    });

    if (req.user) {
      recordHistory(req.user._id || req.user.id, data);
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const compareCities = async (req, res, next) => {
  try {
    const { cities } = req.query;
    if (!cities) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "cities" is required (comma-separated, e.g. cities=London,Paris).'
      });
    }

    const cityList = cities.split(',').map((c) => c.trim()).filter(Boolean);
    if (cityList.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 cities to compare.'
      });
    }

    const results = await Promise.allSettled(
      cityList.map((city) => getWeather({ city }))
    );

    const successful = [];
    const failed = [];

    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        successful.push(r.value);
      } else {
        failed.push({ city: cityList[idx], error: r.reason?.message || 'Failed to fetch' });
      }
    });

    res.status(200).json({
      success: true,
      comparison: successful,
      failed
    });
  } catch (error) {
    next(error);
  }
};

export const getWeatherAlerts = async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;
    const data = await getWeather({
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined
    });

    res.status(200).json({
      success: true,
      city: data.current.city,
      alerts: data.alerts || []
    });
  } catch (error) {
    next(error);
  }
};

export const searchCityAutocomplete = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({ success: true, results: [] });
    }

    const results = await searchCities(q.trim());
    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    next(error);
  }
};

export const getCyclonesAndStorms = async (req, res, next) => {
  try {
    const { getStormData } = await import('../services/stormService.js');
    const data = await getStormData();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getRadarMaps = async (req, res, next) => {
  try {
    const axios = (await import('axios')).default;
    const response = await axios.get('https://api.rainviewer.com/public/weather-maps.json', {
      timeout: 7000,
      headers: { 'Accept': 'application/json' }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.warn('RainViewer radar fetch notice, using fallback radar structure:', error.message);
    res.status(200).json({
      version: '2.0',
      host: 'https://tilecache.rainviewer.com',
      radar: { past: [] }
    });
  }
};


