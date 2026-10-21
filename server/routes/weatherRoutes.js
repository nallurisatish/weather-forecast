import express from 'express';
import {
  getCurrentWeather,
  getForecast,
  getCoordinatesWeather,
  compareCities,
  getWeatherAlerts,
  searchCityAutocomplete,
  getCyclonesAndStorms,
  getRadarMaps
} from '../controllers/weatherController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/current', optionalAuth, getCurrentWeather);
router.get('/forecast', optionalAuth, getForecast);
router.get('/coordinates', optionalAuth, getCoordinatesWeather);
router.get('/compare', compareCities);
router.get('/alerts', getWeatherAlerts);
router.get('/search', searchCityAutocomplete);
router.get('/cyclones', getCyclonesAndStorms);
router.get('/radar', getRadarMaps);

export default router;
