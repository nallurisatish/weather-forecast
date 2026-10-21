import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { requestLogger } from './utils/logger.js';
import { getDbStatus } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import citiesRoutes from './routes/citiesRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows cross-origin tile loading for weather maps
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body and Cookie parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Request logger
app.use(requestLogger);

// Global Rate Limiting (120 requests per minute)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after a minute.'
  }
});
app.use('/api', apiLimiter);

// Specific Auth Limiting (20 attempts per 15 minutes to prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  const weatherKeyConfigured = Boolean(
    process.env.WEATHER_API_KEY && process.env.WEATHER_API_KEY !== 'your_openweathermap_api_key'
  );
  const aiKeyConfigured = Boolean(
    process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_ai_provider_api_key'
  );

  res.status(200).json({
    status: 'healthy',
    name: 'WeatherSphere API',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    weatherService: {
      provider: weatherKeyConfigured ? 'OpenWeatherMap' : 'Live Open-Meteo Engine (No Key Required Fallback)',
      apiKeyConfigured: weatherKeyConfigured
    },
    aiService: {
      provider: aiKeyConfigured ? 'OpenAI / Cloud LLM' : 'WeatherSphere Smart Rule-Based Engine',
      apiKeyConfigured: aiKeyConfigured
    }
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// 404 & Centralized Error Handlers
app.use(notFound);
app.use(errorHandler);

export default app;
