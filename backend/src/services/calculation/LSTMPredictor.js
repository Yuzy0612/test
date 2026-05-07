// LSTM预测服务
// 负责加载LSTM模型、执行推理

import path from 'path';
import fs from 'fs';

class LSTMPredictor {
  constructor() {
    this.modelCache = new Map();
    this.featureWindow = 60; // 60分钟历史窗口
    this.modelBasePath = process.env.LSTM_MODEL_PATH || './models/lstm';
  }

  /**
   * LSTM预测
   * @param {Object} inputData - 预处理后的输入数据
   * @param {string} modelVersion - 模型版本
   */
  async predict(inputData, modelVersion) {
    try {
      // 1. 加载模型（如未缓存）
      const model = await this.loadModel(modelVersion);

      // 2. 构建特征向量
      const features = this.buildFeatures(inputData);

      // 3. 执行推理
      const prediction = await this.runInference(model, features);

      // 4. 反归一化
      const result = this.denormalize(prediction, inputData);

      return {
        ...result,
        confidence: 0.85, // Mock置信度
        modelVersion,
        predictedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('[LSTMPredictor] Prediction failed:', error);
      return this.getFallbackPrediction(inputData);
    }
  }

  /**
   * 加载指定版本的模型
   * 实际应使用 TensorFlow.js 或 Python RPC 调用
   */
  async loadModel(modelVersion) {
    if (this.modelCache.has(modelVersion)) {
      return this.modelCache.get(modelVersion);
    }

    // Mock实现 - 实际应加载真实的LSTM模型
    // const model = await tf.loadLayersModel(`file://${this.modelBasePath}/${modelVersion}.h5`);
    const mockModel = {
      version: modelVersion,
      inputShape: [60, 8], // 60时间步，8个特征
      outputShape: [3]    // oil, gas, water
    };

    this.modelCache.set(modelVersion, mockModel);

    // 限制缓存大小
    if (this.modelCache.size > 5) {
      const firstKey = this.modelCache.keys().next().value;
      this.modelCache.delete(firstKey);
    }

    return mockModel;
  }

  /**
   * 构建输入特征
   * @param {Object} sensorData
   */
  buildFeatures(sensorData) {
    const now = new Date();

    // 基础特征
    const baseFeatures = {
      dp: sensorData.dp || 0,
      pressure: sensorData.pressure || 0,
      temperature: sensorData.temperature || 20,
      current: sensorData.current || 0,
      voltage: sensorData.voltage || 0,
      frequency: sensorData.frequency || 50,
      hourOfDay: now.getHours(),
      dayOfWeek: now.getDay()
    };

    // 添加衍生特征
    if (sensorData.current && sensorData.voltage) {
      baseFeatures.power = sensorData.current * sensorData.voltage * Math.sqrt(3) / 1000;
    }
    if (sensorData.waterCut !== undefined) {
      baseFeatures.waterCut = sensorData.waterCut;
    }

    return baseFeatures;
  }

  /**
   * 执行模型推理
   * Mock实现 - 实际应调用真实的LSTM模型
   */
  async runInference(model, features) {
    // 模拟LSTM推理结果
    // 实际应使用 model.predict(features)

    // 基于传感器数据生成一个合理的预测值
    const { dp, pressure, waterCut = 0.3 } = features;

    // 简化的预测公式（实际应使用训练好的模型）
    const baseFlow = dp > 0 ? dp * 0.1 : 10; // 基础流量
    const qL = baseFlow * (1 + Math.random() * 0.1 - 0.05); // ±10%随机波动

    const oilRate = qL * (1 - waterCut);
    const waterRate = qL * waterCut;
    const gasRate = oilRate * 20 * (pressure / 3000); // 气油比估算

    return {
      oilRate: Number(oilRate.toFixed(2)),
      gasRate: Number(gasRate.toFixed(2)),
      waterRate: Number(waterRate.toFixed(2))
    };
  }

  /**
   * 反归一化预测结果
   * Mock实现
   */
  denormalize(prediction, originalData) {
    // 如果模型输出已经过归一化，需要反归一化
    // 这里是Mock，直接返回预测值
    return prediction;
  }

  /**
   * 批量预测
   * @param {Array} inputDataList
   * @param {string} modelVersion
   */
  async predictBatch(inputDataList, modelVersion) {
    const results = [];

    for (const inputData of inputDataList) {
      const result = await this.predict(inputData, modelVersion);
      results.push(result);
    }

    return results;
  }

  /**
   * 获取回退预测（当模型不可用时）
   */
  getFallbackPrediction(inputData) {
    const { dp = 0, pressure = 0, waterCut = 0.3 } = inputData;

    const baseFlow = dp > 0 ? dp * 0.1 : 10;
    const qL = baseFlow;

    return {
      oilRate: Number((qL * (1 - waterCut)).toFixed(2)),
      gasRate: Number((qL * 20 * (pressure / 3000)).toFixed(2)),
      waterRate: Number((qL * waterCut).toFixed(2)),
      isFallback: true,
      confidence: 0.5
    };
  }

  /**
   * 获取模型元信息
   */
  async getModelInfo(modelVersion) {
    // Mock实现 - 实际应从模型文件或数据库读取
    return {
      version: modelVersion,
      inputShape: [60, 8],
      outputShape: [3],
      featureNames: ['dp', 'pressure', 'temperature', 'current', 'voltage', 'frequency', 'hourOfDay', 'dayOfWeek'],
      trainingDate: '2026-04-15',
      metrics: {
        val_loss: 0.023,
        val_mae: 0.015
      }
    };
  }

  /**
   * 清除模型缓存
   */
  clearCache() {
    this.modelCache.clear();
    console.log('[LSTMPredictor] Model cache cleared');
  }

  /**
   * 检查模型文件是否存在
   */
  async modelExists(modelVersion) {
    // Mock实现 - 实际应检查文件系统
    return true;
  }
}

export const lstmPredictor = new LSTMPredictor();
export default LSTMPredictor;