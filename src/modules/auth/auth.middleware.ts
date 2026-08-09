import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../common/errors/index.js';
import { env } from '../../config/env.js';

interface JwtPayload {
  id: number;
  email: string;
  name: string;
}

export const verifyJwt = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access token is missing or invalid'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
    return next();
  } catch (_error) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};
