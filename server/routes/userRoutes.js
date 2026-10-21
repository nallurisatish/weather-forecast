import express from 'express';
import { getProfile, updateProfile, updatePreferences } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { profileValidation } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.patch('/profile', profileValidation, updateProfile);
router.patch('/preferences', updatePreferences);

export default router;
