import express from 'express';
import { body, validationResult } from 'express-validator';
import { analyzeWebsite } from '../controllers/websiteController.js';
import { analysisRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const validateUrl = [
  body('url')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Please provide a valid http or https URL'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }
    next();
  },
];

router.post('/analyze', analysisRateLimiter, validateUrl, analyzeWebsite);

export default router;
