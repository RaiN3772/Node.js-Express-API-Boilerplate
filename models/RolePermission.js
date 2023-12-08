const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RolePermission extends Model {}

  RolePermission.init({
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
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'permissions',
        key: 'id'
      },
      comment: 'Foreign key referencing the ID of the permission in the permissions table'
    }
  }, {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    timestamps: false,
    comment: 'Join table linking roles and permissions, indicating which roles have which permissions'
  });

  return RolePermission;
};
