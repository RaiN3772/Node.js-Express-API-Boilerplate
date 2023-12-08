// Load and validate environment variables
require('dotenv-safe').config({
  allowEmptyValues: true
});
const config = require('./config/config');
// Check for mandatory environment variables
if (!config.appConfig.secret.session) {
  throw new Error("SESSION_SECRET is not set in the environment variables.");
}

// Core Packages
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { convertToApiError, handleApiError } = require('./middleware/errorMiddleware');
const ApiError = require('./helpers/ApiError');
const logger = require('./config/logger');

// Middleware & Utility Packages
const httpStatus = require('http-status');
const compress = require('compression');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const morgan = require('morgan');
const rateLimiter = require('./helpers/rateLimiter');
const i18n = require('./config/i18n');

// Custom Middleware & Helpers
const { isDevelopment } = require('./helpers/DebuggerHelper');

// Import Route Handlers
const routes = require('./routes');

// Initialize Express App
const app = express();

// Handle Unhandled Rejections and Exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at Promise: ${promise}, Reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error}`);
  process.exit(1);
});

// Passport Configuration (Must be before express-session)
require('./config/passport');

// Configure logging
if (isDevelopment()) {
  app.use(morgan('dev', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Security Middleware
app.use(helmet());  // Set security HTTP headers
app.use(xss());  // Sanitize request data

// Request Middleware
app.use(express.json());  // Parse JSON request body
app.use(i18n.init);
// Set the locale based on the 'accept-language' header
app.use((req, res, next) => {
  i18n.setLocale(req.headers['accept-language'] || 'en');
  next();
});

// Compression and CORS
app.use(compress());  // Compress response
app.use(cors());  // Enable CORS
app.options('*', cors());  // Pre-flight for all routes

// Session Management
app.use(session({
  secret: config.appConfig.secret.session,
  resave: true,
  saveUninitialized: true,
}));

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// Apply API Rate Limiter in Production
if (!isDevelopment()) app.use(rateLimiter);

// API Routes
app.use('/api', routes);

// 404 Error Handling
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, i18n.__('error.not_found')));
});

// Convert error to ApiError, if needed
app.use(convertToApiError);

// Handle error
app.use(handleApiError);

// Start the Express Server
app.listen(config.appConfig.port, () => {
  console.log(`Server is running on port ${config.appConfig.port}`);
});
