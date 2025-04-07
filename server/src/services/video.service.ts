import { PrismaClient, VideoStatus } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { 
  generateFileKey, 
  generateUploadUrl, 
  generateDownloadUrl, 
  deleteS3Object,
  checkObjectExists,
  getFileSize
} from '../utils/s3.utils';
import Logger from '../utils/logger';

const prisma = new PrismaClient();

interface CreateVideoData {
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  description?: string;
}

interface UpdateVideoData {
  title?: string;
  description?: string;
  isPublic?: boolean;
}

export class VideoService {
  // Create a new video entry and generate upload URL
  async createVideo(userId: string, data: CreateVideoData) {
    try {
      // Generate a unique S3 file key
      const fileKey = generateFileKey(data.fileName);

      // Create a new video record in the database
      const video = await prisma.video.create({
        data: {
          title: data.title,
          description: data.description,
          fileName: data.fileName,
          fileKey,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          status: VideoStatus.PENDING,
          userId,
        },
      });

      // Generate a presigned upload URL
      const uploadUrl = await generateUploadUrl(fileKey, data.mimeType);

      return {
        video,
        uploadUrl,
      };
    } catch (error: any) {
      Logger.error('Error creating video:', error);
      throw new AppError(
        'Failed to create video',
        500,
        'VIDEO_CREATE_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Get a single video by ID
  async getVideo(userId: string, videoId: string) {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { summary: true },
      });

      if (!video) {
        throw new AppError('Video not found', 404, 'VIDEO_NOT_FOUND');
      }

      // Check if the user is authorized to access this video
      if (video.userId !== userId && !video.isPublic) {
        throw new AppError('Unauthorized access to video', 403, 'UNAUTHORIZED_ACCESS');
      }

      // Generate a presigned download URL if the video is ready
      if (video.status === VideoStatus.READY) {
        video.fileUrl = await generateDownloadUrl(video.fileKey);
      }

      return video;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error getting video:', error);
      throw new AppError(
        'Failed to get video',
        500,
        'VIDEO_FETCH_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Get all videos for a user
  async getUserVideos(userId: string) {
    try {
      const videos = await prisma.video.findMany({
        where: { 
          userId,
          status: {
            not: VideoStatus.DELETED
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Don't generate presigned URLs for list views (performance)
      return videos;
    } catch (error: any) {
      Logger.error('Error getting user videos:', error);
      throw new AppError(
        'Failed to get videos',
        500,
        'VIDEOS_FETCH_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Update a video
  async updateVideo(userId: string, videoId: string, data: UpdateVideoData) {
    try {
      // Check if the video exists and belongs to the user
      const existingVideo = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!existingVideo) {
        throw new AppError('Video not found', 404, 'VIDEO_NOT_FOUND');
      }

      if (existingVideo.userId !== userId) {
        throw new AppError('Unauthorized to update this video', 403, 'UNAUTHORIZED_ACCESS');
      }

      // Update the video
      const updatedVideo = await prisma.video.update({
        where: { id: videoId },
        data: {
          title: data.title,
          description: data.description,
          isPublic: data.isPublic,
          updatedAt: new Date(),
        },
        include: { summary: true },
      });

      return updatedVideo;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error updating video:', error);
      throw new AppError(
        'Failed to update video',
        500,
        'VIDEO_UPDATE_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Delete a video
  async deleteVideo(userId: string, videoId: string) {
    try {
      // Check if the video exists and belongs to the user
      const existingVideo = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!existingVideo) {
        throw new AppError('Video not found', 404, 'VIDEO_NOT_FOUND');
      }

      if (existingVideo.userId !== userId) {
        throw new AppError('Unauthorized to delete this video', 403, 'UNAUTHORIZED_ACCESS');
      }

      // Soft delete - mark as deleted
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: VideoStatus.DELETED,
          updatedAt: new Date(),
        },
      });

      // Delete from S3 as well
      try {
        await deleteS3Object(existingVideo.fileKey);
      } catch (s3Error) {
        // Log but don't fail the operation if S3 deletion fails
        Logger.error('Error deleting from S3, continuing with DB deletion:', s3Error);
      }

      return { success: true };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error deleting video:', error);
      throw new AppError(
        'Failed to delete video',
        500,
        'VIDEO_DELETE_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Confirm upload complete and update status
  async confirmUpload(userId: string, videoId: string) {
    try {
      // Check if the video exists and belongs to the user
      const existingVideo = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!existingVideo) {
        throw new AppError('Video not found', 404, 'VIDEO_NOT_FOUND');
      }

      if (existingVideo.userId !== userId) {
        throw new AppError('Unauthorized to update this video', 403, 'UNAUTHORIZED_ACCESS');
      }

      // Verify the file exists in S3
      const exists = await checkObjectExists(existingVideo.fileKey);
      if (!exists) {
        throw new AppError('Video file not found in storage', 404, 'S3_FILE_NOT_FOUND');
      }

      // Update file size if needed
      let fileSize = existingVideo.fileSize;
      try {
        fileSize = await getFileSize(existingVideo.fileKey);
      } catch (sizeError) {
        Logger.warn('Could not retrieve file size from S3:', sizeError);
      }

      // Update video status to ready
      const updatedVideo = await prisma.video.update({
        where: { id: videoId },
        data: {
          status: VideoStatus.READY,
          fileSize,
          updatedAt: new Date(),
        },
      });

      // Generate a download URL for the client
      const fileUrl = await generateDownloadUrl(existingVideo.fileKey);

      return {
        ...updatedVideo,
        fileUrl,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error confirming upload:', error);
      throw new AppError(
        'Failed to confirm upload',
        500,
        'UPLOAD_CONFIRM_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }

  // Get a presigned upload URL for an existing video
  async getUploadUrl(userId: string, videoId: string) {
    try {
      // Check if the video exists and belongs to the user
      const existingVideo = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!existingVideo) {
        throw new AppError('Video not found', 404, 'VIDEO_NOT_FOUND');
      }

      if (existingVideo.userId !== userId) {
        throw new AppError('Unauthorized to update this video', 403, 'UNAUTHORIZED_ACCESS');
      }

      // Update status to uploading
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: VideoStatus.UPLOADING,
          updatedAt: new Date(),
        },
      });

      // Generate a new upload URL
      const uploadUrl = await generateUploadUrl(existingVideo.fileKey, existingVideo.mimeType);

      return {
        uploadUrl,
        fileKey: existingVideo.fileKey,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error getting upload URL:', error);
      throw new AppError(
        'Failed to get upload URL',
        500,
        'UPLOAD_URL_ERROR',
        process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
      );
    }
  }
} 