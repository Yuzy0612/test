// 数据质量标识
export const QUALITY_FLAGS = {
  VALID: 'valid',           // 有效数据
  ESTIMATED: 'estimated',   // 估算数据（部分缺失或异常）
  INVALID: 'invalid'        // 无效数据
};

// 质量阈值
export const QUALITY_THRESHOLDS = {
  VALID_MIN_SCORE: 0.7,     // >= 0.7 为 valid
  ESTIMATED_MIN_SCORE: 0.3, // >= 0.3 为 estimated
  // < 0.3 为 invalid
};

// 传感器数据范围限制
export const SENSOR_RANGES = {
  dp: { min: 0, max: 500, unit: 'kPa', name: 'Differential Pressure' },
  pressure: { min: 0, max: 50000, unit: 'kPa', name: 'Wellhead Pressure' },
  temperature: { min: -20, max: 200, unit: '°C', name: 'Temperature' },
  current: { min: 0, max: 200, unit: 'A', name: 'Current' },
  voltage: { min: 0, max: 500, unit: 'V', name: 'Voltage' },
  frequency: { min: 0, max: 100, unit: 'Hz', name: 'Frequency' }
};

// 产量范围限制
export const PRODUCTION_RANGES = {
  oilRate: { min: 0, max: 1000, unit: 'm³/d', name: 'Oil Rate' },
  gasRate: { min: 0, max: 50000, unit: 'Sm³/d', name: 'Gas Rate' },
  waterRate: { min: 0, max: 1000, unit: 'm³/d', name: 'Water Rate' }
};