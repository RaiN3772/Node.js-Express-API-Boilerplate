// Import necessary modules and models for authentication and validation
const passport = require('passport');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const { User, AuthAttempt, Token } = require('../models/initModels');
const { check, validationResult } = require('express-validator');
const { generateAccessToken, generateRefreshToken } = require('../helpers/Token');
const ApiError = require('../helpers/ApiError');
const i18n = require('../config/i18n');
const config = require('../config/config.js');

// User login controller
exports.login = [
  check('email')
    .exists().withMessage(i18n.__('validation.email_required'))
    .trim()
    .escape()
    .notEmpty().withMessage(i18n.__('validation.email_required'))
    .normalizeEmail()
    .isEmail().withMessage(i18n.__('validation.invalid_email')),
  check('password')
    .exists().withMessage(i18n.__('validation.password_required'))
    .notEmpty().withMessage(i18n.__('validation.password_required')),
  check('RememberMe')
    .optional()
    .isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return next(new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg));

      const { email: UserEmail, RememberMe } = req.body;
      const UserIP = req.ip;

      // Handle maximum login attempts logic
      await handleMaxLoginAttempts(UserEmail, UserIP);

      passport.authenticate('local', async (authError, user) => {
        try {
          if (authError) return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, i18n.__('authentication.process_failed')));

          if (!user) {
            await updateAuthAttempts(UserEmail, UserIP);
            return next(new ApiError(httpStatus.UNAUTHORIZED, i18n.__('error.invalid_email_password')));
          }

          req.login(user, async (loginError) => {
            try {
              if (loginError) return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, i18n.__('authentication.login_failed')));

              const roles = (await user.getRoles()).map(role => role.name);
              await updateUserLoginDetails(user, req.ip);

              // Add roles to user object
              user.roles = roles;

              const accessToken = generateAccessToken(user);
              const refreshToken = generateRefreshToken(user);

              // Insert refreshToken into the database with type as 'refresh'
              await Token.create({
                user_id: user.id,
                token: refreshToken,
                type: 'refresh_token',
                expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days in future
                createdAt: new Date(),
                used: false
              });

              // Construct the user object to be returned
              const returnedUser = {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                avatar: user.avatar,
                isVerified: user.isVerified,
                roles: user.roles
              };

              // Respond with a success message and user details including the token
              return res.json({
                success: true,
                message: i18n.__('authentication.success'),
                user: returnedUser,
                accessToken: accessToken,
                refreshToken: refreshToken,
              });
            } catch (loginProcessError) {
              return next(loginProcessError);
            }
          });
        } catch (authProcessError) {
          return next(authProcessError);
        }
      })(req, res, next);
    } catch (outerError) {
      return next(outerError);
    }
  }
];

// Handle the maximum login attempts by checking and updating the AuthAttempt model
async function handleMaxLoginAttempts(UserEmail, UserIP) {
  const authAttempt = await AuthAttempt.findOne({ where: { email: UserEmail, ip_address: UserIP } });

  if (authAttempt && authAttempt.attempts >= config.appConfig.user.maxLoginAttempts) {
    const timeSinceLastAttempt = new Date() - new Date(authAttempt.last_attempt);
    if (timeSinceLastAttempt < config.appConfig.user.accountLockDuration * 60 * 1000) {
      throw new ApiError(httpStatus.TOO_MANY_REQUESTS, i18n.__('authentication.too_many_login_attempts'));
    }
    await authAttempt.update({ attempts: 0 });
  }
}

// Update or create a new record in AuthAttempt model after a failed login
async function updateAuthAttempts(UserEmail, UserIP) {
  const authAttempt = await AuthAttempt.findOne({ where: { email: UserEmail, ip_address: UserIP } });
  if (authAttempt) {
    await authAttempt.increment('attempts');
    await authAttempt.update({ last_attempt: new Date() });
  } else await AuthAttempt.create({ email: UserEmail, ip_address: UserIP, attempts: 1 });

}

// Update the user's last login time and IP after a successful login
async function updateUserLoginDetails(user, ip) {
  user.last_login = new Date();
  user.last_ip = ip;
  await user.save();
}

// User logout controller
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Log out the user and destroy their session
    req.logout();
    req.session.destroy();
    // Update the last_online time for the user
    await User.update({ last_online: new Date() }, { where: { id: userId } });
    res.json({ success: true, message: i18n.__('authentication.logout_success') });
  } catch (error) {
    next(error);
  }
};
