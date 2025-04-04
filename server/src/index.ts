import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import Logger, { stream } from './utils/logger';
import { errorResponse } from './utils/response';
import healthRoutes from './routes/health.routes';
import { AppError } from './utils/AppError';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(morgan('combined', { stream })); // HTTP request logging with our custom stream
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', healthRoutes);

// 404 Error Handler
app.use((req, res, next) => {
  Logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  next(new AppError('Resource not found', 404, 'NOT_FOUND'));
});

// Error handling middleware
app.use((err: Error | AppError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof AppError) {
    Logger.warn(`AppError: ${err.message}`, { 
      code: err.code,
      statusCode: err.statusCode,
      ...(err.details && { details: err.details })
    });
    return errorResponse(
      res,
      err.message,
      err.statusCode,
      err.code,
      process.env.NODE_ENV === 'development' ? err.details : undefined
    );
  }

  Logger.error(`Error: ${err.message}`, { stack: err.stack });
  errorResponse(
    res,
    'Internal Server Error',
    500,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  );
});

// Start server
app.listen(port, () => {
  Logger.info(`Server is running on port ${port}`);
  Logger.info(`Environment: ${process.env.NODE_ENV}`);
  Logger.info(`CORS Origin: ${process.env.CORS_ORIGIN}`);
}); 