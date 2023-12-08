const jwt = require('jsonwebtoken');
const config = require('../config/config.js');

/**
 * generateAccessToken - Function to generate an access token
 *
 * @param {Object} user - The user object. Must contain an 'id' field.
 * @returns {String} - The generated access token
 *
 * The access token is a JWT that encodes the user's ID and is signed with a secret key.
 * The token expires in 15 minutes.
 * The client must send this token in the Authorization header when making requests to protected resources.
 */

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.full_name,
      avatar: user.avatar,
      isVerified: user.isVerified,
      roles: user.roles
    },
    config.appConfig.secret.accessToken,
    { 
      expiresIn: config.appConfig.expiration.accessToken,
      algorithm: config.appConfig.algorithm
    }
  );
};

  

/**
 * generateRefreshToken - Function to generate a refresh token
 *
 * @param {Object} user - The user object. Must contain an 'id' field.
 * @returns {String} - The generated refresh token
 *
 * The refresh token is a JWT that encodes the user's ID and is signed with a different secret key.
 * The token expires in 7 days.
 * The client sends this token only when the access token has expired, to request a new access token.
 * This token should be stored securely and should not be sent with each request like the access token.
 */

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    config.appConfig.secret.refreshToken,
    {
      expiresIn: config.appConfig.expiration.refreshToken,
      algorithm: config.appConfig.algorithm
    }
  );
};


module.exports = {
  generateAccessToken,
  generateRefreshToken
};
