import { Response } from 'express';
import { GoalsService } from '../services/goals.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest, GoalStatus } from '../types/index.js';

export class GoalsController {
  static async getGoals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const status = req.query.status as GoalStatus | undefined;
      const category = req.query.category as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const { goals, total } = await GoalsService.getGoals(req.user!.userId, {
        status,
        category,
        page,
        limit,
      });

      sendSuccess(res, { goals }, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch goals', 'GOALS_FETCH_FAILED', 500);
    }
  }

  static async createGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const goal = await GoalsService.createGoal(req.user!.userId, req.body);
      sendSuccess(res, { goal }, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to create goal', 'GOAL_CREATE_FAILED', 400);
    }
  }

  static async updateGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await GoalsService.updateGoal(req.user!.userId, id, req.body);

      if (!updated) {
        sendError(res, 'Goal not found', 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, { goal: updated });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update goal', 'GOAL_UPDATE_FAILED', 400);
    }
  }

  static async deleteGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await GoalsService.deleteGoal(req.user!.userId, id);

      if (!deleted) {
        sendError(res, 'Goal not found', 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, { message: 'Goal deleted successfully' });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete goal', 'GOAL_DELETE_FAILED', 500);
    }
  }
}
