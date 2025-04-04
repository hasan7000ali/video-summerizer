import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OTPType } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export class AuthService {
  // Generate JWT token
  private generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
  }

  // Generate OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email
  private async sendOTPEmail(email: string, otp: string, type: OTPType): Promise<void> {
    const subject = type === OTPType.VERIFICATION 
      ? 'Email Verification OTP' 
      : 'Password Reset OTP';

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      text: `Your OTP is: ${otp}. This OTP will expire in 10 minutes.`,
    });
  }

  // Register new user
  async register(email: string, password: string, firstName?: string, lastName?: string) {
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
    const otp = this.generateOTP();
    await prisma.oTP.create({
      data: {
        code: otp,
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        type: OTPType.VERIFICATION,
      },
    });

    await this.sendOTPEmail(email, otp, OTPType.VERIFICATION);

    return { message: 'Registration successful. Please check your email for verification OTP.' };
  }

  // Login user
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email first');
    }

    const token = this.generateToken(user.id);
    return { token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } };
  }

  // Verify email with OTP
  async verifyEmail(userId: string, otp: string) {
    const userOTP = await prisma.oTP.findFirst({
      where: {
        userId,
        code: otp,
        type: OTPType.VERIFICATION,
        expiresAt: { gt: new Date() },
      },
    });

    if (!userOTP) {
      throw new Error('Invalid or expired OTP');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    await prisma.oTP.delete({ where: { id: userOTP.id } });

    return { message: 'Email verified successfully' };
  }

  // Request password reset
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error('User not found');
    }

    const otp = this.generateOTP();
    await prisma.oTP.create({
      data: {
        code: otp,
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        type: OTPType.PASSWORD_RESET,
      },
    });

    await this.sendOTPEmail(email, otp, OTPType.PASSWORD_RESET);

    return { message: 'Password reset OTP sent to your email' };
  }

  // Reset password with OTP
  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error('User not found');
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
      throw new Error('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.oTP.delete({ where: { id: userOTP.id } });

    return { message: 'Password reset successful' };
  }

  // Change password (requires current password)
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }
} 