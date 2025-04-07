import { Router } from 'express';
import { VideoController } from '../controllers/video.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createVideoSchema,
  updateVideoSchema,
  getVideoSchema,
  getUploadUrlSchema,
  confirmUploadSchema,
} from '../schemas/video.schema';

const router = Router();
const videoController = new VideoController();

// All video routes require authentication
router.use(authMiddleware);

// Create a new video (generates upload URL)
router.post('/', validate(createVideoSchema), videoController.createVideo);

// Get all user videos
router.get('/', videoController.getUserVideos);

// Get a single video by ID
router.get('/:id', validate(getVideoSchema), videoController.getVideo);

// Update video details
router.patch('/:id', validate(updateVideoSchema), videoController.updateVideo);

// Delete a video
router.delete('/:id', validate(getVideoSchema), videoController.deleteVideo);

// Get a presigned upload URL (for retrying uploads)
router.get('/:id/upload-url', validate(getUploadUrlSchema), videoController.getUploadUrl);

// Confirm upload completion
router.post('/:id/confirm', validate(confirmUploadSchema), videoController.confirmUpload);

export default router; 