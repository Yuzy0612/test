import { wells, realtimeByWell } from '../data.js';
import { responseSuccess, ERROR_CODES } from '../middleware/index.js';

// 生成模拟历史数据
const generateHistoryData = (wellId, startTime, endTime, interval = 'hour') => {
  const points = [];
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const intervalMs = interval === 'hour' ? 3600000 : interval === 'minute' ? 60000 : 3600000;

  const baseData = realtimeByWell[wellId] || { oilRate: 50, gasRate: 1000, waterRate: 40 };

  for (let t = start; t <= end; t += intervalMs) {
    points.push({
      timestamp: new Date(t).toISOString(),
      oilRate: baseData.oilRate + (Math.random() - 0.5) * 5,
      gasRate: baseData.gasRate + (Math.random() - 0.5) * 50,
      waterRate: baseData.waterRate + (Math.random() - 0.5) * 3,
      qualityFlag: 'valid'
    });
  }
  return points;
};

// 获取单井实时三相产量
export const getWellRealtime = async (req, res, next) => {
  try {
    const { wellId } = req.params;

    const well = wells.find(w => w.wellId === wellId);
    if (!well) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '井不存在' });
    }

    const realtime = realtimeByWell[wellId] || { oilRate: 0, gasRate: 0, waterRate: 0, qualityFlag: 'invalid' };

    responseSuccess(res, {
      wellId,
      timestamp: new Date().toISOString(),
      oilRate: realtime.oilRate,
      gasRate: realtime.gasRate,
      waterRate: realtime.waterRate,
      qualityFlag: realtime.qualityFlag,
      modelVersion: `vfm-${well.liftType.toLowerCase()}-20260420`,
      cumulativeOil: 12500 + Math.random() * 1000,
      cumulativeGas: 280000 + Math.random() * 10000,
      cumulativeWater: 9800 + Math.random() * 500
    });
  } catch (error) {
    next(error);
  }
};

// 批量查询多井实时产量
export const queryWellsRealtime = async (req, res, next) => {
  try {
    const { wellIds, time } = req.body;

    // If no wellIds or empty array, return all wells
    const targetWellIds = !Array.isArray(wellIds) || wellIds.length === 0
      ? wells.map(w => w.wellId)
      : wellIds;

    const results = targetWellIds.map(wellId => {
      const well = wells.find(w => w.wellId === wellId);
      const realtime = realtimeByWell[wellId] || { oilRate: 0, gasRate: 0, waterRate: 0, qualityFlag: 'invalid' };

      return {
        wellId,
        oilRate: realtime.oilRate || (well?.oilRate || 0),
        gasRate: realtime.gasRate || (well?.gasRate || 0),
        waterRate: realtime.waterRate || (well?.waterRate || 0),
        qualityFlag: realtime.qualityFlag || (well?.status === 'running' ? 'valid' : 'invalid')
      };
    });

    responseSuccess(res, results);
  } catch (error) {
    next(error);
  }
};

// 获取井历史数据（趋势用）
export const getWellHistory = async (req, res, next) => {
  try {
    const { wellId } = req.params;
    // Accept both startTime/endTime and startDate/endDate
    const { startTime, endTime, startDate, endDate, interval = 'hour', metrics = 'oilRate,gasRate,waterRate' } = req.query;

    const start = startTime || startDate;
    const end = endTime || endDate;

    if (!start || !end) {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: '需要 startTime 和 endTime' });
    }

    const well = wells.find(w => w.wellId === wellId);
    if (!well) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '井不存在' });
    }

    const metricList = metrics.split(',');
    const data = generateHistoryData(wellId, start, end, interval);

    const series = metricList.map(metric => ({
      metric,
      points: data.map(d => [d.timestamp, d[metric] || 0])
    }));

    responseSuccess(res, { series });
  } catch (error) {
    next(error);
  }
};
