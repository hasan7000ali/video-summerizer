import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import videoRoutes from './video.routes';
import { AppError } from '../utils/AppError';
import { errorResponse } from '../utils/response';

const router = Router();

// API Documentation
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Welcome to AI Video Summary API',
      data: {
        version: process.env.API_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
          auth: {
            base: '/api/auth',
            endpoints: [
              { method: 'POST', path: '/register', description: 'Register a new user' },
              { method: 'POST', path: '/login', description: 'Login user' },
              { method: 'POST', path: '/verify-email', description: 'Verify user email' },
              { method: 'POST', path: '/request-password-reset', description: 'Request password reset' },
              { method: 'POST', path: '/reset-password', description: 'Reset password' },
              { method: 'POST', path: '/change-password', description: 'Change password (protected)' },
            ],
          },
          user: {
            base: '/api/user',
            endpoints: [
              { method: 'GET', path: '/me', description: 'Get current user details (protected)' },
              { method: 'PATCH', path: '/me', description: 'Update current user details (protected)' },
            ],
          },
          video: {
            base: '/api/videos',
            endpoints: [
              { method: 'POST', path: '/', description: 'Create a new video entry and get upload URL' },
              { method: 'GET', path: '/', description: 'Get all videos for the current user' },
              { method: 'GET', path: '/:id', description: 'Get a single video by ID' },
              { method: 'PATCH', path: '/:id', description: 'Update video details' },
              { method: 'DELETE', path: '/:id', description: 'Delete a video' },
              { method: 'GET', path: '/:id/upload-url', description: 'Get a presigned upload URL for retrying uploads' },
              { method: 'POST', path: '/:id/confirm', description: 'Confirm upload completion' },
            ],
          },
        },
        documentation: process.env.API_DOCS_URL || 'https://github.com/yourusername/ai-vidsum/blob/main/README.md',
      },
    });
  } catch (error: any) {
    errorResponse(
      res,
      'Failed to load API documentation',
      500,
      'API_ERROR',
      process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
    );
  }
});

// API Routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/videos', videoRoutes);

// 404 Handler
router.use('*', (req, res) => {
  errorResponse(
    res,
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
});

export default router; 