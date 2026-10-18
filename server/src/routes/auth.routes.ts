import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/index.js';

const router = Router();

// Rate limited login route
router.post('/login', loginLimiter, validate(loginSchema, 'body'), AuthController.login);

// Logout
router.post('/logout', AuthController.logout);

// Token refresh
router.post('/refresh', AuthController.refresh);

// Current user profile
router.get('/me', authenticate, AuthController.me);

export default router;
