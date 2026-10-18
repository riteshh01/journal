import { Response } from 'express';
import { MediaService } from '../services/media.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest, MediaType } from '../types/index.js';
import { UploadRequest } from '../middleware/upload.js';

export class MediaController {
  static async getMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const type = req.query.type as MediaType;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;

      const { media, total } = await MediaService.getMedia(req.user!.userId, {
        type,
        page,
        limit,
      });

      sendSuccess(res, { media }, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch media', 'MEDIA_FETCH_FAILED', 500);
    }
  }

  static async uploadMedia(req: UploadRequest & AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.validatedFile) {
        sendError(res, 'File was not provided or failed validation', 'FILE_REQUIRED', 400);
        return;
      }

      const caption = req.body.caption as string | undefined;
      const taken_on = req.body.taken_on as string | undefined;
      const journal_entry_id = req.body.journal_entry_id as string | undefined;

      const media = await MediaService.uploadMedia(req.user!.userId, req.validatedFile, {
        caption,
        taken_on,
        journal_entry_id,
      });

      sendSuccess(res, { media }, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Upload failed', 'UPLOAD_FAILED', 500);
    }
  }

  static async updateCaption(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { caption } = req.body;

      const updated = await MediaService.updateCaption(req.user!.userId, id, caption);
      if (!updated) {
        sendError(res, 'Media asset not found', 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, { media: updated });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update caption', 'CAPTION_UPDATE_FAILED', 400);
    }
  }

  static async deleteMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await MediaService.deleteMedia(req.user!.userId, id);

      if (!deleted) {
        sendError(res, 'Media asset not found', 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, { message: 'Media asset deleted successfully' });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete media asset', 'MEDIA_DELETE_FAILED', 500);
    }
  }
}
