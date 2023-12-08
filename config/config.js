// config.js
// Central configuration file for the Node.js-Express application

const appConfig = {
    name: 'My Express App', // Application name
    environment: process.env.NODE_ENV || 'development', // Application environment
    port: process.env.PORT || 3000, // Server port
    version: "0.0.1",
    superadmins: [1, 2], // List of Super Admin user IDs (comma-separated)
    uploadPath: 'uploads/', // Directory path for user uploads
    algorithm: 'HS256', // Algorithm for JWT generation
    role: {
        default: 'user',
        admin: 'admin'
    },
    avatar: {
        default: null, // Default avatar URL or path
        path: 'avatars/', // Sub-directory for avatar uploads
        maxSize: 5242880, // Max allowed size for avatar images (in bytes) [5MB = 5242880]
        allowedTypes: 'image/jpeg,image/png,image/jpg,image/gif' // Allowed file types for avatars
    },
    user: {
        minPasswordLength: process.env.MIN_PASSWORD_LENGTH, // Minimum length for user passwords
        saltRounds: process.env.SALT_ROUNDS, // Number of salt rounds for bcrypt
        maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS, // Maximum allowed login attempts
        accountLockDuration: process.env.ACCOUNT_LOCK_DURATION, // Account lockout duration (in minutes) after reaching max login attempts
        complexPassword: false, // Enable Requiring Complex Password, NOT APPLIED YET

    },
    secret: {
        session: process.env.SESSION_SECRET,
        refreshToken: process.env.REFRESH_TOKEN_SECRET,
        accessToken: process.env.ACCESS_TOKEN_SECRET,

    },
    expiration: {
        accessToken: process.env.ACCESS_TOKEN_EXPIRATION,
        refreshToken: process.env.REFRESH_TOKEN_EXPIRATION
    },
    api: {
        rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS || 600000,
        rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 50, // Max allowed requests within the time window
    }
};
module.exports = {
    appConfig,

    // Database configuration settings
    dbConfig: {
        dbName: process.env.DB_NAME || 'default_db',
        dbUser: process.env.DB_USER || 'root',
        dbPass: process.env.DB_PASS || '',
        dbHost: process.env.DB_HOST || 'localhost',
        dbDialect: process.env.DB_ENGINE || 'mysql',
        // synchronization settings
        sync: {
            enable: false, // Enable or disable model synchronization
            type: 'alter' // Sync type: 'force': This creates the table, dropping it first if it already existed, or 'alter': This checks what is the current state of the table in the database (which columns it has, what are their data types, etc), and then performs the necessary changes in the table to make it match the model
        }
    },

    // Logging configuration settings
    logging: {
        consoleLevel: 'debug',
        fileLevel: 'info',
        fileRotation: {
            filename: `logs/${appConfig.name}-${appConfig.environment}-v${appConfig.version}-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '25m',
            maxFiles: '30d'
        }
    },

    // Mail service settings
    mailConfig: {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        fromEmail: process.env.MAILGUN_FROM_EMAIL
    },
};
