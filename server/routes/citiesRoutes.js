import express from 'express';
import { getSavedCities, addSavedCity, deleteSavedCity } from '../controllers/citiesController.js';
import { protect } from '../middleware/auth.js';
import { cityValidation } from '../middleware/validation.js';

const router = express.Router();

// All saved cities routes are protected
router.use(protect);

router.get('/', getSavedCities);
router.post('/', cityValidation, addSavedCity);
router.delete('/:id', deleteSavedCity);

export default router;
