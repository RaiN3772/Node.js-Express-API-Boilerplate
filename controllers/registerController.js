// Import necessary modules and models for authentication and validation
const sequelize = require('../config/database');
const { User, UserSetting, Role, Token } = require('../models/initModels');
const httpStatus = require('http-status');
const { check, validationResult } = require('express-validator');
const { sendEmail } = require('../helpers/mailer');
const ApiError = require('../helpers/ApiError');
const { renderEmailTemplate } = require('../helpers/emailHelper');
const i18n = require('../config/i18n');
const config = require('../config/config.js');

// User registration controller
exports.register = [
    check('full_name')
        .exists().withMessage(i18n.__('validation.full_name_required'))
        .trim()
        .escape()
        .isLength({ min: 3, max: 50 })
        .withMessage(i18n.__('validation.full_name_length'))
        .matches(/^[a-zA-Z\s\-']+$/)
        .withMessage(i18n.__('validation.full_name_invalid_chars')),
    check('email')
        .exists().withMessage(i18n.__('validation.email_required'))
        .trim()
        .escape()
        .normalizeEmail()
        .isEmail().withMessage(i18n.__('validation.invalid_email'))
        .custom(async value => {
            const user = await User.findOne({ where: { email: value } });
            if (user) throw new Error(i18n.__('validation.email_in_use'));
        }),
    // Password validation
    check('password')
        .exists().withMessage(i18n.__('validation.password_required'))
        .isLength({ min: parseInt(config.appConfig.user.minPasswordLength) })
        .withMessage(i18n.__('validation.password_length', config.appConfig.user.minPasswordLength)),
    // Comlpex Password
    //.matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/)
    //.withMessage('Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),

    // Confirm password validation
    check('confirm_password')
        .exists().withMessage(i18n.__('validation.confirm_password_required'))
        .custom((confirm_password, { req }) => {
            if (confirm_password !== req.body.password) throw new Error(i18n.__('validation.password_mismatch'));
            return true;
        }),

    async (req, res, next) => {

        let transaction;

        try {

            // Check if the validations resulted in any errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) throw new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg);

            transaction = await sequelize.transaction();  // Begin a new transaction

            // Create a new user with the provided data and IP address details
            const newUser = await User.create({
                email: req.body.email,
                password: req.body.password,
                full_name: req.body.full_name,
                created_ip: req.ip,
                last_ip: req.ip,
            }, { transaction });

            // Create the associated user setting upon user registration
            await UserSetting.create({
                user_id: newUser.id,
            }, { transaction });  // Add transaction to the setting creation

            // Fetch the default role from environment variable and assign to the user
            const defaultRole = await Role.findOne({ where: { name: config.appConfig.role.default } });
            if (defaultRole) await newUser.addRole(defaultRole.id, { transaction });

            // Generate a verification token
            const verificationToken = await Token.createToken(newUser.id, 'email_verification', transaction);

            // Construct verification link
            const verificationLink = `/verifyEmail?token=${verificationToken.token}`;

            // Render the email content
            const emailContent = await renderEmailTemplate('verifyEmail', { verificationLink });

            // Send verification email with the link
            sendEmail(newUser.email, i18n.__('email.verify_email_subject'), emailContent);

            // Commit the changes
            await transaction.commit();

            res.json({ success: true, message: i18n.__('registration.success') });

        } catch (error) {
            if (transaction) await transaction.rollback();  // Rollback the transaction in case of errors
            // Handle specific database errors or respond with a general error
            if (error.name === 'SequelizeUniqueConstraintError') throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('errors.email_in_use'));
            else if (error.name === 'SequelizeValidationError') throw new ApiError(httpStatus.BAD_REQUEST, error.errors[0].message);
            next(error);
        }
    }
];