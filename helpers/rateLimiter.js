const rateLimit = require("express-rate-limit");
const httpStatus = require('http-status');
//const ApiError = require('../helpers/ApiError');
const config = require('../config/config.js');

const rateLimiter = rateLimit({
    windowMs: parseInt(config.appConfig.api.rateLimitWindow), // Default to 10 minutes if not specified
    max: parseInt(config.appConfig.api.rateLimitMaxRequests), // Default to 50 requests if not specified
    skipSuccessfulRequests: false,
    handler: function(req, res /*, next */) {
      res.status(httpStatus.TOO_MANY_REQUESTS).json({ error: true, message: i18n.__('message.too_many_requests') });
      //throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests. Please try again later.');
    },
  });
  

module.exports = rateLimiter;
