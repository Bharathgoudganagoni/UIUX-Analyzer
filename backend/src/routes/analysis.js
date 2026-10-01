import express from 'express';
import { upload } from '../middleware/upload.js';
import { createAnalysis, getAnalysis } from '../controllers/analysisController.js';
import { analysisRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/analysis - Upload image and run analysis
router.post('/', analysisRateLimiter, upload.single('image'), createAnalysis);

// GET /api/analysis/:id - Get analysis by ID
router.get('/:id', getAnalysis);

export default router;
