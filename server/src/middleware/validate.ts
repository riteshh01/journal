import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export const validate = (
  schema: ZodSchema,
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        sendError(res, 'Validation failed: ' + issues.map((i) => i.message).join(', '), 'VALIDATION_ERROR', 400, issues);
        return;
      }
      sendError(res, 'Invalid request input', 'INVALID_INPUT', 400);
    }
  };
};
