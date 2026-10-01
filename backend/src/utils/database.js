import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

let prisma;
let isConnected = false;
let isConnecting = false;

export function getPrismaClient() {
  if (!prisma && !isConnecting) {
    isConnecting = true;
    prisma = new PrismaClient({
      log: ['error'],
    });

    prisma
      .$connect()
      .then(() => {
        isConnected = true;
        isConnecting = false;
        logger.info('✅ Database connected via Prisma');
      })
      .catch((err) => {
        isConnected = false;
        isConnecting = false;
        logger.warn(`⚠️  Database unavailable: ${err.message}. Using persistent JSON store fallback.`);
      });
  }
  return isConnected ? prisma : null;
}

export function isDatabaseAvailable() {
  return isConnected;
}

export { prisma };
