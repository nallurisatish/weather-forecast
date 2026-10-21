import express from 'express';
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../controllers/historyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getSearchHistory);
router.post('/', addSearchHistory);
router.delete('/', clearSearchHistory);

export default router;
