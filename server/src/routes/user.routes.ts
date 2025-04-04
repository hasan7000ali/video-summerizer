import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updateUserSchema } from '../schemas/user.schema';

const router = Router();
const userController = new UserController();

// Protected routes
router.get('/', authMiddleware, userController.getUser);
router.patch('/', authMiddleware, validate(updateUserSchema), userController.updateUser);

export default router; 