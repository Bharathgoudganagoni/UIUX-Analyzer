import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'UI/UX Analyzer Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    aiService: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  });
});

export default router;
