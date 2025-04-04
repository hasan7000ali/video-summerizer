import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError';
import { generateToken, generateOTP, sendOTPEmail, OTPType } from '../utils/auth.utils';

const prisma = new PrismaClient();

export class AuthService {
  // Register new user
  async register(email: string, password: string, firstName?: string, lastName?: string) {
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      
      if (existingUser) {
        if (existingUser.isVerified) {
          throw new AppError('Email already registered', 400, 'REGISTRATION_ERROR');
        }

        // Delete any existing OTPs for this user
        await prisma.oTP.deleteMany({
          where: {
            userId: existingUser.id,
            type: OTPType.VERIFICATION,
          },
        });

        // Generate and send new verification OTP
        const otp = generateOTP();
        await prisma.oTP.create({
          data: {
            code: otp,
            userId: existingUser.id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            type: OTPType.VERIFICATION,
          },
        });

        await sendOTPEmail(email, otp, OTPType.VERIFICATION);

        return { message: 'Verification OTP resent. Please check your email.' };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
        },
      });

      // Generate and send verification OTP
      const otp = generateOTP();
      await prisma.oTP.create({
        data: {
          code: otp,
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          type: OTPType.VERIFICATION,
        },
      });

      await sendOTPEmail(email, otp, OTPType.VERIFICATION);

      return { message: 'Registration successful. Please check your email for verification OTP.' };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Registration failed',
        500,
        'REGISTRATION_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Login user
  async login(email: string, password: string) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        throw new AppError('Invalid credentials', 401, 'AUTHENTICATION_ERROR');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401, 'AUTHENTICATION_ERROR');
      }

      if (!user.isVerified) {
        throw new AppError('Please verify your email first', 401, 'EMAIL_VERIFICATION_REQUIRED');
      }

      const token = generateToken(user.id);
      return { token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Login failed',
        500,
        'AUTHENTICATION_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Verify email with OTP
  async verifyEmail(email: string, otp: string) {
    try {
      // Validate OTP format
      if (!/^\d{6}$/.test(otp)) {
        throw new AppError('Invalid OTP format', 400, 'VERIFICATION_ERROR');
      }

      const user = await prisma.user.findUnique({ 
        where: { email } 
      });
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const userOTP = await prisma.oTP.findFirst({
        where: {
          userId: user.id,
          code: otp,
          type: OTPType.VERIFICATION,
          expiresAt: { gt: new Date() },
        },
      });

      if (!userOTP) {
        throw new AppError('Invalid or expired OTP', 400, 'VERIFICATION_ERROR');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });

      await prisma.oTP.delete({ where: { id: userOTP.id } });

      return { 
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Email verification failed',
        500,
        'VERIFICATION_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Request password reset
  async requestPasswordReset(email: string) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const otp = generateOTP();
      await prisma.oTP.create({
        data: {
          code: otp,
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          type: OTPType.PASSWORD_RESET,
        },
      });

      await sendOTPEmail(email, otp, OTPType.PASSWORD_RESET);

      return { message: 'Password reset OTP sent to your email' };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Password reset request failed',
        500,
        'PASSWORD_RESET_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Reset password with OTP
  async resetPassword(email: string, otp: string, newPassword: string) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const userOTP = await prisma.oTP.findFirst({
        where: {
          userId: user.id,
          code: otp,
          type: OTPType.PASSWORD_RESET,
          expiresAt: { gt: new Date() },
        },
      });

      if (!userOTP) {
        throw new AppError('Invalid or expired OTP', 400, 'PASSWORD_RESET_ERROR');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      await prisma.oTP.delete({ where: { id: userOTP.id } });

      return { message: 'Password reset successful' };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Password reset failed',
        500,
        'PASSWORD_RESET_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Change password (requires current password)
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new AppError('Current password is incorrect', 400, 'PASSWORD_ERROR');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { message: 'Password changed successfully' };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Password change failed',
        500,
        'PASSWORD_CHANGE_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }
} 