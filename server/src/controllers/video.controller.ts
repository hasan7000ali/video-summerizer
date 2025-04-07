import { Request, Response } from 'express';
import { VideoService } from '../services/video.service';
import { errorResponse, successResponse } from '../utils/response';

export class VideoController {
  private videoService: VideoService;

  constructor() {
    this.videoService = new VideoService();
    
    // Bind methods to this instance
    this.createVideo = this.createVideo.bind(this);
    this.getVideo = this.getVideo.bind(this);
    this.getUserVideos = this.getUserVideos.bind(this);
    this.updateVideo = this.updateVideo.bind(this);
    this.deleteVideo = this.deleteVideo.bind(this);
    this.getUploadUrl = this.getUploadUrl.bind(this);
    this.confirmUpload = this.confirmUpload.bind(this);
  }

  // Create a new video upload request
  async createVideo(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { title, description, fileName, fileSize, mimeType } = req.body;
      const result = await this.videoService.createVideo(userId, {
        title,
        description,
        fileName,
        fileSize,
        mimeType,
      });

      successResponse(res, result, 'Video created successfully. Ready for upload.');
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        error.statusCode || 400,
        error.code || 'VIDEO_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  // Get a video by ID
  async getVideo(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const video = await this.videoService.getVideo(userId, id);

      successResponse(res, video, 'Video retrieved successfully');
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        error.statusCode || 400,
        error.code || 'VIDEO_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  // Get all videos for current user
  async getUserVideos(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const videos = await this.videoService.getUserVideos(userId);

      successResponse(res, videos, 'Videos retrieved successfully');
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        error.statusCode || 400,
        error.code || 'VIDEO_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  // Update a video
  async updateVideo(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { title, description, isPublic } = req.body;
      
      const updatedVideo = await this.videoService.updateVideo(userId, id, {
        title,
        description,
        isPublic,
      });

      successResponse(res, updatedVideo, 'Video updated successfully');
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        error.statusCode || 400,
        error.code || 'VIDEO_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  // Delete a video
  async deleteVideo(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      await this.videoService.deleteVideo(userId, id);

      successResponse(res, { id }, 'Video deleted successfully');
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        error.statusCode || 400,
        error.code || 'VIDEO_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  // Get a presigned upload URL for an existing video
  async getUploadUrl(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const result = await this.videoService.getUploadUrl(userId, id);

      successResponse(res, result, 'Upload URL generated successfully');
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        error.statusCode || 400,
        error.code || 'VIDEO_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  // Confirm upload completion
  async confirmUpload(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const result = await this.videoService.confirmUpload(userId, id);

      successResponse(res, result, 'Upload confirmed successfully');
    } catch (error: any) {
      errorResponse(
        res,
        error.message,
        error.statusCode || 400,
        error.code || 'VIDEO_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }
} 