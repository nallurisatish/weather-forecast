import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Initialize Database Connection
await connectDB();

const server = app.listen(PORT, () => {
  console.log(`
🌍 ====================================================
   WeatherSphere — Smart Weather Forecast Server
   Port:        ${PORT}
   Mode:        ${process.env.NODE_ENV || 'development'}
   Health:      http://localhost:${PORT}/api/health
   Client:      ${process.env.CLIENT_URL || 'http://localhost:5173'}
==================================================== 🌍
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});
