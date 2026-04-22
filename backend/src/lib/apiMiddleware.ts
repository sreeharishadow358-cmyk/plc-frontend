import type { Request, Response } from 'express';

export function validateApiRequest(req: Request): { valid: boolean; message?: string } {
  if (!req.is('application/json')) {
    return {
      valid: false,
      message: 'Invalid Content-Type. Must be application/json.',
    };
  }

  if (!req.body || typeof req.body !== 'object') {
    return {
      valid: false,
      message: 'Request body is required and must be a JSON object.',
    };
  }

  return { valid: true };
}

export function errorResponse(res: Response, message: string, status: number) {
  return res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
  });
}

export function successResponse<T>(res: Response, data: T) {
  return res.status(200).json(data);
}
