import mongoose from 'mongoose';
import User from '../models/User.js';
import { memoryStore } from '../services/memoryStore.js';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(userId).select('-passwordHash');
    } else {
      user = await memoryStore.findUserById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = typeof user.toJSON === 'function' ? user.toJSON() : user;
    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findByIdAndUpdate(
        userId,
        { name: name.trim() },
        { new: true, runValidators: true }
      ).select('-passwordHash');
    } else {
      user = await memoryStore.updateUser(userId, { name: name.trim() });
    }

    const userData = typeof user.toJSON === 'function' ? user.toJSON() : user;
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { preferredTemperatureUnit, preferredWindSpeedUnit } = req.body;

    const updates = {};
    if (preferredTemperatureUnit) {
      if (!['celsius', 'fahrenheit'].includes(preferredTemperatureUnit)) {
        return res.status(400).json({
          success: false,
          message: 'preferredTemperatureUnit must be "celsius" or "fahrenheit"'
        });
      }
      updates.preferredTemperatureUnit = preferredTemperatureUnit;
    }

    if (preferredWindSpeedUnit) {
      if (!['km/h', 'mph', 'm/s'].includes(preferredWindSpeedUnit)) {
        return res.status(400).json({
          success: false,
          message: 'preferredWindSpeedUnit must be "km/h", "mph", or "m/s"'
        });
      }
      updates.preferredWindSpeedUnit = preferredWindSpeedUnit;
    }

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-passwordHash');
    } else {
      user = await memoryStore.updateUser(userId, updates);
    }

    const userData = typeof user.toJSON === 'function' ? user.toJSON() : user;
    res.status(200).json({
      success: true,
      message: 'Weather preferences updated successfully',
      user: userData
    });
  } catch (error) {
    next(error);
  }
};
