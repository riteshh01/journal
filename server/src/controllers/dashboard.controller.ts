import { Response } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../types/index.js';

export class DashboardController {
  static async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const summary = await DashboardService.getSummary(req.user!.userId);
      sendSuccess(res, summary);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to aggregate dashboard summary', 'DASHBOARD_ERROR', 500);
    }
  }
}
