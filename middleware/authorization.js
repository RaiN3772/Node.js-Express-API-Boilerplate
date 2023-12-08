// Import necessary models from the database
const { User, Role, Permission } = require('../models/initModels');
const httpStatus = require('http-status');
const ApiError = require('../helpers/ApiError');
const config = require('../config/config.js');
const isSuperadmin = require('../helpers/isSuperadmin.js');

// This function is a middleware factory. When you call it with a specific permission,
// it returns a middleware that checks if the authenticated user has that permission.
module.exports = (requiredPermission) => {
  return async (req, res, next) => {

    try {
      // Check if the user is a superadmin
      if (isSuperadmin(req.user.id)) {
        // If the user is a superadmin, allow the request to proceed without further checks
        return next();
      }

      // If not a superadmin, proceed with the usual permission checks

      // Find the user associated with the incoming request.
      // 'req.user.id' typically comes from the decoded JWT or session after a user has authenticated.
      const user = await User.findByPk(req.user.id, {
        // Include associated roles of the user
        include: {
          model: Role,
          // And then include the permissions associated with those roles
          include: {
            model: Permission
          }
        }
      });

      // Extract all permissions associated with the user.
      // 'reduce' function is used to flatten the permissions into a single array.
      // It iterates over each role, and for each role, it concatenates the permissions' names.
      const permissions = user.Roles.reduce((all, role) => {
        return all.concat(role.Permissions.map(p => p.name));
      }, []);

      // Check if the user's permissions include the required permission.
      if (permissions.includes(requiredPermission)) {
        // If user has the required permission, proceed to the next middleware or route handler.
        return next();
      } else {
        // If the user does not have the required permission, return a 403 Forbidden response.
        throw new ApiError(httpStatus.FORBIDDEN, i18n.__('error.forbidden'))
      }

    } catch (error) {
      // If any error occurs, forward the error to the next error handling middleware.
      next(error);
    }
  };
};