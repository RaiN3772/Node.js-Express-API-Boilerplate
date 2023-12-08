const express = require('express');
const router = express.Router();
const { User } = require('../models/initModels');
const protect = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');
const multer = require('../middleware/multer');
const userController = require('../controllers/userController');
const httpStatus = require('http-status');
const ApiError = require('../helpers/ApiError');
const i18n = require('../config/i18n');
const config = require('../config/config.js');

// Middleware to ensure user access
router.use(protect);

// Get User By ID
router.get('/getUser/:id', [param('id').isInt().withMessage(i18n.__('error.user_not_found'))], userController.getUser);

// Update User Details
const multerAvatar = multer('avatar', [config.appConfig.avatar.allowedTypes], parseInt(config.appConfig.avatar.maxSize));
router.put('/updateUserDetails', (req, res, next) => {
    multerAvatar.single('avatar')(req, res, (err) => {
        if (err) return next(new ApiError(httpStatus.BAD_REQUEST, err.message));
        next();  // proceed to the next middleware if no error
    });
},
    [
        body('full_name')
            .trim()
            .escape()
            .optional()
            .isLength({ min: 3, max: 50 })
            .withMessage(i18n.__('validation.full_name_length'))
            .matches(/^[a-zA-Z\s\-']+$/)
            .withMessage(i18n.__('validation.full_name_invalid_chars')),
        body('bio')
            .trim()
            .escape()
            .optional()
            .isLength({ max: 500 }).withMessage(i18n.__('validation.bio_length')),
    ],
    userController.updateUserDetails
);

// Update User Setting
router.put('/updateUserSetting',
    [
        body('hide_email')
            .optional()
            .isBoolean(),

        body('hide_last_login')
            .optional()
            .isBoolean()
    ],
    userController.updateUserSetting
);

// Endpoint to handle updating user's password.
router.put('/updateUserPassword',
    [
        // Check if the 'old_password' field exists in the request and provide a message if it doesn't.
        body('old_password')
            .exists()
            .withMessage(i18n.__('validation.old_password_required')),

        // Check if the 'new_password' field exists in the request and provide a message if it doesn't.
        // Ensure the length of the 'new_password' field is at least 8 characters.
        // Additionally, verify that the 'new_password' isn't the same as the 'old_password'.
        body('new_password')
            .exists().withMessage(i18n.__('validation.new_password_required'))
            .isLength({ min: parseInt(config.appConfig.user.minPasswordLength) }).withMessage(i18n.__('validation.new_password_length', config.appConfig.user.minPasswordLength))
            .custom((value, { req }) => {
                if (value === req.body.old_password) throw new Error(i18n.__('validation.new_password_old'));
                return true;
            }),

        // Check if the 'confirm_password' field exists in the request and provide a message if it doesn't.
        // Ensure that the 'confirm_password' matches the 'new_password' field.
        body('confirm_password')
            .exists().withMessage(i18n.__('validation.confirm_new_password'))
            .custom((value, { req }) => {
                if (value !== req.body.new_password) throw new Error(i18n.__('validation.password_mismatch'));
                return true;
            })
    ],
    userController.updateUserPassword
);


router.put('/updateUserEmail',
    [
        body('new_email')
            .exists().withMessage(i18n.__('validation.email_required'))
            .trim()
            .escape()
            .normalizeEmail()
            .isEmail().withMessage(i18n.__('validation.invalid_email'))
            .custom(async value => {
                const user = await User.findOne({ where: { email: value } });
                if (user) throw new Error(i18n.__('error.email_in_use'));
            })
    ], userController.updateUserEmail
);

module.exports = router;
