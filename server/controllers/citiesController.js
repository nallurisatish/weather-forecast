import mongoose from 'mongoose';
import SavedCity from '../models/SavedCity.js';
import User from '../models/User.js';
import { memoryStore } from '../services/memoryStore.js';

export const getSavedCities = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (mongoose.connection.readyState === 1) {
      const cities = await SavedCity.find({ userId }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: cities.length,
        cities
      });
    }

    const cities = await memoryStore.getSavedCities(userId);
    res.status(200).json({
      success: true,
      count: cities.length,
      cities
    });
  } catch (error) {
    next(error);
  }
};

export const addSavedCity = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { cityName, country, latitude, longitude } = req.body;

    if (!cityName) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }

    if (mongoose.connection.readyState === 1) {
      const existing = await SavedCity.findOne({
        userId,
        cityName: new RegExp(`^${cityName.trim()}$`, 'i')
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `${cityName} is already in your saved cities`
        });
      }

      const city = await SavedCity.create({
        userId,
        cityName: cityName.trim(),
        country: country || '',
        latitude,
        longitude
      });

      // Also sync to User favoriteCities array
      await User.findByIdAndUpdate(userId, {
        $addToSet: {
          favoriteCities: {
            cityName: cityName.trim(),
            country: country || '',
            latitude,
            longitude
          }
        }
      });

      return res.status(201).json({
        success: true,
        city
      });
    }

    // Memory Store fallback
    const city = await memoryStore.addSavedCity(userId, {
      cityName: cityName.trim(),
      country,
      latitude,
      longitude
    });

    res.status(201).json({
      success: true,
      city
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSavedCity = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      // Find and delete by ObjectId or city name
      let deleted;
      if (mongoose.Types.ObjectId.isValid(id)) {
        deleted = await SavedCity.findOneAndDelete({ _id: id, userId });
      }
      if (!deleted) {
        deleted = await SavedCity.findOneAndDelete({ cityName: new RegExp(`^${id}$`, 'i'), userId });
      }

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Saved city not found or unauthorized'
        });
      }

      // Also remove from User document
      await User.findByIdAndUpdate(userId, {
        $pull: { favoriteCities: { cityName: deleted.cityName } }
      });

      return res.status(200).json({
        success: true,
        message: 'City removed from favorites',
        id
      });
    }

    const removed = await memoryStore.removeSavedCity(userId, id);
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Saved city not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'City removed from favorites',
      id
    });
  } catch (error) {
    next(error);
  }
};
