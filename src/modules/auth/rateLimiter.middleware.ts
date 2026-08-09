import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';

export const loginRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMin * 60 * 1000,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many login attempts, please try again later.',
    },
  },
});
