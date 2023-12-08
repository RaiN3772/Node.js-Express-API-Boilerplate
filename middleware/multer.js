const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uniqid = require('uniqid');
const config = require('../config/config.js');

// Different contexts for uploads
const contextPaths = {
    'avatar': config.appConfig.avatar.path,
    'default': ''
};

/**
 * Returns multer middleware configured based on the context, allowed MIME types, and max size.
 * 
 * @param {String} context - The context of the upload (e.g., 'avatar' or 'document').
 * @param {Array<String>} allowedMimetypes - List of allowed MIME types for uploads.
 * @param {Number} maxSize - Maximum file size allowed for upload (in bytes).
 * @returns {Function} - Multer middleware.
 */
const getUploadMiddleware = (context, allowedMimetypes, maxSize) => {
    // Determine the specific upload directory based on context
    const specificPath = contextPaths[context] || contextPaths['default'];

    // Storage configuration to determine where and how the file should be stored
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dest = path.join(config.appConfig.uploadPath, specificPath);
            ensureDirExists(dest);  // Ensure the directory exists
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const fileName = `${req.user.id}-${uniqid()}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}${ext}`;
            req.modifiedFileName = fileName;  // Attach modified filename to the request object for later use
            cb(null, fileName);
        }
    });

    return multer({
        storage: storage,
        limits: {
            fileSize: maxSize
        },
        fileFilter: async (req, file, cb) => {
            // Check if the file's MIME type is among the allowed types
            if (!allowedMimetypes.includes(file.mimetype)) {
                return cb(new Error(i18n.__('error.file_not_allowed')), false);
            }

            // Check for empty file
            if (file.size <= 10) {
                return cb(new Error(i18n.__('error.empty_file')), false);
            }

            req.fileSize = file.size;  // Attach file size to the request object for later use
            cb(null, true);
        }
    });
}

/**
 * Ensures the given directory exists, creating it recursively if not.
 * 
 * @param {String} dirPath - Path of the directory.
 */
const ensureDirExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}


module.exports = getUploadMiddleware;
