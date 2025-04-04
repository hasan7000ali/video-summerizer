import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

// API Documentation
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AI Video Summary API',
    version: '1.0.0',
  });
});

// API Routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);

export default router; 