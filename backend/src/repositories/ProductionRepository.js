import BaseRepository from './BaseRepository.js';
import { RealtimeProduction } from '../models/index.js';

class ProductionRepository extends BaseRepository {
  constructor() {
    super(RealtimeProduction);
  }

  /**
   * 获取某井最新产量数据
   * @param {string} wellId
   */
  async getLatest(wellId) {
    return this.model.findOne({
      where: { wellId },
      order: [['timestamp', 'DESC']]
    });
  }

  /**
   * 获取某井在时间范围内的产量数据
   * @param {string} wellId
   * @param {Date} startTime
   * @param {Date} endTime
   */
  async getByTimeRange(wellId, startTime, endTime) {
    return this.findAll({
      where: {
        wellId,
        timestamp: {
          $gte: startTime,
          $lte: endTime
        }
      },
      order: [['timestamp', 'ASC']]
    });
  }

  /**
   * 批量Upsert产量数据
   * @param {Array} records - [{wellId, timestamp, oilRate, gasRate, waterRate, ...}]
   */
  async upsertBatch(records) {
    return this.model.bulkWrite(
      records.map(r => ({
        updateOne: {
          filter: { wellId: r.wellId, timestamp: r.timestamp },
          update: { $set: r },
          upsert: true
        }
      }))
    );
  }

  /**
   * 获取多井最新产量
   * @param {Array<string>} wellIds
   */
  async getLatestBatch(wellIds) {
    const { Op } = require('sequelize');

    // 使用子查询获取每口井的最新记录
    const results = await this.model.findAll({
      where: {
        wellId: { [Op.in]: wellIds }
      },
      order: [['timestamp', 'DESC']],
      limit: wellIds.length * 10 // 宽松限制，然后在应用层过滤
    });

    // 按井分组，每井只取最新一条
    const latestMap = new Map();
    for (const row of results) {
      if (!latestMap.has(row.wellId)) {
        latestMap.set(row.wellId, row);
      }
    }

    return Array.from(latestMap.values());
  }

  /**
   * 获取指定时间的整点数据
   * @param {Date} targetTime
   * @param {Array<string>} wellIds
   */
  async getAtTime(targetTime, wellIds) {
    const { Op } = require('sequelize');
    const startOfMinute = new Date(targetTime);
    startOfMinute.setSeconds(0, 0);
    const endOfMinute = new Date(startOfMinute);
    endOfMinute.setMinutes(endOfMinute.getMinutes() + 1);

    return this.findAll({
      where: {
        wellId: { [Op.in]: wellIds },
        timestamp: {
          $gte: startOfMinute,
          $lt: endOfMinute
        }
      }
    });
  }
}

export const productionRepository = new ProductionRepository();
export default ProductionRepository;