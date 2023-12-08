// Import the winston logging library
const winston = require('winston');
require('winston-daily-rotate-file');
const config = require('../config/config.js');

// Import the helper function to check if the environment is set to development
const { isDevelopment } = require('../helpers/DebuggerHelper');


// Configuration for console logs
const consoleConfig = new winston.transports.Console({
    level: config.logging.consoleLevel,
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    )
});

const fileRotateConfig = new winston.transports.DailyRotateFile({
    ...config.logging.fileRotation, // Spread operator to use all settings from config
    level: config.logging.fileLevel
});

// Configuration for file logs in production
const fileConfig = new winston.transports.File({
    filename: './logs/errors.log', // Save logs to this file
    level: 'error', // Log only error level messages
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
});


// Use ternary operator to decide which transport to use
const transport = isDevelopment() ? consoleConfig : fileRotateConfig;


// Create logger
const logger = winston.createLogger({
    transports: [transport]
});

// Error listener for the transport
logger.transports.forEach((t) => {
    t.on('error', (err) => {
        console.error('Logging error:', err);
    });
});

module.exports = logger;
