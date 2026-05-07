// 数据接入服务
// 负责接收传感器数据、预处理、时间对齐

import { SENSOR_RANGES, QUALITY_FLAGS } from '../../constants/index.js';

class DataIngestionService {
  constructor() {
    this.bufferSize = 100; // 批处理大小
    this.timeWindow = 60000; // 1分钟时间窗口
  }

  /**
   * 接收并处理传感器数据
   * @param {string} wellId
   * @param {Object} rawData - 原始传感器数据
   */
  async ingest(wellId, rawData) {
    // 1. 数据验证
    const validation = this.validateRawData(rawData);
    if (!validation.isValid) {
      return {
        success: false,
        wellId,
        errors: validation.errors
      };
    }

    // 2. 数据预处理
    const processedData = this.preprocess(wellId, rawData);

    // 3. 时间对齐（对齐到整分钟）
    const alignedData = this.alignToMinute(processedData);

    return {
      success: true,
      wellId,
      data: alignedData,
      timestamp: alignedData.timestamp
    };
  }

  /**
   * 批量接收数据
   * @param {Array} records - [{wellId, rawData, receivedAt}, ...]
   */
  async ingestBatch(records) {
    const results = [];

    for (const record of records) {
      const result = await this.ingest(record.wellId, record.rawData);
      results.push({
        wellId: record.wellId,
        ...result
      });
    }

    return {
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * 验证原始数据
   */
  validateRawData(rawData) {
    const errors = [];

    // 必填字段检查
    const requiredFields = ['dp', 'pressure'];
    for (const field of requiredFields) {
      if (rawData[field] === undefined || rawData[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // 类型检查
    for (const [key, value] of Object.entries(rawData)) {
      if (value !== undefined && value !== null && typeof value !== 'number') {
        if (key !== 'deviceStatus' && key !== 'alarmCode') {
          errors.push(`Invalid type for ${key}: expected number`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 数据预处理
   * @param {string} wellId
   * @param {Object} rawData
   */
  preprocess(wellId, rawData) {
    const processed = {
      wellId,
      dp: rawData.dp,
      pressure: rawData.pressure,
      temperature: rawData.temperature ?? 20, // 默认20°C
      current: rawData.current ?? 0,
      voltage: rawData.voltage ?? 0,
      frequency: rawData.frequency ?? 50,
      waterCut: rawData.waterCut,
      deviceStatus: rawData.deviceStatus ?? 'normal',
      alarmCode: rawData.alarmCode
    };

    // 计算衍生字段
    if (rawData.current && rawData.voltage) {
      processed.power = rawData.current * rawData.voltage * Math.sqrt(3) / 1000; // kW
    }

    return processed;
  }

  /**
   * 时间对齐到整分钟
   * @param {Object} data
   */
  alignToMinute(data) {
    const now = new Date();
    const timestamp = new Date(now);
    timestamp.setSeconds(0, 0); // 对齐到整分钟

    return {
      ...data,
      timestamp: timestamp.toISOString(),
      originalTimestamp: data.timestamp || now.toISOString(),
      aligned: true
    };
  }

  /**
   * 检测异常值（使用简单的统计方法）
   * @param {string} wellId
   * @param {Object} data
   * @param {Object} historicalStats - 历史统计 {mean, std}
   */
  detectAnomalies(wellId, data, historicalStats = null) {
    const anomalies = [];

    // 如果没有历史数据，使用简单的范围检查
    if (!historicalStats) {
      // 使用SENSOR_RANGES进行范围检查
      for (const [key, range] of Object.entries(SENSOR_RANGES)) {
        if (data[key] !== undefined) {
          if (data[key] < range.min * 0.8 || data[key] > range.max * 1.2) {
            anomalies.push({
              field: key,
              value: data[key],
              expected: `${range.min} ~ ${range.max}`,
              type: 'range_outlier'
            });
          }
        }
      }
      return anomalies;
    }

    // 使用历史统计进行Z-score检测
    for (const [key, value] of Object.entries(data)) {
      if (historicalStats[key]) {
        const { mean, std } = historicalStats[key];
        if (std > 0) {
          const zScore = Math.abs((value - mean) / std);
          if (zScore > 3) { // Z-score > 3 认为是异常
            anomalies.push({
              field: key,
              value,
              mean,
              zScore,
              type: 'statistical_outlier'
            });
          }
        }
      }
    }

    return anomalies;
  }

  /**
   * 缺失值插值
   * @param {Array} timeSeriesData - 按时间排序的数据数组
   * @param {Array} fields - 需要插值的字段
   */
  interpolateMissing(timeSeriesData, fields = ['dp', 'pressure', 'temperature']) {
    if (timeSeriesData.length < 2) return timeSeriesData;

    return timeSeriesData.map((record, index) => {
      const interpolated = { ...record };

      for (const field of fields) {
        // 如果当前值缺失
        if (record[field] === undefined || record[field] === null) {
          // 找到前后有效的值进行线性插值
          let prevIndex = index - 1;
          let nextIndex = index + 1;

          while (prevIndex >= 0 && timeSeriesData[prevIndex][field] === undefined) {
            prevIndex--;
          }
          while (nextIndex < timeSeriesData.length && timeSeriesData[nextIndex][field] === undefined) {
            nextIndex++;
          }

          if (prevIndex >= 0 && nextIndex < timeSeriesData.length) {
            // 线性插值
            const prevValue = timeSeriesData[prevIndex][field];
            const nextValue = timeSeriesData[nextIndex][field];
            const ratio = (index - prevIndex) / (nextIndex - prevIndex);
            interpolated[field] = prevValue + (nextValue - prevValue) * ratio;
            interpolated[`${field}_interpolated`] = true;
          } else if (prevIndex >= 0) {
            // 无法插值，使用前一个值
            interpolated[field] = timeSeriesData[prevIndex][field];
            interpolated[`${field}_interpolated`] = true;
          }
        }
      }

      return interpolated;
    });
  }

  /**
   * 检查数据完整性
   * @param {Object} data
   */
  checkCompleteness(data) {
    const completeness = {
      total: 0,
      present: 0,
      missing: [],
      score: 1.0
    };

    // 关键字段
    const criticalFields = ['dp', 'pressure'];

    for (const field of criticalFields) {
      completeness.total++;
      if (data[field] !== undefined && data[field] !== null) {
        completeness.present++;
      } else {
        completeness.missing.push(field);
      }
    }

    // 可选字段
    const optionalFields = ['temperature', 'current', 'voltage', 'frequency'];
    for (const field of optionalFields) {
      completeness.total++;
      if (data[field] !== undefined && data[field] !== null) {
        completeness.present++;
      } else {
        completeness.missing.push(field);
      }
    }

    completeness.score = completeness.total > 0
      ? completeness.present / completeness.total
      : 0;

    return completeness;
  }
}

export const dataIngestionService = new DataIngestionService();
export default DataIngestionService;