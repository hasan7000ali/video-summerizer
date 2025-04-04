import nodemailer from 'nodemailer';
import { AppError } from './AppError';
import Logger from './logger';

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

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Check if email mocking is enabled
  const useMockEmail = process.env.USE_EMAIL_MOCK && process.env.USE_EMAIL_MOCK === 'true';

  try {
    if (useMockEmail) {
      // Log the email data instead of sending
      Logger.info('MOCK EMAIL SENT', {
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        timestamp: new Date().toISOString(),
        mock: true
      });
      return;
    }

    // Actually send the email if mocking is disabled
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  } catch (error: any) {
    throw new AppError(
      'Failed to send email',
      500,
      'EMAIL_ERROR',
      process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
    );
  }
}; 