import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ModelVersion = sequelize.define('ModelVersion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  modelId: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  liftType: {
    type: DataTypes.ENUM('ESP', 'PCP', 'ESPCP'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'testing', 'online', 'offline'),
    defaultValue: 'draft'
  },
  parameters: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  trainingDatasetId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  metrics: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  effectiveFrom: {
    type: DataTypes.DATE,
    allowNull: true
  },
  effectiveTo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  publishedBy: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rollbackReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'model_versions',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['modelId', 'version'] },
    { fields: ['status', 'liftType'] }
  ]
});

export default ModelVersion;
