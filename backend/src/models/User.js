import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('production_engineer', 'measurement_engineer', 'block_manager', 'admin'),
    allowNull: false
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  externalId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  externalSource: {
    type: DataTypes.ENUM('sso', 'local'),
    defaultValue: 'local'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginIp: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['username'] },
    { fields: ['email'] }
  ]
});

export default User;
