import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { setAuthCookies, clearAuthCookies, verifyRefreshToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../types/index.js';
import { REFRESH_TOKEN_COOKIE } from '../utils/jwt.js';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await AuthService.login(email, password);

      setAuthCookies(res, {
        userId: user.id,
        email: user.email,
      });

      sendSuccess(res, { user });
    } catch (error: any) {
      // Generic invalid credentials message
      sendError(res, 'Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    clearAuthCookies(res);
    sendSuccess(res, { message: 'Logged out successfully' });
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 'UNAUTHORIZED', 401);
        return;
      }

      const user = await AuthService.getUserById(req.user.userId);
      if (!user) {
        sendError(res, 'User not found', 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, { user });
    } catch (error: any) {
      sendError(res, 'Failed to fetch current user', 'INTERNAL_ERROR', 500);
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      sendError(res, 'Refresh token missing', 'UNAUTHORIZED', 401);
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      sendError(res, 'Invalid or expired refresh token', 'UNAUTHORIZED', 401);
      return;
    }

    setAuthCookies(res, {
      userId: payload.userId,
      email: payload.email,
    });

    sendSuccess(res, { message: 'Session refreshed' });
  }
}
