import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { errorResponse, successResponse } from '../utils/response';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Get user details
  async getUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const user = await this.userService.getUser(userId);
      successResponse(res, user, 'User details retrieved successfully');
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        error.statusCode || 400,
        error.code || 'USER_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  // Update user details
  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { firstName, lastName } = req.body;
      const updatedUser = await this.userService.updateUser(userId, { firstName, lastName });
      successResponse(res, updatedUser, 'User details updated successfully');
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        error.statusCode || 400,
        error.code || 'USER_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }
} 