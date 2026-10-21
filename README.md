# 🌐 WeatherSphere — Smart Weather Forecast

> *"Every Forecast. Every Destination. Every Day."*

WeatherSphere is a modern, responsive, and full-stack Weather Forecast Web Application engineered with the **MERN** stack (MongoDB, Express, React, Node.js) and powered by real-time meteorological data and an **AI-powered weather assistant**.

---

## 🚀 Features

- 🌤️ **Real-Time Weather Intelligence**: Current conditions, live temperature, feels-like, min/max range, humidity, wind vector and speed, atmospheric pressure, visibility, UV radiation index, and sun cycles (sunrise/sunset).
- 🕒 **Hourly Forecast**: Horizontally scrollable 24-hour forecast with precipitation probability and temperature trends.
- 📅 **7-Day Meteorological Outlook**: Day-by-day predictions with dynamic temperature range bars and precipitation indicators.
- 🔍 **Smart Location Search & Autocomplete**: Search by city, state, or country with debounced autocomplete suggestions, popular destination quick-chips, and browser GPS geolocation.
- 🤖 **AI Weather Assistant**: Interactive chat interface powered by an intelligent meteorological rule engine (with plug-and-play OpenAI / Cloud LLM API support). Ask natural questions like:
  - *"Will it rain today?"*
  - *"What should I wear tomorrow?"*
  - *"Should I carry an umbrella?"*
  - *"Is today good for running or cycling?"*
  - *"Explain what 80% humidity means."*
- 📊 **Interactive Weather Visualizations**: Built with **Recharts** for smooth curves:
  - Hourly temperature line/area trajectory
  - 7-Day high/low temperature bar comparisons
  - Precipitation probability and relative humidity graphs
- ⚖️ **Multi-City Weather Comparison**: Compare 2 or more cities side-by-side with real-time differential statistics.
- 🗺️ **Live Global Weather Radar & Cyclone Tracking Center**:
  - **Live Precipitation Radar**: Integrated **RainViewer API** with live Doppler radar tiles and an interactive animation scrubber (play/pause the past 2 hours of radar sweeps).
  - **Tropical Cyclone & Typhoon Tracking**: Real-time tracking of active cyclonic storms (e.g. *Severe Cyclonic Storm "Dana"*, *Super Typhoon "Kong-rey"*, *Hurricane "Rafael"*) with category badges, central pressure, maximum sustained wind speeds, and projected forecast tracks.
  - **Severe Rainfall Warning Zones**: Dynamic warning polygons and circles (Red/Orange alert zones) indicating rainfall rates (mm/hr) and evacuation advisories.
  - **Satellite & Dark Radar Base Maps**: Switch between CartoDB Dark Matter, ESRI Satellite Imagery, Carto Light, and Street maps.
- 🔑 **Google Sign-In Authentication**: Instant 1-click Google OAuth login via Google Identity Services and backend token verification.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v6, Axios, Recharts, Lucide React, CSS3 Glassmorphism |
| **Backend** | Node.js (v18+ or v24+), Express.js, RESTful Architecture, Helmet, CORS, Express Rate Limit |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs, Cookie-Parser, Express-Validator |
| **Database** | MongoDB & Mongoose ODM (Atlas Cloud or Local MongoDB with resilient in-memory fallback) |
| **Weather Engine** | OpenWeatherMap API + Ultra-reliable live Open-Meteo fallback grid (100% real data) |
| **AI Engine** | WeatherSphere Intelligence Engine + OpenAI/Gemini compatible API integration |

---

## 📁 Project Architecture

```
weather/
├── client/                      # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/              # Static assets
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navbar.jsx       # Header with unit & theme toggles
│   │   │   ├── Footer.jsx       # Footer with attribution & links
│   │   │   ├── SearchBar.jsx    # Autocomplete city search
│   │   │   ├── CurrentWeather.jsx # Main hero weather card
│   │   │   ├── HourlyForecast.jsx # 24-hr horizontal scroll
│   │   │   ├── WeeklyForecast.jsx # 7-day outlook
│   │   │   ├── WeatherStats.jsx # Detailed atmospheric statistics
│   │   │   ├── WeatherCharts.jsx# Recharts temperature & rain charts
│   │   │   ├── WeatherAssistant.jsx # AI chat assistant modal
│   │   │   └── CityComparison.jsx   # Side-by-side city comparator
│   │   ├── pages/               # Route views
│   │   │   ├── Home.jsx         # Live dashboard
│   │   │   ├── Forecast.jsx     # Extended forecast
│   │   │   ├── SavedCities.jsx  # Favorite locations manager
│   │   │   ├── WeatherMap.jsx   # Interactive Leaflet map
│   │   │   ├── Login.jsx        # User login
│   │   │   ├── Register.jsx     # User registration
│   │   │   ├── Profile.jsx      # Preferences & search history
│   │   │   ├── About.jsx        # Project overview
│   │   │   └── NotFound.jsx     # 404 page
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # User authentication state
│   │   │   └── ThemeContext.jsx # Theme and weather dynamic state
│   │   ├── services/
│   │   │   └── api.js           # Axios API service client
│   │   ├── App.jsx              # Main routing & layout
│   │   ├── index.css            # Master design system & tokens
│   │   └── main.jsx             # React DOM entry point
│   └── package.json
├── server/                      # Node.js + Express Backend API
│   ├── config/
│   │   └── db.js                # MongoDB connection & resilient fallback
│   ├── controllers/             # Request handlers
│   │   ├── authController.js
│   │   ├── weatherController.js
│   │   ├── citiesController.js
│   │   ├── historyController.js
│   │   ├── userController.js
│   │   └── aiController.js
│   ├── middleware/              # Auth, validation, and error handlers
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── SavedCity.js
│   │   ├── SearchHistory.js
│   │   └── WeatherCache.js
│   ├── routes/                  # REST API endpoints
│   ├── services/
│   │   ├── weatherService.js    # OpenWeatherMap & Open-Meteo engine
│   │   ├── aiService.js         # Weather assistant & AI logic
│   │   └── memoryStore.js       # In-memory persistence fallback
│   ├── tests/
│   │   └── api.test.js          # Automated backend integration tests
│   ├── app.js                   # Express application setup
│   ├── server.js                # Server entry point
│   ├── .env.example             # Example environment variables
│   └── package.json
├── .gitignore
├── package.json                 # Root script runner
└── README.md
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (tested on Node v24.14.0)
- **npm**: `v9.0.0` or higher (tested on npm 11.9.0)
- **MongoDB** *(Optional for local dev)*: Local MongoDB instance or free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI. If MongoDB is offline, WeatherSphere automatically switches to a resilient in-memory session mode.

### 2. Environment Variables Setup

In the `server/` directory, create a `.env` file based on `.env.example`:

```bash
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/weathersphere
JWT_SECRET=weathersphere_super_secret_jwt_key_2026_dev_mode_secure
WEATHER_API_KEY=your_openweathermap_api_key
AI_API_KEY=your_openai_or_gemini_api_key
```

> **Note on Weather API**: If you do not have an OpenWeatherMap API key immediately, leave `WEATHER_API_KEY=` blank. WeatherSphere will automatically use its built-in live **Open-Meteo engine** to serve real, accurate global weather without any missing keys or mock data!

---

### 3. Installation

Install dependencies for both frontend and backend from the root directory:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

### 4. Running the Application

You can run both servers simultaneously:

#### Terminal 1 — Start the Backend Server:
```bash
cd server
npm run dev
# Server will run on: http://localhost:5000
# Health Check: http://localhost:5000/api/health
```

#### Terminal 2 — Start the React Frontend:
```bash
cd client
npm run dev
# Frontend will run on: http://localhost:5173
```

Now open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🧪 Testing

Run automated tests on the backend using Node's native test runner:

```bash
cd server
npm test
```

Tests verify:
- Health check endpoint `GET /api/health`
- Weather autocomplete `GET /api/weather/search?q=London`
- Weather validation `GET /api/weather/current`
- Password confirmation checks `POST /api/auth/register`
- AI weather assistant responses `POST /api/ai/chat`

---

## 🚢 Deployment Guide

### Deploy Backend (Render, Railway, or AWS)
1. Push code to GitHub.
2. In [Render](https://render.com), create a new **Web Service**.
3. Set the Root Directory to `server`.
4. Set Build Command: `npm install`
5. Set Start Command: `node server.js`
6. Add Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-frontend-domain.vercel.app`
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A long random secret string
   - `WEATHER_API_KEY`: Your OpenWeatherMap API key

### Deploy Frontend (Vercel or Netlify)
1. In [Vercel](https://vercel.com), import the repository.
2. Set the Root Directory to `client`.
3. Framework Preset: `Vite`.
4. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-domain.onrender.com/api`
5. Click **Deploy**.

---

## 📄 License
MIT License &copy; 2026 WeatherSphere. All rights reserved.
