// Import necessary modules and models for authentication and validation
const { User, Token } = require('../models/initModels');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const { check, validationResult } = require('express-validator');
const { sendEmail } = require('../helpers/mailer');
const { Op } = require("sequelize");
const { generateAccessToken } = require('../helpers/Token');
const ApiError = require('../helpers/ApiError');
const { renderEmailTemplate } = require('../helpers/emailHelper');
const i18n = require('../config/i18n');
const config = require('../config/config.js');

// refreshToken function for handling refresh token requests
exports.refreshToken = async (req, res, next) => {
  try {
    // Extract the refresh token from the request body
    const { refreshToken } = req.body;

    // Validate the presence of the refresh token
    if (!refreshToken) throw new ApiError(httpStatus.UNAUTHORIZED, i18n.__('validation.refresh_token_required'));
    
    // Find the corresponding token record in the database
    const tokenRecord = await Token.findOne({ where: { token: refreshToken, type: 'refresh_token', used: false }});

    // Validate the token's existence and status
    if (!tokenRecord) throw new ApiError(httpStatus.FORBIDDEN, i18n.__('error.invalid_or_expired_refresh_token'));
    
    // Verify the refresh token and extract user data
    const userData = jwt.verify(refreshToken, config.appConfig.secret.refreshToken);

    // Mark the refresh token as used in the database
    tokenRecord.used = true;
    await tokenRecord.save();

    // Generate a new access token
    const newAccessToken = generateAccessToken({ id: userData.id });

    // Send the new access token as a response
    res.status(httpStatus.OK).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    // Handle token verification errors and other errors
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(httpStatus.FORBIDDEN, i18n.__('error.invalid_or_expired_refresh_token')));
    }
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {

  try {

    // Retrieve the token from the query parameters
    const tokenString = req.query.token;

    // Check if the token is provided in the request
    if (!tokenString) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.token_missing'))

    // Find the email verification token in the database
    const token = await Token.findOne({ where: { token: tokenString, type: 'email_verification' } });

    // If the token is not found, return an error
    if (!token) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.invalid_token'))

    // Check if the token has expired
    if (new Date() > token.expiry_date) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.token_expired_request_new_verification'))

    // Check if the token has been used
    if (token.used) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.token_already_used'))

    // Find the user associated with the token
    const user = await User.findOne({ where: { id: token.user_id } });

    // If the user does not exist, return a 404 not found error
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.user_not_found'))

    // If the user's email is already verified, inform the user 
    if (user.isVerified) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.email_already_verified'))

    // Mark the user's email as verified
    user.isVerified = true;

    // Mark the token as used
    token.used = true;

    // Save the changes to the database
    await user.save();
    await token.save();

    // Send a success response
    res.json({
      success: true,
      message: i18n.__('success.email_verification_successful')
    });

  } catch (error) {
    next(error);
  }
};

exports.requestPasswordReset = [
  // Validate the email
  check('email')
    .exists().withMessage(i18n.__('validation.email_required'))
    .trim()
    .escape()
    .normalizeEmail()
    .isEmail().withMessage(i18n.__('validation.invalid_email'))
    .custom(async value => {
      const user = await User.findOne({ where: { email: value } });
      if (user) throw new Error(i18n.__('message.password_reset_link_sent'));
    }),

  async (req, res, next) => {
    try {
      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg);

      // Check if email exists in the database
      const user = await User.findOne({ where: { email: req.body.email } });

      // For security reasons, don't reveal if the email is registered or not
      if (!user) return res.status(httpStatus.OK).json({ message: i18n.__('message.password_reset_link_sent') });

      // Create a password reset token using the Token model
      const resetTokenObj = await Token.createToken(user.id, 'password_reset');

      // Generate the reset link
      const resetUrl = `/resetPassword?token=${resetTokenObj.token}`;

      // Render the email content
      const emailContent = await renderEmailTemplate('resetPassword', { resetUrl });

      // Send the reset link to the user's email
      sendEmail(user.email, i18n.__('email.password_reset_request'), emailContent);

      return res.status(httpStatus.OK).json({ message: i18n.__('message.password_reset_link_sent') });

    } catch (error) {
      next(error);
    }
  }
];

exports.resetPassword = [
  // Validate the new password and confirm password
  check('password')
    .exists().withMessage(i18n.__('validation.password_required'))
    .isLength({ min: parseInt(config.appConfig.user.minPasswordLength) }).withMessage(i18n.__('validation.password_length', config.appConfig.user.minPasswordLength)),
  check('confirm_password')
    .exists().withMessage(i18n.__('validation.confirm_password_required'))
    .custom((confirm_password, { req }) => {
      if (confirm_password !== req.body.password) throw new ApiError(i18n.__('validation.password_mismatch'));
      return true;
    }),

  async (req, res, next) => {
    try {

      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg);

      // Retrieve token from the query parameters
      const token = req.query.token;
      if (!token) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('validation.token_missing'));

      // Validate token
      const tokenRecord = await Token.findOne({
        where: {
          token,
          type: 'password_reset',
          used: false,
          expiry_date: { [Op.gte]: new Date() },
        },
      });

      if (!tokenRecord) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.invalid_expired_token'));

      // Retrieve user
      const user = await User.findOne({ where: { id: tokenRecord.user_id } });
      if (!user) throw new ApiError(httpStatus.NOT_FOUND, i18n.__('error.user_not_found'));

      // Update password
      user.password = req.body.password;
      await user.save();

      // Mark the token as used
      tokenRecord.used = true;
      await tokenRecord.save();

      // Respond
      res.status(httpStatus.OK).json({ success: true, message: i18n.__('success.password_updated') });

    } catch (error) {
      next(error);
    }
  },
];
