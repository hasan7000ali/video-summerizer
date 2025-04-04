import { Response } from 'express';

interface SuccessResponse {
  success: boolean;
  data: any;
  message?: string;
}

interface ErrorResponse {
  success: boolean;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

export const successResponse = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
): Response => {
  const response: SuccessResponse = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): Response => {
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(response);
}; 