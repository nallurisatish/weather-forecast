import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { memoryStore } from '../services/memoryStore.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check HTTP-only cookie first, then Authorization Bearer header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'weathersphere_super_secret_jwt_key_2026_dev_mode_secure'
    );

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id).select('-passwordHash');
    } else {
      user = await memoryStore.findUserById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'weathersphere_super_secret_jwt_key_2026_dev_mode_secure'
    );

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id).select('-passwordHash');
    } else {
      user = await memoryStore.findUserById(decoded.id);
    }

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Ignore invalid token in optionalAuth
  }

  next();
};
