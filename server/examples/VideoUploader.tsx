import React, { useState, useEffect } from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import AwsS3 from '@uppy/aws-s3';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

interface VideoUploaderProps {
  authToken: string;
  apiBaseUrl: string;
  onUploadComplete?: (videoId: string) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  authToken, 
  apiBaseUrl, 
  onUploadComplete 
}) => {
  const [uppy, setUppy] = useState<Uppy.Uppy | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Uppy when component mounts
    const uppyInstance = new Uppy({
      id: 'video-uploader',
      autoProceed: false,
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ['video/*'],
        maxFileSize: 1024 * 1024 * 500, // 500MB max
      },
      debug: process.env.NODE_ENV === 'development',
    })
      .use(AwsS3, {
        companionUrl: '/', // Not used for direct uploads
      });

    // Handle file selection
    uppyInstance.on('file-added', (file) => {
      setError(null);
      // Create a video entry in the API
      createVideoEntry(file)
        .then(response => {
          if (response.success) {
            // Attach the presigned URL to the file
            file.meta.key = response.data.video.fileKey;
            file.meta.uploadURL = response.data.uploadUrl;
            file.meta.videoId = response.data.video.id;
          } else {
            uppyInstance.removeFile(file.id);
            setError(response.message || 'Failed to create video entry');
          }
        })
        .catch(err => {
          uppyInstance.removeFile(file.id);
          setError(err.message || 'Failed to create video entry');
        });
    });

    // Configure for S3 direct upload
    uppyInstance.on('upload', (data) => {
      setIsUploading(true);
      setProgress(0);
      
      // For each file, get the prepared upload URL
      const promises = data.fileIDs.map(fileID => {
        const file = uppyInstance.getFile(fileID);
        return {
          url: file.meta.uploadURL,
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          // Fields are not needed for presigned URLs
        };
      });
      
      return promises;
    });

    // Track upload progress
    uppyInstance.on('upload-progress', (file, progress) => {
      const percent = Math.round(progress.bytesUploaded / progress.bytesTotal * 100);
      setProgress(percent);
    });

    // Handle upload success
    uppyInstance.on('upload-success', (file) => {
      // Confirm the upload with the API
      confirmUpload(file.meta.videoId)
        .then(response => {
          if (response.success) {
            if (onUploadComplete) {
              onUploadComplete(file.meta.videoId);
            }
          } else {
            setError(response.message || 'Failed to confirm upload');
          }
        })
        .catch(err => {
          setError(err.message || 'Failed to confirm upload');
        })
        .finally(() => {
          setIsUploading(false);
        });
    });

    // Handle upload error
    uppyInstance.on('upload-error', (file, error) => {
      setError(`Upload error: ${error.message}`);
      setIsUploading(false);
    });

    setUppy(uppyInstance);

    // Cleanup on unmount
    return () => {
      uppyInstance.close();
    };
  }, [apiBaseUrl, authToken, onUploadComplete]);

  // Helper function to create video entry
  const createVideoEntry = async (file: Uppy.UppyFile) => {
    const response = await fetch(`${apiBaseUrl}/api/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: file.name.split('.')[0],
        description: '',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }),
    });
    
    return await response.json();
  };

  // Helper function to confirm upload
  const confirmUpload = async (videoId: string) => {
    const response = await fetch(`${apiBaseUrl}/api/videos/${videoId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    return await response.json();
  };

  return (
    <div className="video-uploader">
      <h2>Upload Video</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {isUploading && (
        <div className="progress-bar">
          <div 
            className="progress-bar-inner" 
            style={{ width: `${progress}%` }}
          />
          <span>{progress}%</span>
        </div>
      )}
      
      {uppy && (
        <Dashboard
          uppy={uppy}
          width="100%"
          height={400}
          showProgressDetails
          proudlyDisplayPoweredByUppy={false}
        />
      )}
      
      <style jsx>{`
        .video-uploader {
          margin: 20px 0;
        }
        .error-message {
          background-color: #ffdddd;
          color: #ff0000;
          padding: 10px;
          margin: 10px 0;
          border-radius: 4px;
        }
        .progress-bar {
          height: 20px;
          background-color: #eee;
          border-radius: 10px;
          margin: 10px 0;
          position: relative;
        }
        .progress-bar-inner {
          height: 100%;
          background-color: #4CAF50;
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        .progress-bar span {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          text-align: center;
          line-height: 20px;
          font-size: 12px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default VideoUploader; 