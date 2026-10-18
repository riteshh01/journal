import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import { env, envValidationError } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendError } from './utils/response.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import journalRoutes from './routes/journal.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import mediaRoutes from './routes/media.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import codingRoutes from './routes/coding.routes.js';
import { AuthService } from './services/auth.service.js';

// Sync configured environment seed credentials if present
AuthService.syncSeedUser().catch((err) => console.error('[Startup] Failed to sync seed user:', err));

const app = express();

// Disable x-powered-by header
app.disable('x-powered-by');

// Force HTTPS & HSTS in production
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      next();
    } else {
      res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  });
}

// Helmet with Content-Security-Policy (with ESM/CJS interop for TypeScript 5.9+)
const helmetMiddleware = ((helmet as any)?.default || helmet) as (options?: any) => any;

app.use(
  helmetMiddleware({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        mediaSrc: ["'self'", 'https://res.cloudinary.com'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);


// Strict CORS setup
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Journal-CSRF'],
  })
);

// Global rate limiting
app.use(globalLimiter);

// Cookie parsing
const cookieParserMiddleware = ((cookieParser as any)?.default || cookieParser) as (options?: any) => any;
app.use(cookieParserMiddleware());

// Limit JSON payload size to 100kb
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Prevent HTTP Parameter Pollution
const hppMiddleware = ((hpp as any)?.default || hpp) as (options?: any) => any;
app.use(hppMiddleware());

// CSRF Defense for state-changing operations via custom header verification
app.use((req: Request, res: Response, next: NextFunction): void => {
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  // Exempt public login route or verify header universally
  if (isStateChanging) {
    const customHeader = req.headers['x-requested-with'] || req.headers['x-journal-csrf'];
    if (!customHeader) {
      sendError(res, 'CSRF header verification failed. Custom header missing.', 'CSRF_BLOCKED', 403);
      return;
    }
  }
  next();
});

// Root server status endpoints
app.get('/', (_req: Request, res: Response) => {
  if (envValidationError) {
    const missingKeys = Object.keys(envValidationError).filter((k) => k !== '_errors');
    res.status(200).send(`Server is running (Warning: missing environment variables in Vercel: ${missingKeys.join(', ')})`);
    return;
  }
  res.status(200).send('Server is running');
});

app.get('/api', (_req: Request, res: Response) => {
  if (envValidationError) {
    const missingKeys = Object.keys(envValidationError).filter((k) => k !== '_errors');
    res.status(200).send(`Server is running (Warning: missing environment variables in Vercel: ${missingKeys.join(', ')})`);
    return;
  }
  res.status(200).send('Server is running');
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: envValidationError ? 'warning' : 'ok',
    message: 'Server is running',
    environmentValidation: envValidationError || 'passed',
    timestamp: new Date().toISOString(),
  });
});



// Mount application API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/coding', codingRoutes);

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  sendError(res, 'Requested API route was not found', 'ROUTE_NOT_FOUND', 404);
});

// Central error handler
app.use(errorHandler);

export default app;
