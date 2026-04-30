import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operación exitosa',
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: [],
  } satisfies ApiResponse<T>);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors: string[] = []
): void {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
  } satisfies ApiResponse<null>);
}
