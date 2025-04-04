# AI Video Summarizer - Server

This is the backend server for the AI Video Summarizer application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Start production server:
```bash
npm start
```

## Project Structure

```
server/
├── src/
│   ├── index.ts           # Main application entry point
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── dist/                  # Compiled JavaScript files
├── .env                   # Environment variables
├── package.json           # Project dependencies
└── tsconfig.json          # TypeScript configuration
```

## Development

- The server runs on port 3000 by default
- Uses TypeScript for type safety
- Implements security best practices with helmet
- Includes logging with Winston
- CORS enabled for specified origins
- Health check endpoint at `/health`

## Testing

Run tests with:
```bash
npm test
``` 