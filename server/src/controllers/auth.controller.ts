import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { errorResponse } from '../utils/response';
import { AppError } from '../utils/AppError';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;
      const result = await authService.register(email, password, firstName, lastName);
      res.status(201).json(result);
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        400,
        'REGISTRATION_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        401,
        'AUTHENTICATION_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { userId, otp } = req.body;
      const result = await authService.verifyEmail(userId, otp);
      res.json(result);
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        400,
        'VERIFICATION_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      res.json(result);
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        400,
        'PASSWORD_RESET_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await authService.resetPassword(email, otp, newPassword);
      res.json(result);
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        400,
        'PASSWORD_RESET_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'AUTHENTICATION_ERROR');
      }

      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(userId, currentPassword, newPassword);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        errorResponse(
          res,
          error.message,
          error.statusCode,
          error.code,
          process.env.NODE_ENV === 'development' ? error.details : undefined
        );
      } else {
        errorResponse(
          res,
          error.message,
          400,
          'PASSWORD_CHANGE_ERROR',
          process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
        );
      }
    }
  }
} 