import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (res.headersSent) {
    return;
  }

  // Handle Multer upload errors
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File size limit exceeded', 'FILE_TOO_LARGE', 400);
      return;
    }
    sendError(res, `Upload error: ${err.message}`, 'UPLOAD_ERROR', 400);
    return;
  }

  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    sendError(res, 'Malformed JSON payload in request body', 'INVALID_JSON', 400);
    return;
  }

  // Log error in development or server console
  if (env.NODE_ENV !== 'production') {
    console.error('Unhandled server error:', err);
  } else {
    // Only log essential metadata in production, never sensitive bodies
    console.error(`Internal server error: ${err.message || 'Unknown error'}`);
  }

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal error occurred'
      : err.message || 'Internal server error';

  sendError(res, message, 'INTERNAL_SERVER_ERROR', 500);
};
