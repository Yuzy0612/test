import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Well = sequelize.define('Well', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  wellId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  field: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  block: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  liftType: {
    type: DataTypes.ENUM('ESP', 'PCP', 'ESPCP'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('running', 'warning', 'alert', 'offline'),
    defaultValue: 'offline'
  },
  templateId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  currentModelVersion: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  installationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'wells',
  timestamps: true,
  indexes: [
    { fields: ['field'] },
    { fields: ['block'] },
    { fields: ['field', 'block'] },
    { fields: ['field', 'block', 'liftType'] }
  ]
});

export default Well;
