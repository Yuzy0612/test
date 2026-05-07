import { CalibrationRecord, Well } from '../models/index.js';
import { responseSuccess, ERROR_CODES } from '../middleware/index.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

// 获取标定记录列表
export const getCalibrationRecords = async (req, res, next) => {
  try {
    const { wellId, startDate, endDate, quality, page = 1, pageSize = 20 } = req.query;

    const where = {};
    if (wellId) where.wellId = wellId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }
    if (quality) where['quality.status'] = quality;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const { count, rows } = await CalibrationRecord.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['timestamp', 'DESC']]
    });

    responseSuccess(res, {
      items: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    next(error);
  }
};

// 导入标定数据
export const importCalibrationData = async (req, res, next) => {
  try {
    const { wellId, records } = req.body;

    if (!wellId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: 'wellId 和 records 不能为空' });
    }

    const version = `CAL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().substring(0, 4)}`;
    const accepted = [];
    const rejected = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordErrors = [];

      if (!record.timestamp) {
        recordErrors.push('缺少时间戳');
      }
      if (typeof record.oil !== 'number' || record.oil < 0) {
        recordErrors.push('油产量无效');
      }
      if (typeof record.gas !== 'number' || record.gas < 0) {
        recordErrors.push('气产量无效');
      }
      if (typeof record.water !== 'number' || record.water < 0) {
        recordErrors.push('水产量无效');
      }

      const existingRecord = await CalibrationRecord.findOne({
        where: {
          wellId,
          timestamp: new Date(record.timestamp)
        }
      });
      if (existingRecord) {
        recordErrors.push(`时间戳 ${record.timestamp} 已存在`);
      }

      if (recordErrors.length > 0) {
        rejected.push(i);
        errors.push(`record[${i}]: ${recordErrors.join(', ')}`);
      } else {
        accepted.push({
          wellId,
          timestamp: new Date(record.timestamp),
          oil: record.oil,
          gas: record.gas,
          water: record.water,
          source: record.source || 'manual',
          quality: { status: 'valid', issues: [], checkedAt: new Date() },
          version,
          metadata: { importedAt: new Date(), operator: req.user?.username }
        });
      }
    }

    if (accepted.length > 0) {
      await CalibrationRecord.bulkCreate(accepted);
    }

    responseSuccess(res, {
      accepted: accepted.length,
      rejected: rejected.length,
      errors
    }, 'imported');
  } catch (error) {
    next(error);
  }
};

// 质量检查
export const qualityCheck = async (req, res, next) => {
  try {
    const { recordIds } = req.body;

    const records = await CalibrationRecord.findAll({ where: { id: recordIds } });
    const results = [];

    for (const record of records) {
      const issues = [];

      if (record.oil < 0 || record.oil > 1000) {
        issues.push('油产量超出合理范围 (0-1000)');
      }
      if (record.gas < 0 || record.gas > 10000) {
        issues.push('气产量超出合理范围 (0-10000)');
      }
      if (record.water < 0 || record.water > 1000) {
        issues.push('水产量超出合理范围 (0-1000)');
      }

      const total = record.oil + record.water;
      if (total > 0) {
        const wct = record.water / total;
        if (wct > 0.99) {
          issues.push('含水率异常 (>99%)');
        }
      }

      const newStatus = issues.length > 0 ? 'warning' : 'valid';

      await record.update({
        quality: { status: newStatus, issues, checkedAt: new Date() }
      });

      results.push({
        recordId: record.id,
        wellId: record.wellId,
        timestamp: record.timestamp,
        status: newStatus,
        issues
      });
    }

    responseSuccess(res, { results });
  } catch (error) {
    next(error);
  }
};
