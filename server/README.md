# AI Video Summarizer - Server

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the following variables in `.env`:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `JWT_SECRET`: Your JWT secret key
     - `EMAIL_*`: Your email service configuration

4. Database Setup:
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot-reload
- `npm run build`: Build the TypeScript code
- `npm test`: Run tests
- `npm run prisma:generate`: Generate Prisma Client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:studio`: Open Prisma Studio (database GUI)
- `npm run prisma:push`: Push schema changes to database
- `npm run prisma:reset`: Reset database and run all migrations

## Database Management

### Prisma Commands

1. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```
   This command generates the Prisma Client based on your schema.

2. **Create and Apply Migrations**
   ```bash
   npm run prisma:migrate
   ```
   This will:
   - Create a new migration
   - Apply it to the database
   - Regenerate Prisma Client

3. **View Database in Prisma Studio**
   ```bash
   npm run prisma:studio
   ```
   Opens a web-based GUI to view and edit your database.

4. **Push Schema Changes**
   ```bash
   npm run prisma:push
   ```
   Push schema changes to the database without creating migrations.

5. **Reset Database**
   ```bash
   npm run prisma:reset
   ```
   Reset the database and run all migrations from scratch.

## API Endpoints

### Base URL
All endpoints are prefixed with `/api`

### Authentication Endpoints

#### Register User
- **POST** `/auth/register`
- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response**: User details and verification instructions

#### Login
- **POST** `/auth/login`
- **Description**: Authenticate user and get JWT token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response**: JWT token and user details

#### Verify Email
- **POST** `/auth/verify-email`
- **Description**: Verify user email with OTP
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Response**: Verification status

#### Request Password Reset
- **POST** `/auth/request-password-reset`
- **Description**: Request password reset OTP
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**: Reset instructions

#### Reset Password
- **POST** `/auth/reset-password`
- **Description**: Reset password using OTP
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "password": "NewPassword123!"
  }
  ```
- **Response**: Password reset status

#### Change Password
- **POST** `/auth/change-password`
- **Description**: Change password (protected route)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "currentPassword": "CurrentPassword123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **Response**: Password change status

### User Endpoints

#### Get User Details
- **GET** `/user/me`
- **Description**: Get current user details
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User details

#### Update User Details
- **PATCH** `/user/me`
- **Description**: Update current user details
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "firstName": "New First Name",
    "lastName": "New Last Name"
  }
  ```
- **Response**: Updated user details

### Health Check
- **GET** `/health`
- **Description**: Check API health status
- **Response**: API status and version

### API Documentation
- **GET** `/`
- **Description**: Get API documentation and available endpoints
- **Response**: API documentation with all available endpoints

## Response Format

All API responses follow this format:
```json
{
  "success": true,
  "message": "Operation message",
  "data": {
    // Response data
  }
}
```

## Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": {
      // Error details (in development only)
    }
  }
}
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret key for JWT tokens
- `CORS_ORIGIN`: Allowed CORS origin
- `DATABASE_URL`: PostgreSQL connection string
- `EMAIL_HOST`: SMTP host
- `EMAIL_PORT`: SMTP port
- `EMAIL_USER`: SMTP username
- `EMAIL_PASS`: SMTP password
- `EMAIL_FROM`: Sender email address

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

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