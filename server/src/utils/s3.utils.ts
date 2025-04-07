import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import Logger from './logger';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Bucket name from environment variable
const bucketName = process.env.AWS_S3_BUCKET_NAME || '';

// Generate a unique file key for S3
export const generateFileKey = (fileName: string, prefix = 'videos/'): string => {
  const extension = fileName.split('.').pop();
  const uniqueId = uuidv4();
  return `${prefix}${uniqueId}-${Date.now()}.${extension}`;
};

// Generate a presigned URL for direct upload (PUT)
export const generateUploadUrl = async (fileKey: string, contentType: string, expiresIn = 3600): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return uploadUrl;
  } catch (error: any) {
    Logger.error('Error generating upload URL:', error);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
};

// Generate a presigned URL for downloading (GET)
export const generateDownloadUrl = async (fileKey: string, expiresIn = 3600): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return downloadUrl;
  } catch (error: any) {
    Logger.error('Error generating download URL:', error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
};

// Delete an object from S3
export const deleteS3Object = async (fileKey: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });
    
    await s3Client.send(command);
    Logger.info(`Object ${fileKey} deleted from S3`);
  } catch (error: any) {
    Logger.error('Error deleting S3 object:', error);
    throw new Error(`Failed to delete object: ${error.message}`);
  }
};

// Check if an object exists in S3
export const checkObjectExists = async (fileKey: string): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
};

// Get file size from S3
export const getFileSize = async (fileKey: string): Promise<number> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });
    
    const response = await s3Client.send(command);
    return response.ContentLength || 0;
  } catch (error: any) {
    Logger.error('Error getting file size:', error);
    throw new Error(`Failed to get file size: ${error.message}`);
  }
}; 