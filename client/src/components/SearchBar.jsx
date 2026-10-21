import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation } from 'lucide-react';
import { weatherAPI } from '../services/api';

const POPULAR_CITIES = ['Tokyo', 'New York', 'London', 'Paris', 'Sydney', 'Dubai', 'Hyderabad'];

const SearchBar = ({ onSearch, onGeolocation, loading }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Debounced autocomplete search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await weatherAPI.searchCities(query.trim());
        if (res.data?.success && res.data?.results) {
          setSuggestions(res.data.results);
          setShowDropdown(res.data.results.length > 0);
        }
      } catch (err) {
        // Silently handle autocomplete error
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelect(suggestions[selectedIndex]);
      return;
    }

    setShowDropdown(false);
    onSearch({ city: query.trim() });
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    setShowDropdown(false);
    onSearch({
      city: item.name,
      lat: item.lat,
      lon: item.lon
    });
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleQuickChip = (city) => {
    setQuery(city);
    onSearch({ city });
  };

  return (
    <div className="search-container" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="search-input-wrapper">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search city, state, or country (e.g. London, Tokyo)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          autoComplete="off"
        />

        <div className="search-actions">
          {query && (
            <button
              type="button"
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setShowDropdown(false);
              }}
              title="Clear"
            >
              <X size={16} />
            </button>
          )}

          {isSearching ? (
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 6px' }} />
          ) : null}

          {/* Use My Location (Geolocation) Button */}
          <button
            type="button"
            className="btn-geo"
            onClick={onGeolocation}
            disabled={loading}
            title="Use current location via browser GPS"
          >
            <Navigation size={14} />
            <span>My Location</span>
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown List */}
      {showDropdown && suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {suggestions.map((item, idx) => (
            <div
              key={`${item.name}-${item.lat}-${item.lon}-${idx}`}
              className={`autocomplete-item ${idx === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(item)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <MapPin size={16} style={{ color: 'var(--primary)' }} />
                <span className="autocomplete-city">{item.name}</span>
              </div>
              <span className="autocomplete-region">
                {item.state ? `${item.state}, ` : ''}{item.country}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Search City Chips */}
      <div className="quick-chips-wrapper">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '4px' }}>Popular:</span>
        {POPULAR_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            className="quick-chip"
            onClick={() => handleQuickChip(city)}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
