import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';

export interface JwtPayload {
  sub: number;
  roles: string[];
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de acceso requerido');
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('Token inválido o expirado');
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();

    const hasRole = roles.some((r) => req.user!.roles.includes(r));
    if (!hasRole) throw new ForbiddenError();

    next();
  };
}
