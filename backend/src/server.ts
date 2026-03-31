import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import habitRoutes from './routes/habits';

// Load environment variables
dotenv.config();

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);

// How many alternative ports to try if the desired port is in use
const PORT_RETRY_COUNT = 3;

// Security middleware
app.use(helmet());

// If the app is behind a proxy (ngrok, load balancer), enable trust proxy
// so express-rate-limit can correctly read the X-Forwarded-For header.
// For ngrok development tunnels, setting trust proxy to 1 is sufficient.
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:19000',
  'http://localhost:8080',
  'http://192.168.152.198:8081',
  'http://192.168.152.198:19006',
  'http://192.168.152.198:19000',
  'http://192.168.166.141:8081',
  'http://192.168.166.141:19006',
  'http://192.168.166.141:19000',
  // Add ngrok URL
  'https://f4c96c96e4b7.ngrok-free.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow Render domains (for production)
    if (origin && origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    // Allow Expo hosted apps (expo.app, expo.dev)
    if (origin && (origin.includes('expo.app') || origin.includes('expo.dev'))) {
      return callback(null, true);
    }
    
    // Allow ngrok URLs (they typically have ngrok-free.app domain)
    if (origin && origin.includes('ngrok-free.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any localhost origin for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow any 192.168.x.x origin for development
    if (origin.match(/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/)) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to handle ngrok warnings
app.use((req, res, next) => {
  // Add ngrok-skip-browser-warning header to bypass ngrok browser warning
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API health check route (for production monitors / consistency)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    service: 'habit-tracker-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Email verification web route — Clerk now handles verification.
// This page is a fallback for any old Firebase deep links still in circulation.
app.get('/verify-email', (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>Email Verification — Habit X</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; background: #0f172a; color: #e2e8f0; }
          h1 { color: #8B5CF6; }
          .card { background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }
          a.btn { display: inline-block; margin-top: 20px; background: linear-gradient(135deg,#4F46E5,#7C3AED); color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ Email Verification</h1>
          <p>Email verification is now handled directly inside the <strong>Habit X</strong> app via Clerk.</p>
          <p>Please open the app and follow the sign-in instructions. If you registered recently, check your email for a verification code from Clerk.</p>
          <a class="btn" href="habitx://">Open Habit X App</a>
        </div>
      </body>
    </html>
  `);
});


// Base API info route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Habit Tracker API',
    version: '1.0.0',
    availableRoutes: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user (requires auth)',
        'PUT /api/auth/profile': 'Update user profile (requires auth)',
        'PUT /api/auth/password': 'Change password (requires auth)',
      },
      habits: {
        'GET /api/habits': 'Get user habits (requires auth)',
        'POST /api/habits': 'Create new habit (requires auth)',
        'PUT /api/habits/:id': 'Update habit (requires auth)',
        'DELETE /api/habits/:id': 'Delete habit (requires auth)',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Connect to database and start server with retry on port conflicts
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');

    // Attempt to bind to a port, with fallback if it's already in use
    const tryListen = (port: number, remainingRetries: number) => {
      const server = app.listen(port, '0.0.0.0');

      server.on('listening', () => {
        console.log(`🚀 Server is running on port ${port}`);
        console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 Health check: http://localhost:${port}/health`);
      });

      server.on('error', (err: any) => {
        if (err && err.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use.`);
          if (remainingRetries > 0) {
            const nextPort = port + 1;
            console.log(`Trying alternative port ${nextPort} (${remainingRetries} retries left)...`);
            // Give a small delay before retrying
            setTimeout(() => tryListen(nextPort, remainingRetries - 1), 300);
            return;
          }

          console.error(`All retries exhausted. Unable to bind to a free port starting at ${DEFAULT_PORT}.`);
          console.error('Common fixes:');
          console.error(` - Another process is already using port ${port}.`);
          console.error(' - On Windows, run: netstat -ano | findstr :<PORT>  to locate the PID, then taskkill /PID <PID> /F to stop it.');
          console.error(' - Or set PORT environment variable to a different port before starting the server.');
          process.exit(1);
        }

        console.error('Server error:', err);
        process.exit(1);
      });
    };

    tryListen(DEFAULT_PORT, PORT_RETRY_COUNT);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer();

export default app;

