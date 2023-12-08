const sequelize = require('../config/database');
const { User, UserSetting, Token } = require('../models/initModels');
const httpStatus = require('http-status');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const path = require('path');
const { validateFields } = require('../helpers/validationHelper');
const { sendEmail } = require('../helpers/mailer');
const { generateAccessToken } = require('../helpers/Token');
const ApiError = require('../helpers/ApiError');
const { renderEmailTemplate } = require('../helpers/emailHelper');

exports.getUser = async (req, res, next) => {

    try {

        // Handle validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg);

        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password', 'created_ip', 'last_ip', 'updatedAt'] },
            include: [{
                model: UserSetting,
                as: 'settings',
                attributes: ['hide_email', 'hide_last_login']
            }]
        });

        if (!user) throw new ApiError(httpStatus.NOT_FOUND, i18n.__('error.user_not_found'));

        // Check settings and modify user data accordingly
        if (user.settings.hide_email) user.email = undefined;
        if (user.settings.hide_last_login) user.last_login = undefined;

        // Remove the settings property from user object before sending response
        delete user.dataValues.settings;

        res.json(user);
    } catch (error) {
        next(error)
    }
};

exports.updateUserDetails = async (req, res, next) => {

    try {

        // Check if at least one field exists: full_name, bio, or avatar
        if (
            (!req.body || Object.keys(req.body).length === 0) &&
            (!req.file || !req.file.fieldname)
        ) {
            throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.no_data_provided'));
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg)

        const userId = req.user.id;

        validateFields(req.body, ['full_name', 'bio']);

        const updatedFields = { ...req.body };
        if (req.file && req.file.fieldname === 'avatar') updatedFields.avatar = path.basename(req.file.path);
        await User.update(updatedFields, { where: { id: userId } });
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        // Handling validation errors from Sequelize
        if (error.name === 'SequelizeValidationError') throw new ApiError(httpStatus.BAD_REQUEST, error.errors)
        next(error);
    }
};

exports.updateUserSetting = async (req, res, next) => {

    try {
        // Check if the request body is empty
        if (!req.body || Object.keys(req.body).length === 0) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.no_data_provided'))

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg)

        // Allow only specific fields to be updated
        validateFields(req.body, ['hide_email', 'hide_last_login']);

        // Find or create a settings record for the user
        let [userSettings, created] = await UserSetting.findOrCreate({
            where: { user_id: req.user.id },
            defaults: req.body // This inserts the settings if they don't exist yet
        });

        // If the settings already exist, update them
        if (!created) await userSettings.update(req.body);
        return res.json({ success: true, message: i18n.__('success.settings_updated') });
    } catch (error) {
        next(error);
    }
};

exports.updateUserPassword = async (req, res, next) => {

    try {

        // Use 'validationResult' to gather any validation errors from the body checks above.
        const errors = validationResult(req);

        // If there are any validation errors, send a 400 response with the first error message.
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg)

        // Find the user by their ID from the request.
        const user = await User.findOne({ where: { id: req.user.id } });

        // If the user is not found, return a 404 error.
        if (!user) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.user_not_found'));

        // Validate the provided 'old_password' against the user's current password in the database.
        const isValidOldPassword = await user.validPassword(req.body.old_password);

        // If the old password is not valid, return an error.
        if (!isValidOldPassword) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.invalid_old_password'))

        // Hash the new password and set it to the user's 'password' field.
        user.password = req.body.new_password;

        // Save the updated user to the database.
        await user.save();

        // Send a success response indicating that the password has been updated.
        res.json({ success: true, message: i18n.__('success.password_update') });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.updateUserEmail = async (req, res, next) => {

    let transaction;

    try {
        // Validate input using express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg)

        const { new_email } = req.body;
        const user = req.user;

        // Begin a new transaction
        transaction = await sequelize.transaction();

        // Check for an existing user with the new email
        const existingUser = await User.findOne({ where: { email: new_email } });
        if (existingUser) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.email_in_use'))

        // Generate a verification token
        const emailUpdateToken = await Token.createToken(user.id, 'email_verification', transaction);

        // Update the email field for the user
        user.email = new_email;
        user.isVerified = false;
        await user.save({ transaction });

        // Generate a new access token
        const newAccessToken = generateAccessToken(user);

        // Send Email Confirmation
        const verificationLink = `/verifyEmail?token=${emailUpdateToken.token}`;

        // Render the email content
        const emailContent = await renderEmailTemplate('verifyEmail', { verificationLink });
        
        await sendEmail(new_email, i18n.__('email.confirm_email_subject'), emailContent);

        // Commit transaction
        await transaction.commit();

        // Return the new access token and a success message
        res.json({ success: true, message: i18n.__('success.email_updated'), accessToken: newAccessToken });

    } catch (error) {
        // Rollback transaction
        if (transaction) await transaction.rollback();
        next(error);
    }
};