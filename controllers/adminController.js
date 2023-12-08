const { User, Role, Permission, UserRole, AuditLog } = require('../models/initModels');
const httpStatus = require('http-status');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const isSuperadmin = require('../helpers/isSuperadmin.js');
const { Op } = require('sequelize');
const ApiError = require('../helpers/ApiError');
const { escape } = require('sequelize');
const i18n = require('../config/i18n');
const config = require('../config/config.js');

exports.getUsers = async (req, res, next) => {
    try {

        // Get the 'limit' from query parameters. This specifies how many users you want to retrieve.
        // If not provided, it defaults to 10.
        const limit = parseInt(req.query.limit) || 10;

        // Get the 'offset' from the query parameters. This specifies the starting point from which users should be fetched.
        // It's used for pagination. If not provided, it defaults to 0.
        const offset = parseInt(req.query.offset) || 0;

        // Use Sequelize's findAll method to fetch the users from the database.
        // Limit and offset are applied for pagination.
        // We exclude the 'password' field from the results for security reasons.

        const users = await User.findAll({
            limit: limit,
            offset: offset,
            attributes: { exclude: ['password'] }
        });

        // Count the total number of users in the database. This is useful for frontend pagination.
        const totalUsers = await User.count();

        // Respond with a success message, the fetched users, and pagination data.
        res.json({
            success: true,
            users: users,
            pagination: {
                limit: limit,
                offset: offset,
                total: totalUsers
            }
        });

    } catch (error) {
        // If anything goes wrong during the database operations, respond with an error.
        next(error);
    }
};

exports.getUserById = async (req, res, next) => {

    try {
        // Handle validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg);


        /* 
        const user = await User.findByPk(userId, {
            attributes: ['id', 'email', 'full_name', 'created_ip', 'last_ip'], // specify the fields you want to fetch
        });
        */

        // Fetch user
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) throw new ApiError(httpStatus.NOT_FOUND, i18n.__('error.user_not_found'));
        res.status(200).send({ success: true, user });
    } catch (error) {
        next(error);
    }
};

exports.updateUserById = async (req, res, next) => {

    try {
        // Check if req.body exists and is not empty
        if (!req.body || Object.keys(req.body).length === 0) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.no_data_provided'));

        // Check if there are any validation errors from the preceding validation middleware.
        const errors = validationResult(req);
        // If there are validation errors, send a 400 status code with the errors.
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg);

        // Extract the user ID from the request's parameters.
        const userId = req.params.id;

        // Store the incoming request body data to be used for updating the user.
        const updateData = req.body;

        // Define a whitelist of fields that can be updated.
        const allowedFields = ['email', 'full_name', 'password', 'bio', 'remove_avatar'];

        // Get the keys (field names) from the incoming update data.
        const updates = Object.keys(updateData);

        // Check if all provided fields in the updateData are in the allowedFields list.
        const isValidOperation = updates.every(update => allowedFields.includes(update));

        // If the client provides any fields not in the allowedFields list, return an error.
        if (!isValidOperation) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.invalid_operation'));

        // If remove_avatar is set to true, set the avatar to the default avatar and then delete remove_avatar from updateData.
        if (updateData.remove_avatar) {
            updateData.avatar = config.appConfig.avatar.default;
            delete updateData.remove_avatar;
        }

        // Fetch user
        const user = await User.findByPk(userId);
        if (!user) throw new ApiError(httpStatus.NOT_FOUND, i18n.__('error.user_not_found'));
        // Update user
        await user.update(updateData);
        // Log the update action
        const logInfo = `Updated user with ID: ${userId}. Updated fields: ${updates.join(", ")}.`;
        await AuditLog.log(req, logInfo);
        // Send a response. 
        const userResponse = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
        res.json({ success: true, message: i18n.__('success.user_updated'), user: userResponse });
    } catch (error) {
        next(error);
    }
};

exports.deleteUserById = async (req, res, next) => {

    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg)

        // Fetch the user by the provided ID
        const user = await User.findByPk(req.params.id);

        // If the user doesn't exist, return a 404 not found status
        if (!user) throw new ApiError(httpStatus.NOT_FOUND, i18n.__('error.user_not_found'));

        // Check if the user is a superadmin
        // If the user is a superadmin, return a 403 forbidden status
        if (isSuperadmin(user.id)) throw new ApiError(httpStatus.FORBIDDEN, i18n.__('error.cannot_delete_superadmin'));

        // Use the user details for the log info before deleting
        const userInfo = `Deleted user ${user.full_name} (ID: ${user.id})`;

        // Delete the user
        await user.destroy();

        // Log the action
        await AuditLog.log(req, userInfo);

        // Respond with a success message
        return res.json({ success: true, message: i18n.__('success.user_deleted') });
    } catch (error) {
        next(error);
    }
};

exports.getLogs = async (req, res, next) => {
    try {
        // Pagination
        const limit = parseInt(req.query.limit) || 10;  // default limit to 10 logs
        const offset = parseInt(req.query.offset) || 0; // default offset to 0

        // Sorting
        const orderBy = req.query.orderBy || 'action_date'; // default sorting by action_date
        const order = req.query.order === 'asc' ? 'ASC' : 'DESC'; // default order to DESC

        // Filtering
        let where = {};

        // Check if userId is provided in query params
        if (req.query.UserID) where.user_id = req.query.UserID;

        // Query the logs with the options
        const logs = await AuditLog.findAll({
            limit: limit,
            offset: offset,
            order: [[orderBy, order]],
            where: where,
            include: [
                {
                    model: User,
                    attributes: ['full_name', 'avatar']
                }
            ]
        });

        // Fetch total count for pagination info
        const totalLogs = await AuditLog.count({ where: where });

        res.json({
            success: true,
            logs,
            pagination: {
                totalLogs: totalLogs,
                limit: limit,
                offset: offset,
                totalPages: Math.ceil(totalLogs / limit)
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.getRoles = async (req, res, next) => {
    try {
        // Fetch all roles along with their associated permissions and users
        const roles = await Role.findAll({
            include: [
                {
                    model: Permission,
                    attributes: ['name'],
                    through: { attributes: [] }  // This will exclude the join table (RolePermission) info in the response
                },
                {
                    model: User,
                    attributes: ['id', 'full_name', 'avatar'],
                    through: { attributes: [] }  // This will exclude the join table (UserRole) info in the response
                }
            ]
        });

        res.json({ success: true, roles });

    } catch (error) {
        next(error);
    }
};

exports.addRoles = async (req, res, next) => {

    try {

        // Check if req.body exists and is not empty
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.no_data_provided'));
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg);


        const { name, description, permissions } = req.body;

        let existingPermissions;
        // Check if role name already exists
        const existingRole = await Role.findOne({ where: { name } });
        if (existingRole) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.role_name_exists'));


        // Validate that all permissions exist (only if they are provided)
        let addedPermissions = []; // Define an empty array to store added permissions
        if (permissions) {
            existingPermissions = await Permission.findAll({ where: { id: permissions } });

            if (existingPermissions.length !== permissions.length) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.invalid_permissions'));

            // Extract required details (id, name) of the permissions
            addedPermissions = existingPermissions.map(permission => ({ id: permission.id, name: permission.name }));
        }

        // Create role
        const role = await Role.create({ name, description });

        // Associate permissions to role (only if they are provided)
        if (permissions) await role.setPermissions(existingPermissions);

        // Log the creation of the new role
        await AuditLog.log(req, `Created a new role: ${name}`);

        // Return the response with added permissions if available
        res.status(201).json({
            success: true,
            message: i18n.__('success.role_created'),
            role,
            permissions: addedPermissions
        });
    } catch (error) {
        next(error);
    }

};

exports.updateRoleByID = async (req, res, next) => {

    try {

        // Check if req.body exists and is not empty
        if (!req.body || Object.keys(req.body).length === 0) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.no_data_provided'));

        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg);

        const { name, description, permissions } = req.body;

        let existingPermissions;
        // Find the role by ID
        const roleToUpdate = await Role.findByPk(req.params.id);
        if (!roleToUpdate) throw new ApiError(httpStatus.NOT_FOUND, i18n.__('error.role_not_found'));

        // Check if a different role with the same name already exists
        const anotherExistingRole = await Role.findOne({ where: { name, id: { [Op.ne]: req.params.id } } });
        if (anotherExistingRole) throw new ApiError(httpStatus.NOT_FOUND, i18n.__('error.role_name_exists'));

        let addedPermissions = [];
        if (permissions) {
            existingPermissions = await Permission.findAll({ where: { id: permissions } });
            if (existingPermissions.length !== permissions.length) throw new ApiError(httpStatus.NOT_FOUND, i18n.__('error.invalid_permissions'));
            // Extract required details (id, name) of the permissions
            addedPermissions = existingPermissions.map(permission => ({ id: permission.id, name: permission.name }));
        }

        // Update role details
        roleToUpdate.name = name;
        roleToUpdate.description = description;
        await roleToUpdate.save();

        // Update role's permissions (if they are provided)
        if (permissions) await roleToUpdate.setPermissions(existingPermissions);

        // Log the update of the role
        await AuditLog.log(req, `Updated role: ${name}`);

        // Return the response with updated permissions if available
        res.status(200).json({
            success: true,
            message: i18n.__('success.role_updated'),
            role: roleToUpdate,
            permissions: addedPermissions
        });

    } catch (error) {
        next(error);
    }
};

exports.deleteRoleById = async (req, res, next) => {
    try {
        // Find the role by its ID
        const role = await Role.findOne({ where: { id: req.params.id } });

        // If the role doesn't exist, return an error
        if (!role) throw new ApiError(httpStatus.NOT_FOUND, i18n.__('error.role_not_found'));

        // remove associations before deletion
        await role.setPermissions([]);

        // Delete the role
        await role.destroy();

        // Log the deletion of the role
        await AuditLog.log(req, `Deleted role: ${role.name}`);

        // Return a success response
        res.status(200).json({ success: true, message: i18n.__('success.role_deleted') });
    } catch (error) {
        next(error);
    }
};

exports.assignUserRole = async (req, res, next) => {

    try {

        // Check if req.body exists and is not empty
        if (!req.body || Object.keys(req.body).length === 0) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.no_data_provided'));

        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg);
        
        const { userId, roleId } = req.body;

        // Check if the user exists
        const user = await User.findByPk(userId);
        if (!user) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.user_not_found'))

        // Check if the role exists
        const role = await Role.findByPk(roleId);
        if (!role) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.role_not_found'))

        // Check if the user already has this role
        const existingAssignment = await UserRole.findOne({
            where: {
                user_id: userId,
                role_id: roleId
            }
        });

        if (existingAssignment) {
            // User already has this role, so unassign
            await existingAssignment.destroy();
            // Log the removal of the role from the user
            await AuditLog.log(req, `Removed role ID ${roleId} from user ID ${userId}`);
            // Return a success response
            return res.json({ success: true, message: i18n.__('success.role_removed_from_user') });
        }

        // If user doesn't have this role, assign it
        const assignedRole = await UserRole.create({
            user_id: userId,
            role_id: roleId
        });

        // Log the assignment of the role to the user
        await AuditLog.log(req, `Assigned role ID ${roleId} to user ID ${userId}`);

        // Return a success response
        res.status(httpStatus.OK).json({ success: true, message: i18n.__('success.role_assigned_to_user'), assignedRole });
    } catch (error) {
        next(error);
    }
};

exports.searchUser = async (req, res, next) => {

    try {
        
        // Extract the search query from the request's query parameters.
        const query = escape(req.query.q);
        if (!query) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.search_query_required'));

        // Search for users
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { full_name: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                    { created_ip: { [Op.like]: `%${query}%` } },
                    { last_ip: { [Op.like]: `%${query}%` } }
                ]
            },
            attributes: { exclude: ['password'] }
        });

        if (users.length === 0) throw new ApiError(httpStatus.NOT_FOUND, i18n.__('error.user_not_found'));
        res.status(200).send({ success: true, users });
    } catch (error) {
        next(error);
    }
}