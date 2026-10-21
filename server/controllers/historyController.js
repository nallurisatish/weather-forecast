import mongoose from 'mongoose';
import SearchHistory from '../models/SearchHistory.js';
import { memoryStore } from '../services/memoryStore.js';

export const getSearchHistory = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (mongoose.connection.readyState === 1) {
      const history = await SearchHistory.find({ userId })
        .sort({ searchedAt: -1 })
        .limit(limit);

      return res.status(200).json({
        success: true,
        count: history.length,
        history
      });
    }

    const history = await memoryStore.getSearchHistory(userId, limit);
    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
};

export const addSearchHistory = async (req, res, next) => {
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
      const entry = await SearchHistory.create({
        userId,
        cityName: cityName.trim(),
        country: country || '',
        latitude,
        longitude
      });
      return res.status(201).json({
        success: true,
        entry
      });
    }

    const entry = await memoryStore.addSearchHistory(userId, {
      cityName: cityName.trim(),
      country,
      latitude,
      longitude
    });

    res.status(201).json({
      success: true,
      entry
    });
  } catch (error) {
    next(error);
  }
};

export const clearSearchHistory = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (mongoose.connection.readyState === 1) {
      await SearchHistory.deleteMany({ userId });
    } else {
      await memoryStore.clearSearchHistory(userId);
    }

    res.status(200).json({
      success: true,
      message: 'Search history cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};
