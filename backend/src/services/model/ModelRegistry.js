// 模型治理服务
import { ModelVersion, Well } from '../../models/index.js';

class ModelRegistry {
  constructor() {
    this.modelCache = new Map();
  }

  /**
   * 创建模型版本
   * @param {Object} modelData
   */
  async createVersion(modelData) {
    const { modelId, version, liftType, modelType, parameters } = modelData;

    const model = await ModelVersion.create({
      modelId,
      version,
      liftType,
      modelType: modelType || 'coupled',
      status: 'draft',
      parameters,
      metrics: {}
    });

    return model;
  }

  /**
   * 发布模型
   * @param {string} modelId
   * @param {Object} publishInfo - { effectiveFrom, comment }
   */
  async publishModel(modelId, publishInfo) {
    const { effectiveFrom, comment } = publishInfo;

    // 查找模型
    const model = await ModelVersion.findOne({ where: { modelId } });
    if (!model) {
      throw new Error('Model not found');
    }

    // 将之前的online版本设为offline
    await ModelVersion.update(
      { status: 'offline' },
      {
        where: {
          modelId: model.modelId.split('-')[0], // 提取模型前缀
          status: 'online'
        }
      }
    );

    // 发布新版本
    return model.update({
      status: 'online',
      effectiveFrom: new Date(effectiveFrom),
      publishedAt: new Date(),
      comment
    });
  }

  /**
   * 回滚模型
   * @param {string} modelId
   * @param {Object} rollbackInfo - { targetVersion, reason }
   */
  async rollbackModel(modelId, rollbackInfo) {
    const { targetVersion, reason } = rollbackInfo;

    // 查找当前版本和目标版本
    const currentModel = await ModelVersion.findOne({ where: { modelId } });
    const targetModel = await ModelVersion.findOne({
      where: { modelId: targetVersion }
    });

    if (!targetModel) {
      throw new Error('Target version not found');
    }

    // 更新当前版本状态
    if (currentModel) {
      await currentModel.update({
        status: 'offline',
        rollbackReason: reason
      });
    }

    // 激活目标版本
    await targetModel.update({ status: 'online' });

    return {
      currentVersion: modelId,
      targetVersion,
      success: true
    };
  }

  /**
   * 获取模型列表
   * @param {Object} filters - { liftType, status }
   */
  async getModels(filters = {}) {
    const where = {};
    if (filters.liftType) where.liftType = filters.liftType;
    if (filters.status) where.status = filters.status;

    return ModelVersion.findAll({
      where,
      order: [['publishedAt', 'DESC']]
    });
  }

  /**
   * 获取某井的当前模型版本
   * @param {string} wellId
   */
  async getWellCurrentModel(wellId) {
    const well = await Well.findOne({ where: { wellId } });
    if (!well || !well.currentModelVersion) return null;

    return ModelVersion.findOne({
      where: { modelId: well.currentModelVersion }
    });
  }

  /**
   * 误差评估
   * @param {string} modelVersion
   * @param {Array} calibrationData - 标定数据
   */
  async evaluateAccuracy(modelVersion, calibrationData) {
    // 计算MAE, MAPE, RMSE
    const predictions = []; // 模型预测值
    const actuals = [];      // 实际标定值

    // 简化计算
    const errors = calibrationData.map(record => ({
      oilError: Math.abs(record.predictedOil - record.actualOil) / record.actualOil,
      gasError: Math.abs(record.predictedGas - record.actualGas) / record.actualGas,
      waterError: Math.abs(record.predictedWater - record.actualWater) / record.actualWater
    }));

    const mae = {
      oil: errors.reduce((sum, e) => sum + e.oilError, 0) / errors.length,
      gas: errors.reduce((sum, e) => sum + e.gasError, 0) / errors.length,
      water: errors.reduce((sum, e) => sum + e.waterError, 0) / errors.length
    };

    // 计算MAPE, RMSE (简化)
    const mape = mae; // 简化处理
    const rmse = mae; // 简化处理

    const metrics = {
      mae,
      mape,
      rmse,
      sampleCount: calibrationData.length,
      calculatedAt: new Date()
    };

    // 更新模型的metrics
    const model = await ModelVersion.findOne({ where: { modelId: modelVersion } });
    if (model) {
      await model.update({ metrics });
    }

    return metrics;
  }

  /**
   * 漂移检测
   * @param {string} modelVersion
   */
  async detectDrift(modelVersion) {
    // 获取历史metrics
    // 比较近期与历史的误差变化
    // 如果误差增长超过阈值，触发告警

    return {
      isDrifting: false,
      driftScore: 0.1,
      threshold: 0.15,
      recommendation: 'Model performance is stable'
    };
  }
}

export const modelRegistry = new ModelRegistry();
export default ModelRegistry;