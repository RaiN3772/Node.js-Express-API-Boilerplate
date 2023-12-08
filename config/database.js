const { Sequelize } = require('sequelize');
require('../models/initModels');
const config = require('../config/config.js');

// Create a Sequelize instance and specify the database connection details
const sequelize = new Sequelize(config.dbConfig.dbName, config.dbConfig.dbUser, config.dbConfig.dbPass, {
  host: config.dbConfig.dbHost,
  dialect: config.dbConfig.dbDialect || 'mysql'
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Check if model synchronization is enabled and apply the specified sync type
    if (config.dbConfig.sync && config.dbConfig.sync.enable) {
      const syncOptions = {};
      syncOptions[config.dbConfig.sync.type] = true;
      await sequelize.sync(syncOptions);
      console.log('Models synchronized successfully.');
    }

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

module.exports = sequelize;
