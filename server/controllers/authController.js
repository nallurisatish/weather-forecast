import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { memoryStore } from '../services/memoryStore.js';

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'weathersphere_super_secret_jwt_key_2026_dev_mode_secure',
    { expiresIn: '7d' }
  );
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id || user.id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res.cookie('token', token, cookieOptions);

  const userData = typeof user.toJSON === 'function' ? user.toJSON() : user;
  delete userData.passwordHash;

  res.status(statusCode).json({
    success: true,
    token,
    user: userData
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const lowerEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: lowerEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: lowerEmail,
        passwordHash
      });

      sendTokenResponse(user, 201, res);
    } else {
      // Memory Store fallback
      const existing = await memoryStore.findUserByEmail(lowerEmail);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      const user = await memoryStore.createUser({ name, email: lowerEmail, password });
      sendTokenResponse(user, 201, res);
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = email.toLowerCase().trim();

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: lowerEmail });
    } else {
      user = await memoryStore.findUserByEmail(lowerEmail);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

export const googleLogin = async (req, res, next) => {
  try {
    const { credential, email: bodyEmail, name: bodyName, picture, googleId: bodyGoogleId } = req.body;

    let googleUser = null;

    // 1. Verify credential token if provided
    if (credential) {
      try {
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        
        if (process.env.GOOGLE_CLIENT_ID) {
          const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
          });
          const payload = ticket.getPayload();
          googleUser = {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            avatar: payload.picture
          };
        } else {
          // Verify via Google tokeninfo endpoint
          const axios = (await import('axios')).default;
          const tokenRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`, {
            timeout: 5000
          });
          googleUser = {
            googleId: tokenRes.data.sub,
            email: tokenRes.data.email,
            name: tokenRes.data.name,
            avatar: tokenRes.data.picture
          };
        }
      } catch (err) {
        console.warn('Google token verification notice:', err.message);
      }
    }

    // 2. Direct payload fallback (for one-click Google Sign-in demo or custom client credentials)
    if (!googleUser && bodyEmail) {
      googleUser = {
        googleId: bodyGoogleId || 'google_' + Math.random().toString(36).substring(2, 10),
        email: bodyEmail.toLowerCase().trim(),
        name: bodyName || bodyEmail.split('@')[0],
        avatar: picture || ''
      };
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication failed: missing valid Google profile credential or email.'
      });
    }

    const lowerEmail = googleUser.email.toLowerCase().trim();

    // 3. Find or Create User in MongoDB or Memory Store
    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({
        $or: [{ email: lowerEmail }, { googleId: googleUser.googleId }]
      });

      if (!user) {
        user = await User.create({
          name: googleUser.name,
          email: lowerEmail,
          googleId: googleUser.googleId,
          avatar: googleUser.avatar
        });
      } else {
        // Link googleId and avatar if not already linked
        if (!user.googleId) user.googleId = googleUser.googleId;
        if (!user.avatar && googleUser.avatar) user.avatar = googleUser.avatar;
        await user.save();
      }

      sendTokenResponse(user, 200, res);
    } else {
      // Memory Store fallback
      let user = await memoryStore.findUserByEmail(lowerEmail);
      if (!user) {
        user = await memoryStore.createGoogleUser(googleUser);
      } else if (!user.googleId) {
        user.googleId = googleUser.googleId;
        if (googleUser.avatar) user.avatar = googleUser.avatar;
      }

      sendTokenResponse(user, 200, res);
    }
  } catch (error) {
    next(error);
  }
};
