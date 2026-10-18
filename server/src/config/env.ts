import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env relative to server root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  SEED_USER_EMAIL: z.string().optional().or(z.literal('')),
  SEED_USER_PASSWORD: z.string().optional().or(z.literal('')),
  SEED_USER_NAME: z.string().optional().or(z.literal('')),
});

const parsedEnv = envSchema.safeParse(process.env);

let envData: z.infer<typeof envSchema>;

if (!parsedEnv.success) {
  const errorDetails = JSON.stringify(parsedEnv.error.format(), null, 2);
  console.error('Environment validation error:', errorDetails);

  if (process.env.VERCEL !== '1') {
    process.exit(1);
  }

  // Fallback structure on Vercel so Express can initialize and report the exact missing variables
  envData = {
    NODE_ENV: (process.env.NODE_ENV as any) || 'production',
    PORT: Number(process.env.PORT) || 5001,
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'temporary_jwt_secret_32chars_long_placeholder!',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'temporary_refresh_secret_32chars_long_placeholder!',
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    SEED_USER_EMAIL: process.env.SEED_USER_EMAIL,
    SEED_USER_PASSWORD: process.env.SEED_USER_PASSWORD,
    SEED_USER_NAME: process.env.SEED_USER_NAME,
  };
} else {
  envData = parsedEnv.data;
}

export const env = envData;
export const envValidationError = parsedEnv.success ? null : parsedEnv.error.format();

