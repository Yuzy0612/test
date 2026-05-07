import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AllocationRule = sequelize.define('AllocationRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ruleId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  block: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  weightStrategy: {
    type: DataTypes.ENUM('equal', 'oil', 'gas', 'water', 'custom'),
    allowNull: false
  },
  priorityStrategy: {
    type: DataTypes.ENUM('priority', 'wellId', 'custom'),
    defaultValue: 'priority'
  },
  parameters: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'inactive'),
    defaultValue: 'draft'
  },
  effectiveFrom: {
    type: DataTypes.DATE,
    allowNull: false
  },
  effectiveTo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'allocation_rules',
  timestamps: true,
  indexes: [
    { fields: ['block', 'status'] }
  ]
});

export default AllocationRule;
