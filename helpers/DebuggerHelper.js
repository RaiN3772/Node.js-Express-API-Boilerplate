// Load environment variables from the .env file
require('dotenv').config();
const config = require('../config/config.js');

// Define a function to check if the environment is set to development
function isDevelopment() {
    return config.appConfig.environment === 'development';
}

// Export the function for use elsewhere in the app
module.exports = {
    isDevelopment
};
