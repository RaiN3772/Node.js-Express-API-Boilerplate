const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserRole extends Model {}

  UserRole.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Foreign key referencing the ID of the user in the users table'
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id'
      },
      comment: 'Foreign key referencing the ID of the role in the roles table'
    },
    assigned_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Date and time when the role was assigned to the user'
    }
  }, {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: false,
    comment: 'Join table linking users and roles, indicating which roles are assigned to which users'
  });

  return UserRole;
};
