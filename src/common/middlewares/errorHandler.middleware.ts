import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { ApiError } from '../types/api-response.types.js';
import { env } from '../../config/env.js';

export const errorHandlerMiddleware: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response<ApiError>,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  const response: ApiError = {
    success: false,
    error: {
      message,
      ...(env.env === 'development' && { details: err.stack }),
    },
  };

  res.status(statusCode).json(response);
};
