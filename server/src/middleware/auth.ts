import { Response, NextFunction } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
} from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../types/index.js';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  let token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = payload;
      return next();
    }
  }

  // Fallback to refresh token if access token is expired or absent
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (refreshToken) {
    const refreshPayload = verifyRefreshToken(refreshToken);
    if (refreshPayload) {
      const userPayload = {
        userId: refreshPayload.userId,
        email: refreshPayload.email,
      };
      // Issue new access and refresh cookies
      setAuthCookies(res, userPayload);
      req.user = userPayload;
      return next();
    }
  }

  sendError(res, 'Authentication required or session expired', 'UNAUTHORIZED', 401);
};
