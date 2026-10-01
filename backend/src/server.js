// AI UI/UX Critic & Redesign Studio - Backend API Server
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';

dotenv.config();

import analysisRoutes from './routes/analysis.js';
import redesignRoutes from './routes/redesign.js';
import projectRoutes from './routes/projects.js';
import codeGenRoutes from './routes/codeGen.js';
import websiteRoutes from './routes/website.js';
import healthRoutes from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// Security Middleware
// =====================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

// =====================================================
// CORS Configuration
// =====================================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (Postman, server-to-server requests, same-origin, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) ||
        (process.env.VERCEL_URL && origin === `https://${process.env.VERCEL_URL}`) ||
        origin.endsWith('.vercel.app') ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS policy: Origin ${origin} is not allowed`)
      );
    },

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-id',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],

    credentials: true,

    optionsSuccessStatus: 204,
  })
);

// =====================================================
// Request Logging
// =====================================================

app.use(
  morgan('combined', {
    stream: {
      write: (msg) => logger.info(msg.trim()),
    },
  })
);

// =====================================================
// Body Parsing
// =====================================================

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// =====================================================
// Rate Limiting
// =====================================================

app.use('/api/', rateLimiter);

// =====================================================
// Static File Serving for Uploads
// =====================================================

const isVercel = Boolean(process.env.VERCEL);
const uploadsDir = isVercel ? '/tmp/uploads' : join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (_) {}

app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader(
        'Cross-Origin-Resource-Policy',
        'cross-origin'
      );
    },
  })
);

// =====================================================
// API Routes
// =====================================================

app.use('/api/health', healthRoutes);

app.use('/api/analysis', analysisRoutes);

app.use('/api/redesign', redesignRoutes);

app.use('/api/projects', projectRoutes);

app.use('/api/code-generation', codeGenRoutes);

app.use('/api/website', websiteRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

app.use(errorHandler);

const server = createServer(app);

if (!process.env.VERCEL || process.env.PORT) {
  server.listen(PORT, () => {
    logger.info(
      `🚀 Backend server running on http://localhost:${PORT}`
    );

    logger.info(
      `📊 Environment: ${process.env.NODE_ENV || 'development'}`
    );

    logger.info(
      `🤖 AI Service: ${
        process.env.AI_SERVICE_URL || 'http://localhost:8000'
      }`
    );
  });
}

export default app;