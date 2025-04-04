import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
}

export class UserService {
  // Get user details
  async getUser(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return user;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to get user details',
        500,
        'USER_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Update user details
  async updateUser(userId: string, data: UpdateUserData) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName !== undefined ? data.firstName : user.firstName,
          lastName: data.lastName !== undefined ? data.lastName : user.lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to update user details',
        500,
        'USER_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }
} 