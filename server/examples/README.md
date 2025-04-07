# Video Upload Examples

These example files demonstrate how to integrate direct S3 uploads with Uppy in a React application.

## Files

- `VideoUploader.tsx`: A reusable React component that handles video uploads
- `ExampleApp.tsx`: A sample React application showing how to use the VideoUploader component

## Installing Dependencies

To use these components in your React app, install the following dependencies:

```bash
# Install Uppy and required plugins
npm install @uppy/core @uppy/react @uppy/dashboard @uppy/aws-s3

# Install React types if using TypeScript
npm install --save-dev @types/react
```

## Integration Steps

1. **Copy the example components** to your React project
2. **Configure the API URL** in your component to point to your server
3. **Set up authentication** to provide a valid token for API requests
4. **Adjust styling** to match your application's design

## How It Works

1. User selects a video file using the Uppy Dashboard
2. The component creates a video entry in your API
3. The API returns a presigned S3 URL for direct upload
4. The file is uploaded directly to S3 (bypassing your server)
5. After successful upload, the API is notified to confirm the upload
6. The video list refreshes to show the new upload

## Key Features

- **Direct-to-S3 uploads**: Files are sent directly to S3, reducing server load
- **Chunked uploads**: Large files are uploaded in chunks for better reliability
- **Progress tracking**: Real-time upload progress is displayed to the user
- **Error handling**: Comprehensive error catching and display
- **Responsive design**: Works well on mobile and desktop

## Customization

You can customize the VideoUploader component by:

- Changing the file size restrictions
- Modifying the allowed file types
- Adjusting the UI elements and styling
- Adding additional metadata to video uploads

## Using with Next.js

If you're using Next.js, make the following adjustments:

1. Create a `components` folder and place the files there
2. Use dynamic imports with `next/dynamic` to load Uppy on the client side:

```javascript
import dynamic from 'next/dynamic';

const VideoUploader = dynamic(
  () => import('../components/VideoUploader'),
  { ssr: false }
);
```

## Troubleshooting

- **CORS errors**: Ensure your S3 bucket has the proper CORS configuration
- **Authentication issues**: Verify the auth token is being passed correctly
- **Upload failures**: Check network tab for specific error messages

## S3 Bucket CORS Configuration

For direct uploads to work, your S3 bucket needs the following CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Replace `yourdomain.com` with your actual production domain. 