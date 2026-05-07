// PI同步服务
import axios from 'axios';
import { IntegrationJob } from '../../models/index.js';

class PIService {
  constructor() {
    this.retryCount = 3;
    this.retryInterval = 5 * 60 * 1000; // 5分钟
    this.retryQueue = new Map(); // jobId -> retry info
    this.pendingRetries = new Map(); // jobId -> timeoutId
  }

  /**
   * 同步实时数据到PI
   * @param {Array} wellIds
   */
  async syncRealtime(wellIds) {
    const timestamp = new Date();
    const jobId = `PI-SYNC-${Date.now()}`;

    // 创建集成任务记录
    const job = await IntegrationJob.create({
      jobId,
      type: 'pi_realtime_sync',
      status: 'running',
      parameters: { wellIds, timestamp: timestamp.toISOString() },
      startedAt: timestamp
    });

    try {
      // 1. 获取最新产量数据
      const productionData = await this.getLatestProduction(wellIds);

      // 2. 转换为PI标签格式
      const piTags = this.transformToPITags(productionData, timestamp);

      // 3. 调用PI Web API写入
      const result = await this.writeToPI(piTags);

      // 4. 更新任务状态
      await job.update({
        status: 'completed',
        recordsProcessed: piTags.length,
        result: { success: true, processed: piTags.length },
        completedAt: new Date()
      });

      return { success: true, jobId, processed: piTags.length };

    } catch (error) {
      await this.handleWriteError(job, error);
      return { success: false, jobId, error: error.message };
    }
  }

  /**
   * 获取最新产量数据（Mock实现）
   */
  async getLatestProduction(wellIds) {
    // Mock数据 - 实际应从realtime_production表查询
    return wellIds.map(wellId => ({
      wellId,
      oilRate: 50 + Math.random() * 10,
      gasRate: 1000 + Math.random() * 200,
      waterRate: 30 + Math.random() * 10,
      qualityFlag: 'valid'
    }));
  }

  /**
   * 转换为PI标签格式
   */
  transformToPITags(productionData, timestamp) {
    const tags = [];
    const ts = timestamp.toISOString();

    productionData.forEach(prod => {
      tags.push(
        { tag: `VFM.${prod.wellId}.OIL_RATE`, value: prod.oilRate, timestamp: ts },
        { tag: `VFM.${prod.wellId}.GAS_RATE`, value: prod.gasRate, timestamp: ts },
        { tag: `VFM.${prod.wellId}.WATER_RATE`, value: prod.waterRate, timestamp: ts },
        { tag: `VFM.${prod.wellId}.QUALITY`, value: prod.qualityFlag, timestamp: ts }
      );
    });

    return tags;
  }

  /**
   * 写入PI系统（带重试）
   */
  async writeToPI(tags, maxRetries = 3) {
    const PI_WEB_API_URL = process.env.PI_WEB_API_URL || 'https://pi-server/piwebapi';
    const PI_API_TOKEN = process.env.PI_API_TOKEN || 'mock-token';

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 实际实现应使用 axios 调用 PI Web API
        console.log(`PI sync attempt ${attempt}/${maxRetries}: ${tags.length} tags to ${PI_WEB_API_URL}`);

        // Mock成功响应
        // 实际代码：
        // const response = await axios.post(`${PI_WEB_API_URL}/batch`, {
        //   items: tags.map(t => ({
        //     path: t.tag,
        //     value: t.value,
        //     timestamp: t.timestamp
        //   }))
        // }, {
        //   headers: { 'Authorization': `Bearer ${PI_API_TOKEN}` }
        // });
        // return { success: true, data: response.data };

        return { success: true, processed: tags.length };

      } catch (error) {
        lastError = error;
        console.warn(`PI sync attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          // 指数退避等待
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * 处理写入错误并安排重试
   */
  async handleWriteError(job, error) {
    const currentRetry = job.retryCount || 0;

    await job.update({
      status: currentRetry < this.retryCount ? 'pending_retry' : 'failed',
      errorDetails: error.message,
      retryCount: currentRetry + 1
    });

    // 如果还有重试次数，安排重试
    if (currentRetry < this.retryCount) {
      this.scheduleRetry(job.jobId, job.parameters, currentRetry + 1);
    }
  }

  /**
   * 调度重试任务
   */
  scheduleRetry(jobId, parameters, retryNumber) {
    // 清除已有的重试计划
    if (this.pendingRetries.has(jobId)) {
      clearTimeout(this.pendingRetries.get(jobId));
    }

    // 计算延迟（指数退避）
    const delay = Math.pow(2, retryNumber) * this.retryInterval;

    console.log(`Scheduling retry ${retryNumber} for job ${jobId} in ${delay}ms`);

    const timeoutId = setTimeout(async () => {
      await this.executeRetry(jobId, parameters, retryNumber);
      this.pendingRetries.delete(jobId);
    }, delay);

    this.pendingRetries.set(jobId, timeoutId);
    this.retryQueue.set(jobId, { parameters, retryNumber, scheduledAt: Date.now() });
  }

  /**
   * 执行重试
   */
  async executeRetry(originalJobId, parameters, retryNumber) {
    const newJobId = `PI-RETRY-${Date.now()}`;

    const job = await IntegrationJob.create({
      jobId: newJobId,
      type: 'pi_realtime_sync',
      status: 'running',
      parameters: {
        ...parameters,
        retryOf: originalJobId,
        retryNumber
      },
      retryCount: retryNumber,
      startedAt: new Date()
    });

    try {
      const { wellIds } = parameters;
      const productionData = await this.getLatestProduction(wellIds);
      const piTags = this.transformToPITags(productionData, new Date());

      const result = await this.writeToPI(piTags);

      await job.update({
        status: 'completed',
        recordsProcessed: piTags.length,
        result: { success: true, processed: piTags.length, retryNumber },
        completedAt: new Date()
      });

      // 更新原任务状态
      await IntegrationJob.update(
        { status: 'completed', result: { retried: true, newJobId } },
        { where: { jobId: originalJobId } }
      );

      return { success: true, jobId: newJobId };

    } catch (error) {
      await job.update({
        status: retryNumber < this.retryCount ? 'pending_retry' : 'failed',
        errorDetails: error.message,
        retryCount: retryNumber
      });

      if (retryNumber < this.retryCount) {
        this.scheduleRetry(originalJobId, parameters, retryNumber + 1);
      }

      return { success: false, jobId: newJobId, error: error.message };
    }
  }

  /**
   * 取消待重试的任务
   */
  cancelRetry(jobId) {
    if (this.pendingRetries.has(jobId)) {
      clearTimeout(this.pendingRetries.get(jobId));
      this.pendingRetries.delete(jobId);
    }
    if (this.retryQueue.has(jobId)) {
      this.retryQueue.delete(jobId);
    }
  }

  /**
   * 获取同步状态
   * @param {string} startTime
   * @param {string} endTime
   */
  async getSyncStatus(startTime, endTime) {
    const { Op } = require('sequelize');

    const where = {
      type: 'pi_realtime_sync'
    };

    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = new Date(startTime);
      if (endTime) where.createdAt[Op.lte] = new Date(endTime);
    }

    const jobs = await IntegrationJob.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    const total = jobs.length;
    const success = jobs.filter(j => j.status === 'completed').length;
    const failed = jobs.filter(j => j.status === 'failed').length;
    const pendingRetry = jobs.filter(j => j.status === 'pending_retry').length;

    return {
      successRate: total > 0 ? (success / total).toFixed(3) : 1,
      totalJobs: total,
      successCount: success,
      failedCount: failed,
      pendingRetryCount: pendingRetry,
      lastSyncTime: jobs[0]?.createdAt,
      pendingRetries: Array.from(this.retryQueue.keys())
    };
  }

  /**
   * 重试同步任务（手动触发）
   * @param {string} jobId
   */
  async retryJob(jobId) {
    const job = await IntegrationJob.findOne({ where: { jobId } });
    if (!job) return { success: false, error: 'Job not found' };

    // 取消已有的自动重试
    this.cancelRetry(jobId);

    // 创建新的重试任务
    const newJobId = `PI-MANUAL-RETRY-${Date.now()}`;

    const newJob = await IntegrationJob.create({
      jobId: newJobId,
      type: job.type,
      status: 'running',
      parameters: {
        ...job.parameters,
        retryOf: jobId,
        manualRetry: true
      },
      retryCount: (job.retryCount || 0) + 1,
      startedAt: new Date()
    });

    // 异步执行
    setImmediate(() => this.executeManualRetry(newJob));

    return { success: true, jobId: newJobId, message: 'Retry scheduled' };
  }

  /**
   * 执行手动重试
   */
  async executeManualRetry(job) {
    try {
      const { wellIds } = job.parameters;
      const productionData = await this.getLatestProduction(wellIds);
      const piTags = this.transformToPITags(productionData, new Date());

      const result = await this.writeToPI(piTags);

      await job.update({
        status: 'completed',
        recordsProcessed: piTags.length,
        result: { success: true, processed: piTags.length },
        completedAt: new Date()
      });

    } catch (error) {
      await job.update({
        status: 'failed',
        errorDetails: error.message,
        completedAt: new Date()
      });
    }
  }

  /**
   * 辅助方法：休眠
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取待重试队列状态
   */
  getRetryQueueStatus() {
    const queue = [];
    for (const [jobId, info] of this.retryQueue) {
      queue.push({
        jobId,
        retryNumber: info.retryNumber,
        scheduledAt: new Date(info.scheduledAt).toISOString(),
        status: this.pendingRetries.has(jobId) ? 'scheduled' : 'executing'
      });
    }
    return queue;
  }
}

export const piService = new PIService();
export default PIService;
