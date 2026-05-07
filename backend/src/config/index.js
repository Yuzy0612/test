// JWT 配置
export const JWT_SECRET = process.env.JWT_SECRET || 'vfm-secret-key-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// PI 同步配置
export const PI_SYNC_CONFIG = {
  retryCount: 3,
  retryInterval: 5 * 60 * 1000, // 5分钟
  syncInterval: 60 * 1000, // 1分钟
};

// 计算配置
export const CALCULATION_CONFIG = {
  lateDataWindow: 10 * 60 * 1000, // 10分钟迟到窗口
  sampleInterval: 60 * 1000, // 1分钟采样
};

// API 版本
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;
