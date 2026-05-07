import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RealtimeProduction = sequelize.define('RealtimeProduction', {
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
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  oilRate: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  gasRate: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  waterRate: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  cumulativeOil: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  cumulativeGas: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  cumulativeWater: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  qualityFlag: {
    type: DataTypes.ENUM('valid', 'estimated', 'invalid'),
    defaultValue: 'valid'
  },
  modelVersion: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  inputParams: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'realtime_production',
  timestamps: true,
  indexes: [
    { fields: ['wellId', 'timestamp'] },
    { fields: ['wellId', 'timestamp', 'qualityFlag'] }
  ]
});

export default RealtimeProduction;
