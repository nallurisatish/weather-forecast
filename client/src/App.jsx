import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WeatherAssistant from './components/WeatherAssistant';
import Home from './pages/Home';
import Forecast from './pages/Forecast';
import SavedCities from './pages/SavedCities';
import WeatherMap from './pages/WeatherMap';
import CityComparison from './components/CityComparison';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import About from './pages/About';
import NotFound from './pages/NotFound';
import { Sparkles } from 'lucide-react';

const AppContent = () => {
  const { weatherCondition } = useTheme();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [activeWeatherContext, setActiveWeatherContext] = useState(null);

  // Map condition to background class
  const getConditionClass = (cond) => {
    if (!cond) return 'weather-bg-clear';
    const c = cond.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return 'weather-bg-rain';
    if (c.includes('cloud') || c.includes('overcast')) return 'weather-bg-clouds';
    if (c.includes('thunder') || c.includes('storm')) return 'weather-bg-thunderstorm';
    if (c.includes('snow') || c.includes('ice') || c.includes('blizzard')) return 'weather-bg-snow';
    if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return 'weather-bg-mist';
    return 'weather-bg-clear';
  };

  return (
    <div className={`weather-bg-container ${getConditionClass(weatherCondition)}`}>
      <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={<Home onOpenAssistant={() => setIsAssistantOpen(true)} />}
          />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/saved" element={<SavedCities />} />
          <Route path="/map" element={<WeatherMap />} />
          <Route
            path="/compare"
            element={
              <div className="app-container" style={{ padding: '2rem 1.5rem' }}>
                <CityComparison />
              </div>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Floating AI Assistant Trigger Button */}
      <button
        className="ai-trigger-fab"
        onClick={() => setIsAssistantOpen(true)}
        title="Open WeatherSphere AI Assistant"
      >
        <Sparkles size={18} />
        <span>Ask AI Assistant</span>
      </button>

      {/* AI Assistant Modal */}
      <WeatherAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        weatherContext={activeWeatherContext}
      />

      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
