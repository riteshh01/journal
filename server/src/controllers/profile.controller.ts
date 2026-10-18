import { Response } from 'express';
import { ProfileService } from '../services/profile.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../types/index.js';

export class ProfileController {
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const profile = await ProfileService.getProfile(req.user!.userId);
      sendSuccess(res, { profile });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch profile', 'PROFILE_FETCH_FAILED', 400);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await ProfileService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, { profile: updated });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update profile', 'PROFILE_UPDATE_FAILED', 400);
    }
  }
}
