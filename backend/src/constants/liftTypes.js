// 举升方式枚举
export const LIFT_TYPES = {
  ESP: 'ESP',      // 电潜泵 (Electric Submersible Pump)
  PCP: 'PCP',      // 螺杆泵 (Progressing Cavity Pump)
  ESPCP: 'ESPCP'   // 电潜螺杆泵 (Electric Submersible PCP)
};

export const LIFT_TYPE_LABELS = {
  [LIFT_TYPES.ESP]: 'Electric Submersible Pump',
  [LIFT_TYPES.PCP]: 'Progressing Cavity Pump',
  [LIFT_TYPES.ESPCP]: 'Electric Submersible PCP'
};

// 默认模型参数（按井型）
export const DEFAULT_MODEL_PARAMS = {
  [LIFT_TYPES.ESP]: {
    densityOil: 850,        // 油密度 kg/m³
    densityWater: 1050,    // 水密度 kg/m³
    densityGas: 1.2,       // 气密度 kg/m³
    viscosityOil: 0.01,    // 油粘度 Pa.s
    gor: 200,              // 气油比 Sm³/Sm³
    c0: 0.6,               // 流量系数
    waterCutBase: 0.3      // 基础含水率
  },
  [LIFT_TYPES.PCP]: {
    densityOil: 850,
    densityWater: 1050,
    densityGas: 1.2,
    viscosityOil: 0.02,
    gor: 180,
    c0: 0.55,
    waterCutBase: 0.4
  },
  [LIFT_TYPES.ESPCP]: {
    densityOil: 850,
    densityWater: 1050,
    densityGas: 1.2,
    viscosityOil: 0.015,
    gor: 190,
    c0: 0.58,
    waterCutBase: 0.35
  }
};