import express from 'express';
import { register, login, logout, getMe, googleLogin } from '../controllers/authController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/google', googleLogin);
router.post('/logout', logout);
router.get('/me', optionalAuth, getMe);

export default router;
