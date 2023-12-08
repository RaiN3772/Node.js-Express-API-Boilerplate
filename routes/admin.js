const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const permission = require('../middleware/authorization');
const { body, param } = require('express-validator');
const adminController = require('../controllers/adminController');
const i18n = require('../config/i18n');
const config = require('../config/config.js');

// Middleware to ensure user access
router.use(protect);

// Get all users
router.get('/getUsers', permission('view_users'), adminController.getUsers);

// Get Specific User
router.get('/getUser/:id', permission('view_users'), [param('id').isInt().withMessage(i18n.__('error.user_not_found'))], adminController.getUserById);


// Update User By ID
router.put('/updateUsers/:id',
    permission('update_users'),
    // Input validation
    [
        param('id').isInt().withMessage(i18n.__('error.user_not_found')),

        body('email')
            .trim()
            .optional()
            .isEmail().withMessage('Invalid email format')
            .isLength({ max: 320 }).withMessage(i18n.__('validation.email_length')),

        body('password')
            .optional()
            .isLength({ min: parseInt(config.appConfig.user.minPasswordLength) }).withMessage(i18n.__('validation.password_length', config.appConfig.user.minPasswordLength)),

        body('full_name')
            .trim()
            .optional()
            .isLength({ min: 3, max: 100 }).withMessage(i18n.__('validation.full_name_length'))
            .matches(/^[a-zA-Z\s\-']+$/).withMessage(i18n.__('validation.full_name_invalid_chars')),

        body('bio')
            .trim()
            .optional()
            .isLength({ max: 500 }).withMessage(i18n.__('validation.bio_length')),
        body('remove_avatar')
            .optional()
            .isBoolean(),
    ],
    adminController.updateUserById
);


// Delete User By ID
router.delete('/deleteUsers/:id', permission('delete_users'), [param('id').isInt().withMessage(i18n.__('error.user_not_found'))], adminController.deleteUserById);

/**
 * Get all Logs
 *
 * Purpose:
 * This endpoint is designed to retrieve audit logs from the system. It allows for pagination, 
 * sorting, and filtering based on various query parameters.
 *
 * Query Parameters:
 * - limit: Specifies the number of logs to retrieve. Defaults to 10 if not provided.
 *      Example: /getLogs?limit=20 (Fetches 20 logs)
 *
 * - offset: Specifies the starting point from which logs should be fetched, useful for pagination.
 *      Defaults to 0 if not provided.
 *      Example: /getLogs?offset=10 (Skips the first 10 logs)
 *
 * - orderBy: Determines the field by which the logs should be sorted. Defaults to 'action_date'.
 *      Example: /getLogs?orderBy=action_date (Sorts logs by action_date field)
 *
 * - order: Specifies the order of the sorting. Can be 'asc' (ascending) or 'desc' (descending). 
 *      Defaults to 'desc' if not provided.
 *      Example: /getLogs?order=asc (Sorts logs in ascending order)
 *
 * - UserID: Allows filtering logs by a specific user ID.
 *      Example: /getLogs?UserID=5 (Fetches logs for the user with ID 5)
 *
 * Response:
 * The endpoint returns a JSON object containing:
 * - Success status.
 * - The retrieved logs.
 * - Pagination info which includes total log count, provided limit and offset, and the total number of pages.
 */
router.get('/getLogs', permission('view_logs'), adminController.getLogs);

// Get all Roles
router.get('/getRoles', permission('view_roles'), adminController.getRoles);

// Add New Role
router.post('/addRoles', permission('manage_roles'),
    [
        body('name')
            .exists()
            .trim()
            .notEmpty()
            .withMessage(i18n.__('validation.role_required'))
            .isLength({ min: 3, max: 50 }).withMessage(i18n.__('validation.role_length')),
        body('description')
            .trim()
            .optional()
            .isString()
            .isLength({ max: 500 }).withMessage(i18n.__('validation.role_description_length')),
        body('permissions')
            .optional()
            .isArray(),
    ], adminController.addRoles
);

// Update Role By ID
router.put('/updateRoles/:id', permission('manage_roles'),
    [
        param('id').isInt().withMessage(i18n.__('error.role_not_found')),
        body('name')
            .exists()
            .trim()
            .notEmpty()
            .withMessage(i18n.__('validation.role_required'))
            .isLength({ min: 3, max: 50 }).withMessage(i18n.__('validation.role_length')),
        body('description')
            .trim()
            .optional()
            .isString()
            .isLength({ max: 500 }).withMessage(i18n.__('validation.role_description_length')),
        body('permissions')
            .optional()
            .isArray(),
    ], adminController.updateRoleByID
);

// Delete Role By ID
router.delete('/deleteRoles/:id', permission('manage_roles'), [ param('id').isInt().withMessage(i18n.__('error.role_not_found')) ], adminController.deleteRoleById);

// Assign User to Role
router.post('/assignUserRole', permission('assign_roles'),
    [
        body('userId')
            .isInt().withMessage(i18n.__('error.user_not_found')),
        body('roleId')
            .isInt().withMessage(i18n.__('error.role_not_found'))
    ], adminController.assignUserRole
);

/**
 * Search User
 * 
 * Purpose:
 * This endpoint allows for searching users based on a query string. The search checks multiple fields such as
 * the user's full name, email address, creation IP, and last known IP. It's primarily designed to aid admin users
 * in quickly locating user accounts based on partial matches.
 * 
 * Required Middleware:
 * - permission('view_users'): Ensures that only users with the 'view_users' permission can access this route.
 *
 * Query Parameters:
 * - q: The search query string. It can be a partial match for a user's full name, email address, or either of their IPs.
 *      Example: /searchUser?q=john (Searches for users with 'john' in their name, email, or IP addresses.)
 *
 * Response:
 * The endpoint returns a JSON object containing:
 * - Success status.
 * - The users matching the search query, excluding their password for security.
 * - If no users are found, it will return a 404 status with a message indicating that no users were found.
 * 
 * Potential Errors:
 * - If the search query parameter isn't provided, the route will return a 400 status indicating that the search query is required.
 * - In case of a server or database error, a 500 status is returned with an error message.
 */
router.get('/searchUser', permission('view_users'), adminController.searchUser);

module.exports = router;
