import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: ApiResponse<T>['pagination']
): Response => {
  const responsePayload: ApiResponse<T> = { data };
  if (pagination) {
    responsePayload.pagination = pagination;
  }
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message: string,
  code = 'ERROR',
  statusCode = 400,
  details?: any
): Response => {
  const responsePayload: ApiResponse = {
    error: {
      message,
      code,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(responsePayload);
};
