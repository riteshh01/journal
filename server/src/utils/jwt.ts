import jwt from 'jsonwebtoken';
import { Response, CookieOptions } from 'express';
import { env } from '../config/env.js';
import { AuthTokenPayload } from '../types/index.js';

export const ACCESS_TOKEN_COOKIE = 'journal_access_token';
export const REFRESH_TOKEN_COOKIE = 'journal_refresh_token';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

const isProduction = env.NODE_ENV === 'production';

export const getCookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax', // 'lax' permits same-site localhost requests across ports 3000 and 5000 while staying protected against CSRF
  path: '/',
  maxAge: maxAgeMs,
});

export const generateAccessToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

export const generateRefreshToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string): AuthTokenPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): AuthTokenPayload | null => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
};

export const setAuthCookies = (res: Response, payload: AuthTokenPayload): void => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // 15 minutes in ms
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, getCookieOptions(15 * 60 * 1000));
  // 7 days in ms
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
};
