# Habit X Backend

A RESTful API backend for the Habit X application built with Express.js, TypeScript, and MongoDB.

## Features

- RESTful API for habit management
- MongoDB integration with Mongoose
- TypeScript for type safety
- Input validation with express-validator
- Error handling middleware
- Rate limiting and security middleware
- CORS configuration for mobile app integration

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn

## Installation

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file (already created with your MongoDB connection string)

4. Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Habits

- `GET /api/habits` - Get all habits
- `GET /api/habits/:id` - Get a specific habit
- `POST /api/habits` - Create a new habit
- `PUT /api/habits/:id` - Update a habit
- `DELETE /api/habits/:id` - Delete a habit
- `POST /api/habits/:id/toggle` - Toggle habit completion for today
- `GET /api/habits/:id/stats` - Get habit statistics

### Health Check

- `GET /health` - Server health check

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts         # MongoDB connection
│   ├── controllers/
│   │   └── habitController.ts  # Habit CRUD operations
│   ├── middleware/
│   │   ├── errorHandler.ts     # Error handling
│   │   └── validation.ts       # Input validation
│   ├── models/
│   │   └── Habit.ts           # Habit schema/model
│   ├── routes/
│   │   └── habits.ts          # Habit routes
│   ├── utils/
│   │   └── dateUtils.ts       # Date utility functions
│   └── server.ts              # Express app setup
├── .env                       # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `DB_NAME` - Database name (default: habit_tracker)
- `JWT_SECRET` - JWT secret key (for future authentication)
- `ALLOWED_ORIGINS` - CORS allowed origins
- `RATE_LIMIT_WINDOW_MS` - Rate limit window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Integration with Frontend

The backend is configured to work with your React Native Expo app. Make sure to:

1. Update your frontend API calls to point to `http://localhost:3000/api/habits`
2. The CORS is configured to allow requests from common Expo development ports
3. Update the allowed origins in `.env` if needed for your specific setup

## Next Steps

1. Install dependencies and start the server
2. Test the API endpoints using a tool like Postman or curl
3. Update your frontend to use the new API endpoints
4. Consider adding authentication/authorization if needed
5. Add more advanced features like habit categories, reminders, etc.

## Security Features

- Helmet for security headers
- Rate limiting to prevent abuse
- CORS configuration
- Input validation and sanitization
- Error handling that doesn't leak sensitive information

## Author

**aman1298**
