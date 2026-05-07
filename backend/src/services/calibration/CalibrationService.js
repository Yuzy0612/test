// 标定服务
import { CalibrationRecord } from '../../models/index.js';
import { Op } from 'sequelize';

class CalibrationService {
  /**
   * 导入标定数据
   * @param {string} wellId
   * @param {Array} records
   * @param {string} operator
   */
  async importRecords(wellId, records, operator) {
    const version = `CAL-${Date.now()}`;
    const accepted = [];
    const rejected = [];

    for (const record of records) {
      const validation = this.validateRecord(record);

      if (validation.isValid) {
        accepted.push({
          wellId,
          timestamp: record.timestamp,
          oil: record.oil,
          gas: record.gas,
          water: record.water,
          source: record.source || 'manual',
          qualityStatus: 'valid',
          qualityIssues: [],
          version,
          metadata: {
            importedAt: new Date(),
            operator
          }
        });
      } else {
        rejected.push({
          record,
          errors: validation.errors
        });
      }
    }

    if (accepted.length > 0) {
      await CalibrationRecord.bulkCreate(accepted);
    }

    return { accepted: accepted.length, rejected };
  }

  /**
   * 校验单条记录
   */
  validateRecord(record) {
    const errors = [];

    // 范围检查
    if (record.oil < 0 || record.oil > 1000) {
      errors.push('Oil production out of range [0, 1000]');
    }
    if (record.gas < 0 || record.gas > 50000) {
      errors.push('Gas production out of range [0, 50000]');
    }
    if (record.water < 0 || record.water > 1000) {
      errors.push('Water production out of range [0, 1000]');
    }

    // 含水率异常检查
    const total = record.oil + record.water;
    if (total > 0) {
      const wct = record.water / total;
      if (wct > 0.99) {
        errors.push('Water cut > 99%');
      }
    }

    // 时间戳检查
    if (!record.timestamp || isNaN(new Date(record.timestamp).getTime())) {
      errors.push('Invalid timestamp');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 数据质量检查
   * @param {Array} records
   */
  async qualityCheck(records) {
    return records.map(record => {
      const issues = [];

      // 范围检查
      if (record.oil < 0 || record.oil > 1000) {
        issues.push('Oil production out of range');
      }
      if (record.gas < 0 || record.gas > 50000) {
        issues.push('Gas production out of range');
      }
      if (record.water < 0 || record.water > 1000) {
        issues.push('Water production out of range');
      }

      // 含水率异常
      const total = record.oil + record.water;
      if (total > 0) {
        const wct = record.water / total;
        if (wct > 0.99) {
          issues.push('Water cut > 99%');
        }
      }

      return {
        ...record,
        qualityStatus: issues.length > 0 ? 'warning' : 'valid',
        qualityIssues: issues
      };
    });
  }

  /**
   * 获取某井的标定记录
   * @param {string} wellId
   * @param {Object} options - { startTime, endTime, version }
   */
  async getRecords(wellId, options = {}) {
    const where = { wellId };

    if (options.startTime || options.endTime) {
      where.timestamp = {};
      if (options.startTime) where.timestamp[Op.gte] = new Date(options.startTime);
      if (options.endTime) where.timestamp[Op.lte] = new Date(options.endTime);
    }

    if (options.version) {
      where.version = options.version;
    }

    return CalibrationRecord.findAll({
      where,
      order: [['timestamp', 'DESC']]
    });
  }

  /**
   * 版本管理 - 获取某井的所有版本
   * @param {string} wellId
   */
  async getVersions(wellId) {
    const records = await CalibrationRecord.findAll({
      where: { wellId },
      attributes: ['version'],
      group: ['version'],
      order: [['version', 'DESC']]
    });
    return records.map(r => r.version);
  }

  /**
   * 审批标定记录
   * @param {number} id
   * @param {string} validatedBy
   */
  async validateRecord(id, validatedBy) {
    const record = await CalibrationRecord.findByPk(id);
    if (!record) return null;

    return record.update({
      qualityStatus: 'valid',
      validatedBy,
      validatedAt: new Date()
    });
  }
}

export const calibrationService = new CalibrationService();
export default CalibrationService;