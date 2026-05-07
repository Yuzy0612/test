import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CalibrationRecord = sequelize.define('CalibrationRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  wellId: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  oil: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  gas: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  water: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  source: {
    type: DataTypes.ENUM('test', 'verification', 'manual'),
    allowNull: false
  },
  quality: {
    type: DataTypes.JSONB,
    defaultValue: { status: 'valid', issues: [], checkedAt: null }
  },
  version: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  effectiveFrom: {
    type: DataTypes.DATE,
    allowNull: true
  },
  effectiveTo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'calibration_records',
  timestamps: true,
  indexes: [
    { fields: ['wellId', 'timestamp'] },
    { fields: ['version', 'effectiveFrom'] }
  ]
});

export default CalibrationRecord;
