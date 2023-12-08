const sequelize = require('../config/database');

// Core Models
const User = require('./User');
const AuthAttempt = require('./AuthAttempt');
const Role = require('./Role')(sequelize);
const Permission = require('./Permission')(sequelize);
const RolePermission = require('./RolePermission')(sequelize);
const UserRole = require('./UserRole')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const UserSetting = require('./UserSetting')(sequelize);
const Token = require('./Token');

// Application Models
const Brand = require('./Brand');
const Category = require('./Category');
const Car = require('./Car');


User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'user_id',
    otherKey: 'role_id'
});
Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'role_id',
    otherKey: 'user_id'
});

Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id'
});
Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id'
});

User.hasOne(UserSetting, {
    foreignKey: 'user_id',
    as: 'settings'
});

UserSetting.belongsTo(User, {
    foreignKey: 'user_id'
});


User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Token, { foreignKey: 'user_id' });
Token.belongsTo(User, { foreignKey: 'user_id' });

Brand.associate({ Category });
Category.associate({ Brand });

User.hasMany(Car, { foreignKey: 'user_id', as: 'cars' });
Category.hasMany(Car, { foreignKey: 'category_id', as: 'cars' });


module.exports = {
    User,
    Role,
    Permission,
    RolePermission,
    UserRole,
    AuditLog,
    UserSetting,
    AuthAttempt,
    Token,
    Brand,
    Category,
    Car
};
