// Import required modules
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const httpStatus = require('http-status');
const ApiError = require('../helpers/ApiError');
const i18n = require('../config/i18n');
const config = require('../config/config.js');

/**
 * Middleware to authenticate a user based on the JWT (JSON Web Token) sent in the request headers.
 * This function checks for the presence of a token, validates it, and then fetches the corresponding user.
 * If everything is valid, the user is attached to the request object for use in subsequent middleware or route handlers.
 *
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * @param {function} next - The next middleware function in the stack.
 */

async function authenticateToken(req, res, next) {

    try {
        // Extract the 'authorization' header from the request.
        const authHeader = req.headers['authorization'];

        // Check if the header exists and follows "Bearer TOKEN_HERE" format.
        if (!authHeader || !authHeader.startsWith('Bearer ')) throw new ApiError(httpStatus.UNAUTHORIZED, i18n.__('error.malformed_authorization_header'));

        // Retrieve the token part.
        const token = authHeader.split(' ')[1];

        // If there's no token, send a 401 Unauthorized response.
        if (!token) throw new ApiError(httpStatus.UNAUTHORIZED, i18n.__('error.no_token'));

        // Decode and verify the JWT using the secret key and algorithm.
        const decodedUser = jwt.verify(token, config.appConfig.secret.accessToken, { algorithms: [config.appConfig.algorithm] });

        // Fetch the user from the database using the decoded user's ID.
        const user = await User.findByPk(decodedUser.id);

        // Check if the user exists.
        if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, i18n.__('error.user_not_found'));

        // Attach the user to the request object for subsequent middleware or route handlers to use.
        req.user = user;

        // Proceed to the next middleware or route handler.
        next();
    } catch (error) {
        console.error(error);
        // Handle specific JWT error types.
        if (error.name === 'TokenExpiredError') {
            next(new ApiError(httpStatus.UNAUTHORIZED, i18n.__('error.expired_token')));
        } else if (error.name === 'JsonWebTokenError') {
            next(new ApiError(httpStatus.UNAUTHORIZED, i18n.__('error.invalid_token')));
        } else {
            // For other unhandled errors, return a 500 Internal Server Error response.
            next(error);
        }
    }
    
}

// Export the middleware function so it can be used in other parts of the application.
module.exports = authenticateToken;
