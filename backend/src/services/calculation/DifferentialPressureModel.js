// 差压机理模型
// 基于多相流方程和伯努利原理计算三相产量

import { DEFAULT_MODEL_PARAMS, LIFT_TYPES } from '../../constants/index.js';

export class DifferentialPressureModel {
  constructor() {
    // 按举升方式的默认参数
    this.defaultParams = { ...DEFAULT_MODEL_PARAMS };
    // 计量孔半径 (m)
    this.orificeRadius = 0.05;
    this.orificeArea = Math.PI * Math.pow(this.orificeRadius, 2);
  }

  /**
   * 计算三相产量
   * @param {Object} sensorData - 传感器数据 {dp, pressure, temperature, current, ...}
   * @param {string} liftType - 举升方式 ESP/PCP/ESPCP
   * @param {Object} customParams - 自定义参数（可选）
   */
  calculate(sensorData, liftType, customParams = null) {
    const params = customParams || this.defaultParams[liftType] || this.defaultParams[LIFT_TYPES.ESP];

    const {
      dp = 0,           // 差压 kPa
      pressure = 0,     // 压力 kPa
      temperature = 20,  // 温度 °C
      current = 0,      // 电流 A
      voltage = 0,      // 电压 V
      frequency = 50,    // 频率 Hz
      waterCut: inputWaterCut
    } = sensorData;

    // 1. 计算含水率
    const waterCut = this.estimateWaterCut(sensorData, liftType, params);

    // 2. 计算混合液密度
    const rhoMix = this.calculateMixtureDensity(waterCut, params);

    // 3. 计算混合液体积流量
    const qL = this.calculateLiquidFlowRate(dp, rhoMix, params);

    // 4. 分离油水产量
    const oilRate = qL * (1 - waterCut);
    const waterRate = qL * waterCut;

    // 5. 计算气产量
    const gasRate = this.calculateGasRate(oilRate, params.gor, pressure, temperature);

    return {
      oilRate: Math.max(0, Number(oilRate.toFixed(2))),
      gasRate: Math.max(0, Number(gasRate.toFixed(2))),
      waterRate: Math.max(0, Number(waterRate.toFixed(2))),
      internal: {
        waterCut: Number(waterCut.toFixed(4)),
        rhoMix: Number(rhoMix.toFixed(2)),
        qL: Number(qL.toFixed(4)),
        calculationParams: params
      }
    };
  }

  /**
   * 估算含水率
   * 基于电参的启发式方法
   */
  estimateWaterCut(sensorData, liftType, params) {
    // 如果有直接输入的含水率，使用它
    if (sensorData.waterCut !== undefined) {
      return Math.min(0.99, Math.max(0, sensorData.waterCut));
    }

    const baseWaterCut = params.waterCutBase || 0.3;

    // ESP/ESPCP井基于电流估算
    if (liftType === LIFT_TYPES.ESP || liftType === LIFT_TYPES.ESPCP) {
      const { current = 50 } = sensorData;
      // 电流偏离正常值越多，含水率可能越高
      // 这是一个简化的经验公式
      const currentEffect = (current - 50) / 100 * 0.2;
      return Math.min(0.99, Math.max(0, baseWaterCut + currentEffect));
    }

    // PCP井使用基础含水率
    if (liftType === LIFT_TYPES.PCP) {
      return baseWaterCut;
    }

    return baseWaterCut;
  }

  /**
   * 计算混合液密度
   * ρmix = ρo * (1 - wc) + ρw * wc
   */
  calculateMixtureDensity(waterCut, params) {
    const { densityOil = 850, densityWater = 1050 } = params;
    return densityOil * (1 - waterCut) + densityWater * waterCut;
  }

  /**
   * 计算液体体积流量
   * Q = C0 * A * sqrt(2*dp/rho)
   * dp单位是kPa，需要转为Pa
   */
  calculateLiquidFlowRate(dp, rhoMix, params) {
    const C0 = params.c0 || 0.6;  // 流量系数

    // dp从kPa转为Pa
    const dpPa = dp * 1000;

    // Q = C0 * A * sqrt(2*dp/rho)
    // 单位: m³/s
    const qL = C0 * this.orificeArea * Math.sqrt(2 * dpPa / rhoMix);

    // 转为 m³/d
    return qL * 86400;
  }

  /**
   * 计算气产量
   * 基于PVT关系和溶解气油比
   */
  calculateGasRate(oilRate, gor, pressure, temperature) {
    // 溶解气油比 Rs = gor * (p / 1000)^0.8
    const pKpa = Math.max(pressure, 100); // 最小压力100kPa避免负数
    const Rs = gor * Math.pow(pKpa / 1000, 0.8);

    // 自由气量（简化计算，实际应该考虑更多因素）
    const freeGasFactor = 0.1;

    // 气产量 = 油产量 * 溶解气油比 + 自由气
    const dissolvedGas = oilRate * Rs / 1000;
    const freeGas = oilRate * freeGasFactor;

    return dissolvedGas + freeGas;
  }

  /**
   * 获取某举升方式的默认参数
   */
  getDefaultParams(liftType) {
    return { ...this.defaultParams[liftType] };
  }

  /**
   * 验证参数合理性
   */
  validateParams(params) {
    const errors = [];

    if (params.densityOil < 500 || params.densityOil > 1200) {
      errors.push('Oil density out of typical range [500, 1200] kg/m³');
    }
    if (params.densityWater < 900 || params.densityWater > 1200) {
      errors.push('Water density out of typical range [900, 1200] kg/m³');
    }
    if (params.gor < 0 || params.gor > 1000) {
      errors.push('GOR out of typical range [0, 1000] Sm³/Sm³');
    }
    if (params.c0 < 0.3 || params.c0 > 0.9) {
      errors.push('Flow coefficient C0 out of typical range [0.3, 0.9]');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 计算瞬时误差（与标定值对比）
   */
  calculateError(predicted, actual) {
    const oilError = actual.oil > 0 ? Math.abs(predicted.oilRate - actual.oil) / actual.oil : 0;
    const gasError = actual.gas > 0 ? Math.abs(predicted.gasRate - actual.gas) / actual.gas : 0;
    const waterError = actual.water > 0 ? Math.abs(predicted.waterRate - actual.water) / actual.water : 0;

    return {
      oilError: Number(oilError.toFixed(4)),
      gasError: Number(gasError.toFixed(4)),
      waterError: Number(waterError.toFixed(4)),
      maxError: Number(Math.max(oilError, gasError, waterError).toFixed(4))
    };
  }
}

export const differentialPressureModel = new DifferentialPressureModel();
export default DifferentialPressureModel;