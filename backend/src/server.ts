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

// Email verification web route (for email links)
app.get('/verify-email', async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).send(`
        <html>
          <head><title>Email Verification - Error</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <div style="text-align: center;">
              <h1 style="color: #dc2626;">❌ Verification Error</h1>
              <p>Invalid verification link. Please make sure you clicked the correct link from your email.</p>
              <a href="habitx://" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Open Habit X App</a>
            </div>
          </body>
        </html>
      `);
    }

    // Import UserRepository for verification
    const { UserRepository } = await import('./models/User');
    const crypto = await import('crypto');

    // Hash the token to match what's stored in database
    const hashedToken = crypto.createHash('sha256').update(token as string).digest('hex');

    // Find user by email and verify token
    const user = await UserRepository.findByEmail(email as string);
    
    if (!user || user.verificationToken !== hashedToken || 
        !user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
      return res.status(400).send(`
        <html>
          <head><title>Email Verification - Error</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <div style="text-align: center;">
              <h1 style="color: #dc2626;">❌ Verification Failed</h1>
              <p>This verification link has expired or is invalid.</p>
              <p>Please request a new verification email from the app.</p>
              <a href="habitx://" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Open Habit X App</a>
            </div>
          </body>
        </html>
      `);
    }

    // Mark email as verified
    await UserRepository.update(user.id, {
      emailVerified: true,
      verificationToken: undefined,
      verificationTokenExpiry: undefined,
    });

    // Success page without automatic redirect
    res.send(`
      <html>
        <head>
          <title>Email Verification - Success</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            .success-container {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            .success-header {
              background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
              padding: 30px;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .success-title {
              color: white;
              margin: 0;
              font-size: 24px;
            }
            .app-button {
              background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              display: inline-block;
              margin: 20px 10px;
              cursor: pointer;
              border: none;
              font-size: 16px;
            }
            .app-button:hover {
              opacity: 0.9;
            }
            .instructions {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #4F46E5;
            }
          </style>
        </head>
        <body>
          <div class="success-container">
            <div class="success-header">
              <h1 class="success-title">✅ Email Verified Successfully!</h1>
            </div>
            <p style="font-size: 18px; color: #333;">Welcome to Habit X, <strong>${user.username}</strong>!</p>
            <p style="color: #666; font-size: 16px;">Your email has been successfully verified.</p>
            
            <div class="instructions">
              <h3 style="color: #333; margin-top: 0;">Next Steps:</h3>
              <p style="color: #666; text-align: left;">
                📱 <strong>If you have the Habit X mobile app installed:</strong><br/>
                Click the button below to open the app and you'll be automatically logged in.
              </p>
              <p style="color: #666; text-align: left;">
                🌐 <strong>If using a web browser:</strong><br/>
                You can now close this page. Your email is verified and you can login to your account using your credentials.
              </p>
            </div>
            
            <div style="margin: 30px 0;">
              <button onclick="tryOpenApp()" class="app-button">
                📱 Open Habit X App
              </button>
            </div>
            
            <p style="color: #999; font-size: 14px;">
              You can safely close this page. Your email verification is complete.
            </p>
          </div>
          
          <script>
            function tryOpenApp() {
              // Try to open the app
              const appUrl = "habitx://verified?email=${encodeURIComponent(email as string)}";
              
              // Create a hidden link and click it
              const link = document.createElement('a');
              link.href = appUrl;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Show feedback
              const button = document.querySelector('.app-button');
              const originalText = button.innerHTML;
              button.innerHTML = '✅ Opening app...';
              
              // Reset button after 3 seconds
              setTimeout(() => {
                button.innerHTML = originalText;
              }, 3000);
            }
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).send(`
      <html>
        <head><title>Email Verification - Error</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <div style="text-align: center;">
            <h1 style="color: #dc2626;">❌ Server Error</h1>
            <p>Something went wrong during verification. Please try again later.</p>
            <a href="habitx://" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Open Habit X App</a>
          </div>
        </body>
      </html>
    `);
  }
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

