import { Router } from 'express';
import Logger from '../utils/logger';
import { successResponse } from '../utils/response';

const router = Router();

router.get('/health', (req, res) => {
  Logger.info('Health check endpoint called');
  successResponse(res, { status: 'ok' }, 'Server is healthy');
});

export default router; 