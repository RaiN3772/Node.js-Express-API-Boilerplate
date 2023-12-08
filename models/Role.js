const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Role extends Model {}
  
  Role.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Unique identifier for the role'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [3, 50],
          msg: 'Role name must be between 3 and 50 characters.'
        },
      },
      comment: 'Name of the role'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Detailed description of the role'
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: false
  });

  return Role;
};
