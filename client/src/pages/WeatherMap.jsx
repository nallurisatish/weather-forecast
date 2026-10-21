import React, { useEffect, useRef, useState } from 'react';
import {
  Map as MapIcon,
  Layers,
  Search,
  MapPin,
  Navigation,
  Loader2,
  CloudRain,
  Wind,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Flame,
  Radio,
  CheckCircle2,
  Globe,
  Info,
  ExternalLink
} from 'lucide-react';
import { weatherAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const BASE_MAPS = {
  dark: {
    name: 'Dark Radar',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community'
  },
  light: {
    name: 'Light Map',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  standard: {
    name: 'Standard Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
};

const WeatherMap = () => {
  const { mode, formatTemp } = useTheme();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const radarLayerRef = useRef(null);
  const stormLayerGroupRef = useRef(null);
  const rainAlertLayerGroupRef = useRef(null);
  const markerRef = useRef(null);
  const animationTimerRef = useRef(null);

  // States
  const [mapEngine, setMapEngine] = useState('zoomradar'); // 'zoomradar' (default) | 'windy' | 'leaflet'
  const [mapCenter, setMapCenter] = useState({ lat: 20.5, lon: 85.0, zoom: 5 });
  const [activeBaseMap, setActiveBaseMap] = useState('dark');
  const [searchCity, setSearchCity] = useState('');
  const [selectedPointWeather, setSelectedPointWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);

  // Layer Visibility Toggles
  const [showRainRadar, setShowRainRadar] = useState(true);
  const [showCyclones, setShowCyclones] = useState(true);
  const [showRainAlerts, setShowRainAlerts] = useState(true);

  // Cyclone Filter: 'all' | 'extreme' | 'moderate'
  const [cycloneFilter, setCycloneFilter] = useState('all');

  // RainViewer Radar API State
  const [radarFrames, setRadarFrames] = useState([]);
  const [radarHost, setRadarHost] = useState('https://tilecache.rainviewer.com');
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlayingRadar, setIsPlayingRadar] = useState(false);
  const [radarOpacity, setRadarOpacity] = useState(0.75);

  // Cyclone and Storm Data State
  const [cyclonesData, setCyclonesData] = useState([]);
  const [rainAlertsData, setRainAlertsData] = useState([]);
  const [apiStatus, setApiStatus] = useState(null);

  // 1. Fetch Cyclones & Severe Weather from our API (combines NASA EONET + JTWC + IMD)
  useEffect(() => {
    const fetchStorms = async () => {
      try {
        const res = await weatherAPI.getCyclones();
        if (res.data?.success) {
          setCyclonesData(res.data.cyclones || []);
          setRainAlertsData(res.data.rainAlerts || []);
          setApiStatus(res.data.apiStatus || null);
        }
      } catch (err) {
        console.warn('Could not load cyclone tracks:', err);
      }
    };
    fetchStorms();
  }, []);

  // 2. Fetch RainViewer Real-Time Radar API (via first-party backend proxy)
  useEffect(() => {
    const fetchRadar = async () => {
      try {
        const res = await weatherAPI.getRadar();
        const data = res.data;
        if (data?.radar?.past && data.radar.past.length > 0) {
          setRadarFrames(data.radar.past);
          setRadarHost(data.host || 'https://tilecache.rainviewer.com');
          setCurrentFrameIndex(data.radar.past.length - 1);
          return;
        }
      } catch (err) {
        console.warn('Backend radar proxy notice, trying direct radar fetch:', err);
      }

      // Fallback direct fetch if backend was busy
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        if (data.radar?.past && data.radar.past.length > 0) {
          setRadarFrames(data.radar.past);
          setRadarHost(data.host || 'https://tilecache.rainviewer.com');
          setCurrentFrameIndex(data.radar.past.length - 1);
        }
      } catch (e) {
        console.warn('Direct radar notice:', e);
      }
    };
    fetchRadar();
  }, []);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!window.L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([20.0, 85.0], 4); // Centered over Bay of Bengal / Indian Ocean & Asia
      mapInstanceRef.current = map;

      // Base Map Tile Layer
      const baseCfg = BASE_MAPS[activeBaseMap];
      baseTileLayerRef.current = window.L.tileLayer(baseCfg.url, {
        attribution: baseCfg.attribution,
        maxZoom: 18
      }).addTo(map);

      // Layer groups for dynamic markers
      stormLayerGroupRef.current = window.L.layerGroup().addTo(map);
      rainAlertLayerGroupRef.current = window.L.layerGroup().addTo(map);

      // Map Click to inspect weather at any coordinate
      map.on('click', async (e) => {
        let lat = Math.max(-89.9, Math.min(89.9, e.latlng.lat));
        let lng = ((e.latlng.lng + 180) % 360 + 360) % 360 - 180;
        setLoading(true);
        try {
          const res = await weatherAPI.getByCoordinates(lat, lng);
          const data = res.data?.data?.current;
          if (data) {
            setSelectedPointWeather(data);

            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              markerRef.current = window.L.marker([lat, lng]).addTo(map);
            }

            markerRef.current
              .bindPopup(`
              <div style="font-family: inherit; font-size: 13px; text-align: center; padding: 4px;">
                <strong style="font-size: 14px;">${data.city || 'Selected Point'}</strong><br/>
                <span style="font-size: 18px; font-weight: 800; color: #38bdf8;">${data.tempC}°C</span> • ${data.condition}<br/>
                <span style="color: #64748b; font-size: 11px;">Humidity: ${data.humidity}% | Wind: ${data.windSpeedKmh} km/h</span>
              </div>
            `)
              .openPopup();
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      });
    }

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, []);

  // 4. Update Base Map Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !baseTileLayerRef.current) return;
    const baseCfg = BASE_MAPS[activeBaseMap];
    baseTileLayerRef.current.setUrl(baseCfg.url);
  }, [activeBaseMap]);

  // 5. Update RainViewer Live Radar Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    if (!showRainRadar || radarFrames.length === 0) {
      if (radarLayerRef.current) {
        mapInstanceRef.current.removeLayer(radarLayerRef.current);
        radarLayerRef.current = null;
      }
      return;
    }

    const currentFrame = radarFrames[currentFrameIndex];
    if (!currentFrame) return;

    const radarTileUrl = `${radarHost}${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

    if (!radarLayerRef.current) {
      radarLayerRef.current = window.L.tileLayer(radarTileUrl, {
        opacity: radarOpacity,
        zIndex: 50,
        attribution: '&copy; RainViewer Real-time Radar'
      }).addTo(mapInstanceRef.current);
    } else {
      radarLayerRef.current.setUrl(radarTileUrl);
      radarLayerRef.current.setOpacity(radarOpacity);
    }
  }, [showRainRadar, radarFrames, currentFrameIndex, radarOpacity, radarHost]);

  // 6. Radar Animation Play / Pause Loop
  useEffect(() => {
    if (isPlayingRadar && radarFrames.length > 1) {
      animationTimerRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length);
      }, 750);
    } else {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    }

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isPlayingRadar, radarFrames.length]);

  // 7. Render Cyclones & Storm Tracking Markers on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !stormLayerGroupRef.current) return;

    stormLayerGroupRef.current.clearLayers();

    if (!showCyclones || cyclonesData.length === 0) return;

    const filteredStorms = cyclonesData.filter((storm) => {
      if (cycloneFilter === 'extreme') return storm.categoryLevel >= 3;
      if (cycloneFilter === 'moderate') return storm.categoryLevel < 3;
      return true;
    });

    filteredStorms.forEach((cyclone) => {
      const lat = cyclone.center.lat;
      const lon = cyclone.center.lon;
      const isExtreme = cyclone.categoryLevel >= 3;
      const badgeColor = isExtreme ? '#ef4444' : '#f59e0b';

      // Custom animated cyclone pulse icon
      const cycloneHtml = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; inset: 0; background: ${isExtreme ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}; border-radius: 50%; animation: pulseGlow 1.5s infinite;"></div>
          <div style="position: absolute; width: 34px; height: 34px; background: rgba(168, 85, 247, 0.45); border-radius: 50%;"></div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: ${badgeColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; box-shadow: 0 0 15px ${badgeColor}; z-index: 2;">
            🌀
          </div>
          <span style="position: absolute; top: -14px; background: #0f172a; border: 1px solid ${badgeColor}; color: #f8fafc; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; white-space: nowrap; z-index: 3;">
            CAT ${cyclone.categoryLevel}
          </span>
        </div>
      `;

      const cycloneIcon = window.L.divIcon({
        html: cycloneHtml,
        className: 'custom-cyclone-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = window.L.marker([lat, lon], { icon: cycloneIcon }).addTo(stormLayerGroupRef.current);

      // Detailed Storm Telemetry Popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; width: 240px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: ${badgeColor};">${cyclone.name}</strong>
            <span style="background: rgba(239,68,68,0.2); color: ${badgeColor}; padding: 2px 5px; border-radius: 3px; font-weight: 700; font-size: 10px;">${cyclone.category}</span>
          </div>
          <div style="margin-bottom: 4px;"><strong>Basin:</strong> ${cyclone.basin}</div>
          <div style="margin-bottom: 4px;"><strong>Max Sustained Winds:</strong> ${cyclone.windSpeedKmh} km/h (${cyclone.windSpeedKnots} kts)</div>
          <div style="margin-bottom: 4px;"><strong>Gusts:</strong> ${cyclone.gustsKmh} km/h</div>
          <div style="margin-bottom: 4px;"><strong>Central Pressure:</strong> ${cyclone.pressureHpa} hPa</div>
          <div style="margin-bottom: 4px;"><strong>Movement:</strong> ${cyclone.movement}</div>
          <div style="margin-bottom: 4px; color: #38bdf8;"><strong>Rainfall Risk:</strong> ${cyclone.rainfallExpected}</div>
          <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px; margin-top: 4px;">
            <strong>Telemetry Source:</strong> ${cyclone.source || 'NASA EONET / JTWC'}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      // Draw predicted forecast track polyline if available
      if (cyclone.track && cyclone.track.length > 1) {
        const latlngs = cyclone.track.map((pt) => [pt.lat, pt.lon]);
        window.L.polyline(latlngs, {
          color: badgeColor,
          weight: 3,
          dashArray: '5, 8',
          opacity: 0.8
        }).addTo(stormLayerGroupRef.current);

        // Add track points
        cyclone.track.forEach((pt) => {
          window.L.circleMarker([pt.lat, pt.lon], {
            radius: pt.time.includes('Current') ? 6 : 4,
            color: pt.time.includes('Current') ? badgeColor : '#fbbf24',
            fillColor: '#ffffff',
            fillOpacity: 1,
            weight: 2
          })
            .bindTooltip(`${pt.time}: ${pt.stage}`, { permanent: false })
            .addTo(stormLayerGroupRef.current);
        });
      }
    });
  }, [showCyclones, cyclonesData, cycloneFilter]);

  // 8. Render Severe Rain Warning Zones on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !rainAlertLayerGroupRef.current) return;

    rainAlertLayerGroupRef.current.clearLayers();

    if (!showRainAlerts || rainAlertsData.length === 0) return;

    rainAlertsData.forEach((alert) => {
      const circle = window.L.circle([alert.coordinates.lat, alert.coordinates.lon], {
        radius: alert.radiusKm * 1000,
        color: alert.color || '#ef4444',
        fillColor: alert.color || '#ef4444',
        fillOpacity: 0.22,
        weight: 2,
        dashArray: '4, 6'
      }).addTo(rainAlertLayerGroupRef.current);

      circle.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; width: 220px;">
          <div style="font-weight: 800; font-size: 13px; color: ${alert.color}; margin-bottom: 4px;">
            🌧️ ${alert.intensity}
          </div>
          <div style="margin-bottom: 4px;"><strong>Location:</strong> ${alert.location}</div>
          <div style="margin-bottom: 4px;"><strong>Expected Rate:</strong> ${alert.rateMmPerHour}</div>
          <div style="margin-bottom: 4px;"><strong>Status:</strong> <span style="background: rgba(239,68,68,0.15); padding: 2px 4px; border-radius: 3px; font-weight: 700;">${alert.warningLevel}</span></div>
          <p style="margin-top: 6px; font-size: 11px; color: #94a3b8; line-height: 1.4;">${alert.advisory}</p>
        </div>
      `);
    });
  }, [showRainAlerts, rainAlertsData]);

  // Fly to specific storm or city
  const flyToLocation = (lat, lon, zoom = 7) => {
    setMapCenter({ lat, lon, zoom });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], zoom, { duration: 1.8 });
    }
  };

  // Invalidate Leaflet canvas when switching engines
  useEffect(() => {
    if (mapEngine === 'leaflet' && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 150);
    }
  }, [mapEngine]);

  // Fly to user's current GPS location
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        flyToLocation(latitude, longitude, 8);
        setLocatingUser(false);
      },
      (err) => {
        console.warn('Geolocation notice:', err.message);
        setLocatingUser(false);
        // Default graceful center over a major metropolis
        flyToLocation(28.6139, 77.2090, 8); // New Delhi
      },
      { timeout: 7000 }
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCity.trim()) return;

    setLoading(true);
    try {
      const res = await weatherAPI.searchCities(searchCity.trim());
      if (res.data?.success && res.data?.results?.[0]) {
        const item = res.data.results[0];
        flyToLocation(item.lat, item.lon, 9);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Convert radar timestamp to human readable local time
  const getRadarTimeStr = () => {
    if (!radarFrames.length || !radarFrames[currentFrameIndex]) return 'Live Radar';
    const timestamp = radarFrames[currentFrameIndex].time * 1000;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredCyclones = cyclonesData.filter((storm) => {
    if (cycloneFilter === 'extreme') return storm.categoryLevel >= 3;
    if (cycloneFilter === 'moderate') return storm.categoryLevel < 3;
    return true;
  });

  return (
    <div className="app-container">
      {/* Header Row */}
      <div className="section-header" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapIcon size={28} style={{ color: 'var(--primary)' }} />
            Live Global Weather Radar & Cyclone Tracking Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Real-time Doppler precipitation radar sweeps, active satellite-tracked cyclones, and severe rainfall warnings powered by free public meteorological APIs.
          </p>
        </div>

        {/* Map Engine View Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`chart-tab-btn ${mapEngine === 'zoomradar' ? 'active' : ''}`}
              onClick={() => setMapEngine('zoomradar')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <CloudRain size={15} style={{ color: mapEngine === 'zoomradar' ? '#ffffff' : 'var(--primary)' }} />
              <span>Zoom Rain Map (Live)</span>
            </button>
            <button
              type="button"
              className={`chart-tab-btn ${mapEngine === 'windy' ? 'active' : ''}`}
              onClick={() => setMapEngine('windy')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Wind size={15} style={{ color: mapEngine === 'windy' ? '#ffffff' : '#38bdf8' }} />
              <span>Windy Live Radar</span>
            </button>
            <button
              type="button"
              className={`chart-tab-btn ${mapEngine === 'leaflet' ? 'active' : ''}`}
              onClick={() => setMapEngine('leaflet')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Layers size={15} style={{ color: mapEngine === 'leaflet' ? '#ffffff' : '#f59e0b' }} />
              <span>NASA Storm Tracks</span>
            </button>
          </div>

          {/* Base Map Style Toggles (Only when in Leaflet mode) */}
          {mapEngine === 'leaflet' && (
            <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-card)', padding: '3px 6px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap', fontSize: '0.78rem' }}>
              {Object.entries(BASE_MAPS).map(([key, config]) => (
                <button
                  key={key}
                  className={`chart-tab-btn ${activeBaseMap === key ? 'active' : ''}`}
                  onClick={() => setActiveBaseMap(key)}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                >
                  {config.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Free Public API Access Granted Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '0.75rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'rgba(16, 185, 129, 0.08)',
          borderColor: 'rgba(16, 185, 129, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} className="animate-pulse" />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10b981' }}>
            Free Meteorological APIs Active & Granted
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            (Zero Keys Required — Direct Public Access to NASA EONET, RainViewer Doppler Radar, Open-Meteo & CARTO)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
          <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
            🛰️ NASA EONET Active
          </span>
          <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
            🌧️ RainViewer Doppler Active
          </span>
          <a
            href="https://zoom.earth/maps/precipitation/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'rgba(56, 189, 248, 0.22)',
              color: '#38bdf8',
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(56, 189, 248, 0.4)'
            }}
            title="Open Zoom Earth Live Satellite & Rain Radar"
          >
            <Globe size={12} />
            <span>Zoom Earth Rain ↗</span>
          </a>
          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
            ⚡ 100% Pre-Authorized
          </span>
        </div>
      </div>

      {/* Control Bar: Layer Toggles, Search, Locate Me, Radar Time */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        {/* Layer Switches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn-secondary ${showRainRadar ? 'active' : ''}`}
            onClick={() => setShowRainRadar(!showRainRadar)}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              borderColor: showRainRadar ? 'var(--primary)' : 'var(--border-subtle)',
              color: showRainRadar ? 'var(--primary)' : 'var(--text-secondary)'
            }}
          >
            <CloudRain size={16} />
            <span>🌧️ Live Rain Radar</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${showCyclones ? 'active' : ''}`}
            onClick={() => setShowCyclones(!showCyclones)}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              borderColor: showCyclones ? '#ef4444' : 'var(--border-subtle)',
              color: showCyclones ? '#ef4444' : 'var(--text-secondary)'
            }}
          >
            <Wind size={16} />
            <span>🌀 Cyclones & Storms ({cyclonesData.length})</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${showRainAlerts ? 'active' : ''}`}
            onClick={() => setShowRainAlerts(!showRainAlerts)}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              borderColor: showRainAlerts ? '#f59e0b' : 'var(--border-subtle)',
              color: showRainAlerts ? '#f59e0b' : 'var(--text-secondary)'
            }}
          >
            <AlertTriangle size={16} />
            <span>⛈️ Heavy Rain Warnings ({rainAlertsData.length})</span>
          </button>

          {/* Zoom Earth Live Rain Website Link */}
          <a
            href="https://zoom.earth/maps/precipitation/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              textDecoration: 'none',
              color: '#38bdf8',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              background: 'rgba(56, 189, 248, 0.1)',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.45rem 0.9rem'
            }}
            title="Open Zoom Earth to view real-time satellite imagery, wind speeds, and precipitation radar"
          >
            <Globe size={16} />
            <span>Zoom Earth Live Rain ↗</span>
          </a>
        </div>

        {/* Locate Me + Search City Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLocateUser}
            disabled={locatingUser}
            title="Fly map to your current location"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {locatingUser ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} style={{ color: 'var(--primary)' }} />}
            <span>Locate Me</span>
          </button>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', width: '280px' }}>
            <input
              type="text"
              className="form-input-control"
              placeholder="Fly to city (e.g. Tokyo, Miami)..."
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.88rem' }}
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.45rem 0.85rem' }} disabled={loading || !searchCity.trim()}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </form>
        </div>
      </div>

      {/* Main Map Box + Overlay Controls */}
      <div
        className="glass-panel"
        style={{
          height: '660px',
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          padding: 0,
          marginBottom: '2rem'
        }}
      >
        {/* 1. Zoom Rain Radar Interactive Map (Embedded directly in place of map) */}
        {mapEngine === 'zoomradar' && (
          <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
            <iframe
              key={`zoomradar-${mapCenter.lat}-${mapCenter.lon}-${mapCenter.zoom}`}
              title="Zoom Rain Radar Live Interactive Map"
              src={`https://www.rainviewer.com/map.html?loc=${mapCenter.lat},${mapCenter.lon},${mapCenter.zoom}&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&c=3&o=85&lm=1&layer=radar&sm=1&sn=1`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="geolocation"
              loading="lazy"
            />
          </div>
        )}

        {/* 2. Windy Live Doppler & Satellite Streamlines */}
        {mapEngine === 'windy' && (
          <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
            <iframe
              key={`windy-${mapCenter.lat}-${mapCenter.lon}-${mapCenter.zoom}`}
              title="Windy Live Doppler Radar and Satellite"
              src={`https://embed.windy.com/embed2.html?lat=${mapCenter.lat}&lon=${mapCenter.lon}&zoom=${mapCenter.zoom}&level=surface&overlay=radar&product=radar&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="geolocation"
              loading="lazy"
            />
          </div>
        )}

        {/* 3. WeatherSphere Leaflet & NASA Cyclones Map (Kept mounted for instant switching) */}
        <div
          ref={mapContainerRef}
          style={{
            display: mapEngine === 'leaflet' ? 'block' : 'none',
            height: '100%',
            width: '100%',
            zIndex: 1
          }}
        />

        {/* Floating Quick Launcher for Zoom Earth Website (Top-Right) */}
        <a
          href={`https://zoom.earth/maps/precipitation/#view=${mapCenter.lat},${mapCenter.lon},${mapCenter.zoom}z`}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 1000,
            padding: '0.55rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1.5px solid rgba(56, 189, 248, 0.5)',
            color: '#38bdf8',
            textDecoration: 'none',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)'
          }}
          title="Open Zoom Earth Website in full screen with live precipitation radar"
        >
          <Globe size={15} />
          <span>Zoom Earth HD ↗</span>
        </a>

        {/* Radar Playback Floating Panel for Leaflet Mode (Bottom-Center) */}
        {mapEngine === 'leaflet' && showRainRadar && radarFrames.length > 0 && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              padding: '0.65rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1.5px solid var(--border-glow)'
            }}
          >
            {/* Play / Pause Toggle */}
            <button
              className="btn-icon"
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff' }}
              onClick={() => setIsPlayingRadar(!isPlayingRadar)}
              title={isPlayingRadar ? 'Pause Radar Loop' : 'Play Radar Loop'}
            >
              {isPlayingRadar ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Time Stamp & Frame Scrubber */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '150px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Radio size={12} className="animate-pulse" /> Live Radar Loop
                </span>
                <span>{getRadarTimeStr()}</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, radarFrames.length - 1)}
                value={currentFrameIndex}
                onChange={(e) => setCurrentFrameIndex(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Opacity Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Opacity:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={radarOpacity}
                onChange={(e) => setRadarOpacity(Number(e.target.value))}
                style={{ width: '60px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* Selected Point Weather Card (Bottom-Left) */}
        {selectedPointWeather && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: '1.5rem',
              zIndex: 1000,
              padding: '1.25rem 1.5rem',
              minWidth: '250px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} /> Selected Coordinates
              </div>
              <a
                href={`https://zoom.earth/maps/precipitation/#view=${selectedPointWeather.coordinates?.lat || 20},${selectedPointWeather.coordinates?.lon || 85},7z`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.72rem',
                  color: '#38bdf8',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: 700,
                  background: 'rgba(56, 189, 248, 0.15)',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)'
                }}
                title="Open Zoom Earth to view precipitation radar at this exact coordinate"
              >
                Zoom Earth <ExternalLink size={10} />
              </a>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0' }}>
              {selectedPointWeather.city}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>
              {formatTemp(selectedPointWeather.tempC, selectedPointWeather.tempF)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {selectedPointWeather.condition} • Humidity: {selectedPointWeather.humidity}%
            </div>
          </div>
        )}
      </div>

      {/* Active Cyclones & Heavy Rainfall Hotspots List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Active Cyclones Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
              <Wind size={20} /> Active Cyclones & Typhoons
            </h2>
            <span style={{ fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              {filteredCyclones.length} Tracked
            </span>
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button
              className={`chart-tab-btn ${cycloneFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCycloneFilter('all')}
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
            >
              All Storms ({cyclonesData.length})
            </button>
            <button
              className={`chart-tab-btn ${cycloneFilter === 'extreme' ? 'active' : ''}`}
              onClick={() => setCycloneFilter('extreme')}
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
            >
              Cat 3-5 Extreme
            </button>
            <button
              className={`chart-tab-btn ${cycloneFilter === 'moderate' ? 'active' : ''}`}
              onClick={() => setCycloneFilter('moderate')}
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
            >
              Cat 1-2 & Tropical
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredCyclones.map((storm) => {
              const isExtreme = storm.categoryLevel >= 3;
              const badgeColor = isExtreme ? '#ef4444' : '#f59e0b';
              return (
                <div
                  key={storm.id}
                  className="glass-panel glass-card-interactive"
                  style={{ padding: '1.25rem', borderLeft: `4px solid ${badgeColor}`, cursor: 'pointer' }}
                  onClick={() => flyToLocation(storm.center.lat, storm.center.lon, 6)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{storm.name}</h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{storm.basin}</div>
                    </div>
                    <span style={{ background: badgeColor, color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                      CAT {storm.categoryLevel}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.85rem', fontSize: '0.82rem' }}>
                    <div>💨 Max Winds: <strong>{storm.windSpeedKmh} km/h</strong></div>
                    <div>🌀 Pressure: <strong>{storm.pressureHpa} hPa</strong></div>
                    <div>🧭 Movement: <strong>{storm.movement}</strong></div>
                    <div>🌧️ Rain: <strong>{storm.rainfallExpected.split(' ')[0]} mm</strong></div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', marginTop: '0.85rem', paddingTop: '0.65rem', fontSize: '0.82rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <a
                      href={`https://zoom.earth/maps/satellite/#view=${storm.center.lat},${storm.center.lon},6z`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: '0.74rem',
                        color: '#ef4444',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontWeight: 700,
                        background: 'rgba(239, 68, 68, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}
                      title="Track this cyclone on Zoom Earth live satellite"
                    >
                      <Globe size={12} /> Zoom Earth Satellite <ExternalLink size={10} />
                    </a>
                    <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      Fly to Eye <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Heavy Rainfall Alert Zones Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <CloudRain size={20} /> Severe Rainfall & Downpour Zones
            </h2>
            <span style={{ fontSize: '0.8rem', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              {rainAlertsData.length} Monitored
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
            {rainAlertsData.map((alert) => (
              <div
                key={alert.id}
                className="glass-panel glass-card-interactive"
                style={{ padding: '1.25rem', borderLeft: `4px solid ${alert.color || '#38bdf8'}`, cursor: 'pointer' }}
                onClick={() => flyToLocation(alert.coordinates.lat, alert.coordinates.lon, 7)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{alert.intensity}</h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{alert.location}</div>
                  </div>
                  <span style={{ background: alert.color, color: '#ffffff', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '3px' }}>
                    {alert.warningLevel}
                  </span>
                </div>

                <div style={{ marginTop: '0.65rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Rate: <strong>{alert.rateMmPerHour}</strong> • Radius: {alert.radiusKm} km
                </div>

                <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {alert.advisory}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', marginTop: '0.85rem', paddingTop: '0.65rem', fontSize: '0.82rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <a
                    href={`https://zoom.earth/maps/precipitation/#view=${alert.coordinates.lat},${alert.coordinates.lon},7z`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: '0.74rem',
                      color: '#38bdf8',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontWeight: 700,
                      background: 'rgba(56, 189, 248, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}
                    title="Track this rain zone on Zoom Earth precipitation radar"
                  >
                    <CloudRain size={12} /> Zoom Earth Rain Radar <ExternalLink size={10} />
                  </a>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    View on Map <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherMap;
