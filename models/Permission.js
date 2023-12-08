const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Permission extends Model {}

  Permission.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Unique identifier for each permission entry'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the permission, e.g., "read_users", "write_posts"'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Detailed description of what the permission entails'
    }
  }, {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: false,
    comment: 'Table storing various permissions available in the system'
  });

  return Permission;
};
