import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  resource: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  resourceId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  method: {
    type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
    allowNull: true
  },
  ip: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requestBody: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  responseCode: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  result: {
    type: DataTypes.ENUM('success', 'failure'),
    allowNull: false
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'createdAt'] },
    { fields: ['action', 'createdAt'] },
    { fields: ['resource', 'resourceId'] }
  ]
});

export default AuditLog;
