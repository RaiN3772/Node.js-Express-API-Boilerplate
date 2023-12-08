const config = require('../config/config.js');
const ApiError = require('../helpers/ApiError');
const httpStatus = require('http-status');
const i18n = require('../config/i18n');


// Utility function to check if a user is a superadmin

/**
 * Checks if the provided user ID is a superadmin.
 * 
 * @param {number} userId - The ID of the user to check.
 * @throws {ApiError} Throws an error if the user ID is invalid.
 * @returns {boolean} True if the user is a superadmin, false otherwise.
 */
function isSuperadmin(userId) {
    // Ensure that the userId is a number and not undefined or null
    if (typeof userId !== 'number') {
        throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.invalid_user_id'));
    }

    // Retrieve the list of superadmin IDs from the configuration
    // Check if the provided user ID is in the list of superadmin IDs
    return config.appConfig.superadmins.includes(userId);
}

module.exports = isSuperadmin;