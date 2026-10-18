import { Request, Response } from 'express';
import { CodingService, CodingPlatform } from '../services/coding.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class CodingController {
  static async fetchProfile(req: Request, res: Response): Promise<void> {
    try {
      const platform = req.query.platform as CodingPlatform;
      const username = req.query.username as string;

      if (!platform || !username) {
        sendError(res, 'Both platform and username are required', 'MISSING_PARAMS', 400);
        return;
      }

      const profile = await CodingService.fetchPlatformProfile(platform, username);
      sendSuccess(res, { profile });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch platform profile', 'FETCH_FAILED', 500);
    }
  }

  static async aggregateProfiles(req: Request, res: Response): Promise<void> {
    try {
      const profiles = req.body.profiles as { platform: CodingPlatform; username: string }[];
      if (!Array.isArray(profiles)) {
        sendError(res, 'Profiles array is required in request body', 'INVALID_BODY', 400);
        return;
      }

      const aggregated = await CodingService.aggregateProfiles(profiles);
      sendSuccess(res, aggregated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to aggregate profiles', 'AGGREGATION_FAILED', 500);
    }
  }
}
