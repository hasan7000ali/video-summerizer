import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define the format for the logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define format for file output (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json(),
);

//Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get environment
const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

// Define which transports the logger must use
const transports = [
  // Console transport only in non-production
  ...(isProduction ? [] : [new winston.transports.Console({ format })]),
  // Error log file
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: fileFormat,
  }),
  // All logs file
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: fileFormat,
  }),
];

// Create the logger instance
const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Create a stream object with a 'write' function that will be used by Morgan
export const stream = {
  write: (message: string) => {
    Logger.http(message.trim());
  },
};

export default Logger; 