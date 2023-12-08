const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuthAttempt = sequelize.define('AuthAttempt', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'Unique identifier for each authentication attempt'
    },
    email: {
        type: DataTypes.STRING(320),
        allowNull: false,
        comment: 'Email address associated with the authentication attempt'
    },
    ip_address: {
        type: DataTypes.STRING(64),
        allowNull: false,
        isIP: true,
        comment: 'IP address from where the authentication attempt was made'
    },
    attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of authentication attempts made from the specified email and IP address'
    },
    last_attempt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Timestamp of the most recent authentication attempt'
    },
}, {
    tableName: 'auth_attempts',
    timestamps: false,
});

module.exports = AuthAttempt;
