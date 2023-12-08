const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserSetting extends Model { }

  UserSetting.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    hide_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hide_last_login: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

  }, {
    sequelize,
    modelName: 'UserSetting',
    tableName: 'users_setting',
    timestamps: false
  });

  return UserSetting;
};
