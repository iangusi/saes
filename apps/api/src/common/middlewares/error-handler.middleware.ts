import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { sendError } from '../utils/response';
import { env } from '../../config/env';

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    sendError(res, 'Error de validación', 422, errors);
    return;
  }

  if (env.NODE_ENV !== 'production') {
    console.error(err);
  }

  sendError(res, 'Error interno del servidor', 500);
}
