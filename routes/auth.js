const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const loginController = require('../controllers/loginController');
const authController = require('../controllers/authController');
const registerController = require('../controllers/registerController');

// Create rate limiter for sensitive routes
const rateLimiterSensitive = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many requests, please try again later."
});

// User registration route with more stringent rate limiting
router.post('/register', rateLimiterSensitive, registerController.register);

// User login route with more stringent rate limiting
router.post('/login', rateLimiterSensitive, loginController.login);

// Verify User Token
router.post('/verifyUser', authController.refreshToken);

// User logout route
router.post('/logout', loginController.logout);

// Verify Email Address
router.get('/verifyEmail', authController.verifyEmail);

// Send a request to reset user password
router.post('/requestPasswordReset', authController.requestPasswordReset);

// Reset User Password
router.post('/resetPassword', authController.resetPassword);

module.exports = router;
