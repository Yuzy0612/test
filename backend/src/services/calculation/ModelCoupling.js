// 模型耦合策略
// 实现加权融合、场景切换、异常兜底三种策略

import { QUALITY_FLAGS } from '../../constants/index.js';

export class ModelCoupling {
  constructor() {
    // 默认权重配置
    this.defaultWeights = {
      mechanism: 0.6,
      lstm: 0.4
    };

    // 各井型的默认策略
    this.defaultStrategies = {
      ESP: 'weightedFusion',
      PCP: 'weightedFusion',
      ESPCP: 'scenarioSwitch'
    };

    // 策略参数
    this.strategyParams = {
      weightedFusion: {
        stabilityThreshold: 0.7
      },
      scenarioSwitch: {
        stabilityThreshold: 0.8,
        lstmConfidenceThreshold: 0.75
      },
      fallback: {
        maxAllowedError: 0.15
      }
    };
  }

  /**
   * 融合机理模型和LSTM模型的结果
   * @param {Object} mechanismResult - 差压机理模型结果
   * @param {Object} lstmResult - LSTM模型结果
   * @param {Object} context - 上下文 { liftType, dataQuality, wellId }
   */
  fuse(mechanismResult, lstmResult, context) {
    const { liftType = 'ESP', dataQuality = 1.0, wellId } = context;

    // 1. 选择耦合策略
    const strategy = this.selectStrategy(liftType, dataQuality);

    // 2. 获取策略参数
    const params = this.getStrategyParams(strategy, liftType, dataQuality);

    // 3. 执行融合
    const fusedResult = this.executeStrategy(strategy, mechanismResult, lstmResult, params);

    // 4. 添加元信息
    return {
      ...fusedResult,
      strategy,
      weights: params,
      modelVersions: {
        mechanism: mechanismResult.modelVersion || 'default',
        lstm: lstmResult.modelVersion || 'default'
      },
      dataQuality,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 选择耦合策略
   */
  selectStrategy(liftType, dataQuality) {
    // 数据质量差时，倾向于使用更稳健的机理模型
    if (dataQuality < 0.5) {
      return 'fallback';
    }

    // ESPCP井使用场景切换策略
    if (liftType === 'ESPCP') {
      return 'scenarioSwitch';
    }

    // 默认使用加权融合
    return 'weightedFusion';
  }

  /**
   * 获取策略参数
   */
  getStrategyParams(strategy, liftType, dataQuality) {
    const baseParams = this.strategyParams[strategy] || {};

    switch (strategy) {
      case 'weightedFusion':
        // 根据数据质量动态调整权重
        return {
          mechanismWeight: 0.5 + dataQuality * 0.3,
          lstmWeight: 0.5 - dataQuality * 0.3
        };

      case 'scenarioSwitch':
        return {
          ...baseParams,
          mechanismWeight: 0.7,
          lstmWeight: 0.3,
          lstmConfidenceThreshold: baseParams.lstmConfidenceThreshold || 0.75
        };

      case 'fallback':
        return {
          ...baseParams,
          mechanismWeight: 0.85,
          lstmWeight: 0.15
        };

      default:
        return { ...this.defaultWeights };
    }
  }

  /**
   * 执行融合策略
   */
  executeStrategy(strategy, mechanismResult, lstmResult, params) {
    switch (strategy) {
      case 'weightedFusion':
        return this.weightedFusion(mechanismResult, lstmResult, params);

      case 'scenarioSwitch':
        return this.scenarioSwitch(mechanismResult, lstmResult, params);

      case 'fallback':
        return this.fallback(mechanismResult, lstmResult, params);

      default:
        return this.weightedFusion(mechanismResult, lstmResult, this.defaultWeights);
    }
  }

  /**
   * 加权融合策略
   * oil = mech_oil * w1 + lstm_oil * w2
   */
  weightedFusion(mechanismResult, lstmResult, params) {
    const { mechanismWeight = 0.6, lstmWeight = 0.4 } = params;

    return {
      oilRate: mechanismResult.oilRate * mechanismWeight + lstmResult.oilRate * lstmWeight,
      gasRate: mechanismResult.gasRate * mechanismWeight + lstmResult.gasRate * lstmWeight,
      waterRate: mechanismResult.waterRate * mechanismWeight + lstmResult.waterRate * lstmWeight
    };
  }

  /**
   * 场景切换策略
   * 根据LSTM置信度选择使用哪个模型
   */
  scenarioSwitch(mechanismResult, lstmResult, params) {
    const { lstmConfidenceThreshold } = params;

    // 如果LSTM置信度高，使用LSTM；否则使用机理模型
    if (lstmResult.confidence >= lstmConfidenceThreshold) {
      return {
        oilRate: lstmResult.oilRate,
        gasRate: lstmResult.gasRate,
        waterRate: lstmResult.waterRate,
        activeModel: 'lstm'
      };
    }

    return {
      oilRate: mechanismResult.oilRate,
      gasRate: mechanismResult.gasRate,
      waterRate: mechanismResult.waterRate,
      activeModel: 'mechanism'
    };
  }

  /**
   * 异常兜底策略
   * 任一模型异常时使用另一模型，两者都正常时加权融合
   */
  fallback(mechanismResult, lstmResult, params) {
    const { maxAllowedError = 0.15 } = params;

    // 检查是否有异常
    const mechHasAnomaly = this.hasAnomaly(mechanismResult, maxAllowedError);
    const lstmHasAnomaly = this.hasAnomaly(lstmResult, maxAllowedError);

    // 任一模型异常时使用另一模型
    if (mechHasAnomaly && !lstmHasAnomaly) {
      return {
        oilRate: lstmResult.oilRate,
        gasRate: lstmResult.gasRate,
        waterRate: lstmResult.waterRate,
        activeModel: 'lstm',
        fallbackReason: 'mechanism_anomaly'
      };
    }

    if (lstmHasAnomaly && !mechHasAnomaly) {
      return {
        oilRate: mechanismResult.oilRate,
        gasRate: mechanismResult.gasRate,
        waterRate: mechanismResult.waterRate,
        activeModel: 'mechanism',
        fallbackReason: 'lstm_anomaly'
      };
    }

    // 两者都正常时加权融合
    if (!mechHasAnomaly && !lstmHasAnomaly) {
      return {
        ...this.weightedFusion(mechanismResult, lstmResult, params),
        activeModel: 'coupled',
        fallbackReason: null
      };
    }

    // 两者都异常时使用机理模型（更稳健）
    return {
      oilRate: mechanismResult.oilRate,
      gasRate: mechanismResult.gasRate,
      waterRate: mechanismResult.waterRate,
      activeModel: 'mechanism',
      fallbackReason: 'both_anomaly'
    };
  }

  /**
   * 检测结果是否异常
   */
  hasAnomaly(result, threshold = 0.15) {
    // 检查是否有isAnomaly标记
    if (result.isAnomaly) return true;

    // 检查产量是否在合理范围
    if (result.oilRate < 0 || result.oilRate > 1000) return true;
    if (result.gasRate < 0 || result.gasRate > 50000) return true;
    if (result.waterRate < 0 || result.waterRate > 1000) return true;

    // 检查变化率是否过大（需要历史数据对比，这里简化处理）
    if (result.changeRate && result.changeRate > threshold) {
      return true;
    }

    return false;
  }

  /**
   * 计算耦合结果的置信度
   */
  calculateConfidence(mechanismResult, lstmResult, strategy, params) {
    // 基于各模型的置信度和策略计算综合置信度
    const mechConfidence = mechanismResult.confidence || 0.8;
    const lstmConfidence = lstmResult.confidence || 0.75;

    switch (strategy) {
      case 'weightedFusion':
        const w1 = params.mechanismWeight || 0.6;
        const w2 = params.lstmWeight || 0.4;
        return mechConfidence * w1 + lstmConfidence * w2;

      case 'scenarioSwitch':
        // 使用较高置信度的模型
        return Math.max(mechConfidence, lstmConfidence);

      case 'fallback':
        // 降级场景置信度
        return Math.min(mechConfidence, lstmConfidence) * 0.9;

      default:
        return (mechConfidence + lstmConfidence) / 2;
    }
  }

  /**
   * 获取策略说明
   */
  getStrategyDescription(strategy) {
    const descriptions = {
      weightedFusion: '加权融合：根据数据质量动态调整机理模型和LSTM的权重',
      scenarioSwitch: '场景切换：LSTM置信度高时使用LSTM，否则使用机理模型',
      fallback: '异常兜底：任一模型异常时使用另一模型'
    };
    return descriptions[strategy] || '未知策略';
  }
}

export const modelCoupling = new ModelCoupling();
export default ModelCoupling;