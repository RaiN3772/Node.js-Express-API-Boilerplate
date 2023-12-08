const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AuditLog extends Model {
    
    // Static method to log user action
    static async log(req, info) {
      try {
        await this.create({
          user_id: req.user.id,
          ip_address: req.ip,
          action_date: new Date(),
          info: info
        });
      } catch (error) {
        throw new Error('Failed to log admin action:', error);
      }
    }
  }

  AuditLog.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID of the admin performing the action'
    },
    ip_address: {
        type: DataTypes.STRING(64),
        allowNull: false,
        validate: {
            isIP: true
        },
        comment: 'IP address from where the action was performed'
    },
    action_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Date and time when the action was performed'
    },
    info: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Detailed information about the action'
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: false
  });

  return AuditLog;
};
