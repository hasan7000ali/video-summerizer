import jwt from 'jsonwebtoken';
import { AppError } from './AppError';
import { sendEmail } from './email.utils';

const JWT_SECRET = process.env.JWT_SECRET;

export enum OTPType {
  VERIFICATION = 'VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET'
}

// Generate JWT token
export const generateToken = (userId: string): string => {
  if (!JWT_SECRET) {
    throw new AppError('JWT secret is not defined', 500, 'JWT_ERROR');
  }
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Generate OTP
export const generateOTP = (): string => {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Double-check the format
  if (!/^\d{6}$/.test(otp)) {
    throw new AppError('Failed to generate valid OTP', 500, 'OTP_ERROR');
  }
  
  return otp;
};

// Send OTP email
export const sendOTPEmail = async (email: string, otp: string, type: OTPType): Promise<void> => {
  try {
    const subject = type === OTPType.VERIFICATION 
      ? 'Email Verification OTP' 
      : 'Password Reset OTP';

    const text = `Your OTP is: ${otp}. This OTP will expire in 10 minutes.`;

    await sendEmail({
      to: email,
      subject,
      text,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Failed to send OTP email',
      500,
      'EMAIL_ERROR',
      process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
    );
  }
}; 