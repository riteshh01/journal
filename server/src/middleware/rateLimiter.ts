import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests, please try again later.', 'RATE_LIMITED', 429);
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed logins towards lockout
  handler: (_req, res) => {
    sendError(res, 'Too many failed login attempts. Please try again in 15 minutes.', 'LOGIN_RATE_LIMITED', 429);
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Upload limit reached. Please wait a few minutes before uploading more media.', 'UPLOAD_RATE_LIMITED', 429);
  },
});
