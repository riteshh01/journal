import { Response } from 'express';
import { JournalService } from '../services/journal.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../types/index.js';

export class JournalController {
  static async getEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const { entries, total } = await JournalService.getEntries(req.user!.userId, {
        from,
        to,
        page,
        limit,
      });

      sendSuccess(res, { entries }, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch journal entries', 'JOURNAL_FETCH_FAILED', 500);
    }
  }

  static async getEntryByDate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { date } = req.params;
      const entry = await JournalService.getEntryByDate(req.user!.userId, date);

      if (!entry) {
        sendError(res, `No journal entry found for date ${date}`, 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, { entry });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch entry', 'JOURNAL_FETCH_FAILED', 500);
    }
  }

  static async upsertEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { date } = req.params;
      const { title, content, mood } = req.body;

      const entry = await JournalService.upsertEntry(req.user!.userId, date, {
        title,
        content,
        mood,
      });

      sendSuccess(res, { entry }, 200);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to save journal entry', 'JOURNAL_SAVE_FAILED', 400);
    }
  }

  static async deleteEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { date } = req.params;
      const deleted = await JournalService.deleteEntryByDate(req.user!.userId, date);

      if (!deleted) {
        sendError(res, `No journal entry found for date ${date}`, 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, { message: `Journal entry for ${date} deleted successfully` });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete journal entry', 'JOURNAL_DELETE_FAILED', 500);
    }
  }

  /* ------------------------------ journal tasks ----------------------------- */

  static async addTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { date } = req.params;
      const { title } = req.body;
      const task = await JournalService.addTask(req.user!.userId, date, title);
      sendSuccess(res, { task }, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to add task', 'TASK_CREATE_FAILED', 400);
    }
  }

  static async toggleTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { is_completed } = req.body || {};
      const task = await JournalService.toggleTask(req.user!.userId, id, is_completed);

      if (!task) {
        sendError(res, 'Task not found', 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, { task });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to toggle task', 'TASK_TOGGLE_FAILED', 400);
    }
  }

  static async deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await JournalService.deleteTask(req.user!.userId, id);

      if (!deleted) {
        sendError(res, 'Task not found', 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, { message: 'Task deleted successfully' });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete task', 'TASK_DELETE_FAILED', 500);
    }
  }
}

