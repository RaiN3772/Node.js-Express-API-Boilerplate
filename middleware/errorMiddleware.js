const httpStatus = require('http-status');
const ApiError = require('../helpers/ApiError');
const { isDevelopment } = require('../helpers/DebuggerHelper');
const logger = require('../config/logger');

/**
 * Converts any error not already an ApiError into ApiError
 * @param {Error} error - The error object
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */
const convertToApiError = (error, req, res, next) => {
    let apiError = error;

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        apiError = new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.unsupported_media_type'), false, error.stack);
    }

    // Check if error is already an ApiError
    if (!(apiError instanceof ApiError)) {
        const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        const message = error.message || httpStatus[statusCode];
        apiError = new ApiError(statusCode, message, false, error.stack);
    }

    next(apiError);
};

/**
 * Handles the ApiError and sends response
 * @param {ApiError} error - The error object
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */
const handleApiError = (error, req, res, next) => {
    // Extract properties from ApiError
    let { statusCode, message } = error;

    // Create additional info object
    const additionalInfo = {
        user: req.user ? req.user.id : 'Guest',  // Add user id or mark as Guest
        ip: req.ip,  // Add request IP
        method: req.method,  // Add request method
        path: req.path,  // Add request path
    };

    // In production, override statusCode and message to prevent leaking sensitive error details
    if (!isDevelopment()) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
    }

    // Used for error logging (if needed)
    res.locals.errorMessage = error.message;

    const errorResponse = {
        error: true,
        code: statusCode,
        message,
    };

    // Only include stack trace if not in production
    if (isDevelopment()) {
        const beautifiedStack = error.stack.split('\n').map(line => line.trim());
        errorResponse.stack = beautifiedStack;
    }

    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${error.statusCode}, Message:: ${error.message}, Additional Info:: ${JSON.stringify(additionalInfo)}`);

    res.status(statusCode).json(errorResponse);
};


module.exports = {
    convertToApiError,
    handleApiError,
};
