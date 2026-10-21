import bcrypt from 'bcryptjs';

// In-memory fallback repository when MongoDB server is offline
class MemoryStore {
  constructor() {
    this.users = new Map();
    this.savedCities = new Map();
    this.searchHistories = [];
    this.cache = new Map();
  }

  // Users
  async findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async findUserByGoogleId(googleId) {
    for (const user of this.users.values()) {
      if (user.googleId === String(googleId)) {
        return user;
      }
    }
    return null;
  }

  async findUserById(id) {
    return this.users.get(String(id)) || null;
  }

  async createGoogleUser({ name, email, googleId, avatar }) {
    const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const newUser = {
      _id: id,
      id,
      name,
      email: email.toLowerCase(),
      googleId,
      avatar: avatar || '',
      preferredTemperatureUnit: 'celsius',
      preferredWindSpeedUnit: 'km/h',
      favoriteCities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      comparePassword: async function () {
        return false;
      },
      toJSON: function () {
        const copy = { ...this };
        delete copy.passwordHash;
        delete copy.comparePassword;
        delete copy.toJSON;
        return copy;
      }
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async createUser({ name, email, password }) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    
    const newUser = {
      _id: id,
      id,
      name,
      email: email.toLowerCase(),
      passwordHash,
      preferredTemperatureUnit: 'celsius',
      preferredWindSpeedUnit: 'km/h',
      favoriteCities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      comparePassword: async function(enteredPassword) {
        return bcrypt.compare(enteredPassword, this.passwordHash);
      },
      toJSON: function() {
        const copy = { ...this };
        delete copy.passwordHash;
        delete copy.comparePassword;
        delete copy.toJSON;
        return copy;
      }
    };

    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id, updates) {
    const user = this.users.get(String(id));
    if (!user) return null;
    Object.assign(user, updates, { updatedAt: new Date() });
    return user;
  }

  // Saved Cities
  async getSavedCities(userId) {
    const list = [];
    for (const city of this.savedCities.values()) {
      if (city.userId === String(userId)) {
        list.push(city);
      }
    }
    return list;
  }

  async addSavedCity(userId, { cityName, country, latitude, longitude }) {
    const key = `${userId}_${cityName.toLowerCase()}`;
    if (this.savedCities.has(key)) {
      return this.savedCities.get(key);
    }
    const city = {
      _id: 'city_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: String(userId),
      cityName,
      country: country || '',
      latitude,
      longitude,
      createdAt: new Date()
    };
    this.savedCities.set(key, city);
    return city;
  }

  async removeSavedCity(userId, cityIdentifier) {
    for (const [key, city] of this.savedCities.entries()) {
      if (city.userId === String(userId) && (city._id === cityIdentifier || city.cityName.toLowerCase() === cityIdentifier.toLowerCase())) {
        this.savedCities.delete(key);
        return true;
      }
    }
    return false;
  }

  // Search History
  async getSearchHistory(userId, limit = 10) {
    return this.searchHistories
      .filter((h) => h.userId === String(userId))
      .sort((a, b) => b.searchedAt - a.searchedAt)
      .slice(0, limit);
  }

  async addSearchHistory(userId, { cityName, country, latitude, longitude }) {
    const entry = {
      _id: 'hist_' + Date.now(),
      userId: String(userId),
      cityName,
      country: country || '',
      latitude,
      longitude,
      searchedAt: new Date()
    };
    this.searchHistories.unshift(entry);
    // keep max 100 entries per memory
    if (this.searchHistories.length > 200) {
      this.searchHistories = this.searchHistories.slice(0, 100);
    }
    return entry;
  }

  async clearSearchHistory(userId) {
    this.searchHistories = this.searchHistories.filter((h) => h.userId !== String(userId));
    return true;
  }

  // Cache
  getCache(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  setCache(key, data, ttlSeconds = 600) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }
}

export const memoryStore = new MemoryStore();
