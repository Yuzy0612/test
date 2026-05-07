// 迟到数据重算任务
import { scheduler, JOB_SCHEDULES } from '../../jobs/scheduler.js';
import { realtimeCalculator } from '../services/calculation/RealtimeCalculator.js';
import { productionRepository } from '../repositories/index.js';

class LateDataRecalcJob {
  constructor() {
    this.LATE_DATA_WINDOW = 10 * 60 * 1000; // 10分钟
    this.retryQueue = new Map();
  }

  /**
   * 处理迟到数据
   * @param {string} wellId
   * @param {Date} targetTime - 目标计算时间
   * @param {Object} lateData - 迟到数据
   */
  async processLateData(wellId, targetTime, lateData) {
    const now = Date.now();
    const targetTimestamp = new Date(targetTime).getTime();

    // 检查是否在允许窗口内
    if (now - targetTimestamp > this.LATE_DATA_WINDOW) {
      return {
        success: false,
        error: 'Late data beyond allowed window (10 minutes)',
        wellId,
        targetTime,
        age: Math.floor((now - targetTimestamp) / 60000) + ' minutes'
      };
    }

    try {
      // 重新计算
      const result = await realtimeCalculator.recalculateLateData(
        wellId,
        new Date(targetTime),
        lateData
      );

      // 覆盖原有结果
      await productionRepository.upsert({
        wellId,
        timestamp: new Date(targetTime),
        ...result
      });

      // 触发PI重新同步（如果需要）
      await this.triggerPISync(wellId);

      return {
        success: true,
        wellId,
        targetTime,
        result
      };

    } catch (error) {
      console.error(`[LateDataRecalcJob] Error processing late data for ${wellId}:`, error);
      return {
        success: false,
        error: error.message,
        wellId,
        targetTime
      };
    }
  }

  /**
   * 添加到重试队列
   * @param {string} wellId
   * @param {Date} targetTime
   * @param {Object} lateData
   */
  addToRetryQueue(wellId, targetTime, lateData) {
    const key = `${wellId}_${targetTime}`;

    if (!this.retryQueue.has(key)) {
      this.retryQueue.set(key, {
        wellId,
        targetTime,
        lateData,
        attempts: 0,
        maxAttempts: 3,
        nextRetryTime: null
      });
    }

    const record = this.retryQueue.get(key);
    record.attempts++;

    if (record.attempts < record.maxAttempts) {
      // 指数退避: 1min, 2min, 4min
      const delay = Math.pow(2, record.attempts - 1) * 60000;
      record.nextRetryTime = Date.now() + delay;

      setTimeout(() => {
        this.processLateData(wellId, targetTime, lateData);
      }, delay);
    } else {
      // 超过最大重试次数，记录失败
      console.error(`[LateDataRecalcJob] Max retry attempts reached for ${wellId}`);
      this.retryQueue.delete(key);
    }
  }

  /**
   * 触发PI重新同步
   * @param {string} wellId
   */
  async triggerPISync(wellId) {
    // 实际应调用PIService.syncRealtime([wellId])
    console.log(`[LateDataRecalcJob] Triggering PI sync for well ${wellId}`);
  }

  /**
   * 定时清理过期队列项
   */
  cleanupExpiredQueue() {
    const now = Date.now();
    for (const [key, record] of this.retryQueue.entries()) {
      if (record.nextRetryTime && now > record.nextRetryTime + 300000) {
        // 超过5分钟的记录清理掉
        this.retryQueue.delete(key);
      }
    }
  }

  /**
   * 启动调度
   */
  start() {
    // 每5分钟执行一次迟到数据重算
    scheduler.addJob('late_data_recalc', JOB_SCHEDULES.LATE_DATA_RECALC, () => {
      this.cleanupExpiredQueue();
    });
    console.log('[LateDataRecalcJob] Started late data recalculation scheduler');
  }

  /**
   * 停止调度
   */
  stop() {
    scheduler.removeJob('late_data_recalc');
    console.log('[LateDataRecalcJob] Stopped late data recalculation scheduler');
  }
}

export const lateDataRecalcJob = new LateDataRecalcJob();
export default LateDataRecalcJob;