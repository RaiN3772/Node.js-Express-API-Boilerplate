const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

class Token extends Model {
    static generateRandomToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    static getExpiryDate(type) {
        switch (type) {
            case 'email_verification':
                // 30 days in milliseconds
                return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            case 'password_reset':
                // 1 day in milliseconds
                return new Date(Date.now() + 24 * 60 * 60 * 1000);
            default:
                throw new Error(`Unsupported token type: ${type}`);
        }
    }


    static async createToken(user_id, type, transaction) {
        return this.create({
            user_id: user_id,
            token: this.generateRandomToken(),
            type: type,
            expiry_date: this.getExpiryDate(type)
        }, { transaction });
    }
}

Token.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    token: {
        type: DataTypes.STRING(512),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM,
        values: ['password_reset', 'email_verification', 'access_token', 'refresh_token'],
        allowNull: false
    },
    expiry_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'Token',
    tableName: 'tokens',
    timestamps: true,
    updatedAt: false,
});

module.exports = Token;
