import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ReportTask = sequelize.define('ReportTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reportId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'custom'),
    allowNull: false
  },
  lang: {
    type: DataTypes.ENUM('zh', 'en'),
    defaultValue: 'zh'
  },
  format: {
    type: DataTypes.ENUM('pdf', 'xlsx'),
    defaultValue: 'pdf'
  },
  parameters: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'report_tasks',
  timestamps: true,
  indexes: [
    { fields: ['status', 'type'] },
    { fields: ['scheduledAt'] }
  ]
});

export default ReportTask;
