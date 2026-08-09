import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/index.js';

export const notFoundRouteMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
};
