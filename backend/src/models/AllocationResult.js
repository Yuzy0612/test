import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AllocationResult = sequelize.define('AllocationResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  block: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  allocationDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ruleId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  totalOil: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  totalGas: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  totalWater: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  deviation: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  wellAllocations: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  executedBy: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'allocation_results',
  timestamps: true,
  indexes: [
    { fields: ['block', 'allocationDate'] },
    { fields: ['taskId'] }
  ]
});

export default AllocationResult;
