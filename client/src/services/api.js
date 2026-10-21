import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Interceptor to attach JWT token from localStorage if available (bearer fallback)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('weathersphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global 401s if necessary
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect on check /me to avoid loops
      if (!error.config.url.includes('/auth/me')) {
        // Can optionally clear storage if token expired
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

// Weather Endpoints
export const weatherAPI = {
  getCurrent: (params) => api.get('/weather/current', { params }),
  getForecast: (params) => api.get('/weather/forecast', { params }),
  getByCoordinates: (lat, lon) => api.get('/weather/coordinates', { params: { lat, lon } }),
  compareCities: (cities) => api.get('/weather/compare', { params: { cities: Array.isArray(cities) ? cities.join(',') : cities } }),
  getAlerts: (params) => api.get('/weather/alerts', { params }),
  searchCities: (query) => api.get('/weather/search', { params: { q: query } }),
  getCyclones: () => api.get('/weather/cyclones'),
  getRadar: () => api.get('/weather/radar')
};

// Saved Cities Endpoints
export const citiesAPI = {
  getSaved: () => api.get('/cities'),
  addSaved: (cityData) => api.post('/cities', cityData),
  deleteSaved: (id) => api.delete(`/cities/${id}`)
};

// Search History Endpoints
export const historyAPI = {
  getHistory: (limit = 10) => api.get('/history', { params: { limit } }),
  addHistory: (entry) => api.post('/history', entry),
  clearHistory: () => api.delete('/history')
};

// User Profile Endpoints
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  updatePreferences: (data) => api.patch('/users/preferences', data)
};

// AI Weather Assistant
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data)
};

// System Health Check
export const systemAPI = {
  getHealth: () => api.get('/health')
};

export default api;
