import { z } from 'zod';

// Schema for creating a new video upload request
export const createVideoSchema = z.object({
  body: z.object({
    title: z.string().min(2, "Title must be at least 2 characters long").max(100, "Title cannot exceed 100 characters"),
    description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
    fileName: z.string().min(1, "Filename is required"),
    fileSize: z.number().int().positive("File size must be a positive number"),
    mimeType: z.string().refine((val) => {
      return val.startsWith('video/');
    }, "Only video files are allowed"),
  }),
});

// Schema for updating a video
export const updateVideoSchema = z.object({
  body: z.object({
    title: z.string().min(2, "Title must be at least 2 characters long").max(100, "Title cannot exceed 100 characters").optional(),
    description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
    isPublic: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid("Invalid video ID format"),
  }),
});

// Schema for getting a video by ID
export const getVideoSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid video ID format"),
  }),
});

// Schema for getting presigned upload URL
export const getUploadUrlSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid video ID format"),
  }),
});

// Schema for confirming video upload completion
export const confirmUploadSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid video ID format"),
  }),
}); 