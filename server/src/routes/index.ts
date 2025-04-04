import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/user', userRoutes);

export default router; 