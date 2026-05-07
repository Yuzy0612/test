import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const IntegrationJob = sequelize.define('IntegrationJob', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  jobId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('pi_realtime_sync', 'pi_historical_sync', 'sso_user_sync', 'data_import'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  parameters: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  recordsProcessed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  result: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  errorDetails: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  executedBy: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'integration_jobs',
  timestamps: true,
  indexes: [
    { fields: ['type', 'status'] }
  ]
});

export default IntegrationJob;
