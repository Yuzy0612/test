// 更新 RealtimeCalculator 使用新的模型组件
import { QUALITY_FLAGS, QUALITY_THRESHOLDS, SENSOR_RANGES, DEFAULT_MODEL_PARAMS } from '../../constants/index.js';
import { differentialPressureModel } from './DifferentialPressureModel.js';
import { lstmPredictor } from './LSTMPredictor.js';
import { modelCoupling } from './ModelCoupling.js';

export class RealtimeCalculator {
  constructor() {
    this.mechanismModel = differentialPressureModel;
    this.lstmService = lstmPredictor;
    this.couplingStrategy = modelCoupling;
    this.qualityChecker = new QualityChecker();
  }

  /**
   * 计算单井三相产量
   * @param {Object} input - { wellId, sensorData, liftType, modelVersion }
   */
  async calculate(input) {
    const { wellId, sensorData, liftType, modelVersion } = input;

    // 1. 数据质量检查
    const qualityResult = this.qualityChecker.check(sensorData);

    // 如果数据完全无效，直接返回
    if (qualityResult.flag === QUALITY_FLAGS.INVALID) {
      return {
        wellId,
        timestamp: new Date().toISOString(),
        oilRate: 0,
        gasRate: 0,
        waterRate: 0,
        qualityFlag: QUALITY_FLAGS.INVALID,
        reasons: qualityResult.reasons,
        modelVersion
      };
    }

    // 2. 差压机理模型计算
    const mechanismResult = this.mechanismModel.calculate(sensorData, liftType);

    // 3. LSTM模型推理（如模型版本有效）
    let lstmResult = null;
    try {
      if (modelVersion && modelVersion !== 'default') {
        lstmResult = await this.lstmService.predict(sensorData, modelVersion);
      }
    } catch (error) {
      console.warn(`[RealtimeCalculator] LSTM prediction failed for ${wellId}:`, error.message);
    }

    // 4. 模型耦合
    let finalResult;
    if (lstmResult) {
      finalResult = this.couplingStrategy.fuse(mechanismResult, lstmResult, {
        wellId,
        liftType,
        dataQuality: qualityResult.score
      });
    } else {
      // 无LSTM结果，只使用机理模型
      finalResult = {
        ...mechanismResult,
        strategy: 'mechanism_only',
        activeModel: 'mechanism'
      };
    }

    // 5. 添加质量标记
    return {
      wellId,
      timestamp: new Date().toISOString(),
      oilRate: Number(finalResult.oilRate.toFixed(2)),
      gasRate: Number(finalResult.gasRate.toFixed(2)),
      waterRate: Number(finalResult.waterRate.toFixed(2)),
      qualityFlag: qualityResult.flag,
      reasons: qualityResult.reasons,
      modelVersion,
      calculation: {
        strategy: finalResult.strategy || 'mechanism_only',
        activeModel: finalResult.activeModel,
        weights: finalResult.weights
      }
    };
  }

  /**
   * 迟到数据重算
   */
  async recalculateLateData(wellId, targetTime, lateData) {
    const LATE_DATA_WINDOW = 10 * 60 * 1000;

    if (Date.now() - new Date(targetTime).getTime() > LATE_DATA_WINDOW) {
      throw new Error('Late data beyond allowed window');
    }

    return this.calculate(lateData);
  }

  /**
   * 批量计算多井产量
   * @param {Array} inputs - [{ wellId, sensorData, liftType, modelVersion }, ...]
   */
  async calculateBatch(inputs) {
    const results = [];

    for (const input of inputs) {
      try {
        const result = await this.calculate(input);
        results.push({
          wellId: input.wellId,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          wellId: input.wellId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

// 数据质量检查器
class QualityChecker {
  check(sensorData) {
    const reasons = [];
    let score = 1.0;

    // 1. 缺失值检查
    if (sensorData.dp === undefined || sensorData.dp === null) {
      score -= 0.25;
      reasons.push('Missing differential pressure');
    }
    if (sensorData.pressure === undefined || sensorData.pressure === null) {
      score -= 0.25;
      reasons.push('Missing wellhead pressure');
    }

    // 2. 范围合理性检查
    const rangeIssues = this.checkRange(sensorData);
    if (rangeIssues.length > 0) {
      score -= rangeIssues.length * 0.1;
      reasons.push(...rangeIssues);
    }

    // 3. 设备状态检查
    if (sensorData.deviceStatus === 'error') {
      score = Math.min(score, 0.2);
      reasons.push('Device error status');
    }

    // 确定质量标识
    let flag;
    if (score >= QUALITY_THRESHOLDS.VALID_MIN_SCORE) {
      flag = QUALITY_FLAGS.VALID;
    } else if (score >= QUALITY_THRESHOLDS.ESTIMATED_MIN_SCORE) {
      flag = QUALITY_FLAGS.ESTIMATED;
    } else {
      flag = QUALITY_FLAGS.INVALID;
    }

    return { flag, score: Math.max(0, score), reasons };
  }

  checkRange(sensorData) {
    const issues = [];

    for (const [key, range] of Object.entries(SENSOR_RANGES)) {
      if (sensorData[key] !== undefined && sensorData[key] !== null) {
        if (sensorData[key] < range.min * 0.8 || sensorData[key] > range.max * 1.2) {
          issues.push(`${key} out of expected range`);
        }
      }
    }

    return issues;
  }
}

export const realtimeCalculator = new RealtimeCalculator();
export default RealtimeCalculator;