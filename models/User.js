const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');
const config = require('../config/config.js');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'Primary key for the user'
    },
    email: {
        type: DataTypes.STRING(320),
        unique: true,
        allowNull: false,
        validate: {
            isEmail: {
                msg: 'Invalid email format.'
            },
        },
        comment: 'Email address of the user, must be unique'
    },
    password: {
        type: DataTypes.STRING(60),
        allowNull: false,
        validate: {
            len: [parseInt(config.appConfig.user.minPasswordLength), 60],
        },
        comment: 'Hashed password of the user'
    },
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        notEmpty: true,
        validate: {
            len: {
                args: [3, 50],
                msg: 'Full name must be between 3 and 50 characters.'
              },
            is: {
                args: /^[a-zA-Z\s\-']+$/,
                msg: 'Full name contains invalid characters.'
            }
        },
        comment: 'Full name of the user'
    },
    created_ip: {
        type: DataTypes.STRING(64),
        allowNull: false,
        isIP: true,
        comment: 'IP address from which the user was created'
    },
    last_ip: {
        type: DataTypes.STRING(64),
        allowNull: false,
        isIP: true,
        comment: 'IP address from the user\'s most recent activity'
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp of the user\'s last login'
    },
    last_online: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp of the user\'s last online activity'
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL or path to the user\'s profile avatar'
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Brief biography or description of the user'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'users',
    timestamps: true,
    updatedAt: true,
    
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) user.password = await bcrypt.hash(user.password, parseInt(config.appConfig.user.saltRounds, 10));
            
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) user.password = await bcrypt.hash(user.password, parseInt(config.appConfig.user.saltRounds, 10));
        }
    }
    
});

// Define instance method for password verification
User.prototype.validPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = User;
