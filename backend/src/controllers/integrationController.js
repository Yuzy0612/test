import { IntegrationJob } from '../models/index.js';
import { responseSuccess, ERROR_CODES } from '../middleware/index.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

// 获取集成任务列表
export const getIntegrationJobs = async (req, res, next) => {
  try {
    const { type, status, page = 1, pageSize = 20 } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const { count, rows } = await IntegrationJob.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
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

// 触发PI实时数据同步
export const syncPIRealtimeData = async (req, res, next) => {
  try {
    const { wellIds, timeRange } = req.body;

    const jobId = `PI-${uuidv4().substring(0, 8)}`;
    const startTime = timeRange?.start ? new Date(timeRange.start) : new Date(Date.now() - 3600000);
    const endTime = timeRange?.end ? new Date(timeRange.end) : new Date();

    const job = await IntegrationJob.create({
      jobId,
      type: 'pi_realtime_sync',
      status: 'running',
      parameters: { wellIds, timeRange: { start: startTime, end: endTime } },
      startedAt: new Date(),
      executedBy: req.user?.userId
    });

    setTimeout(async () => {
      await job.update({
        status: 'completed',
        completedAt: new Date(),
        recordsProcessed: Math.floor(Math.random() * 1000) + 100,
        result: { synced: job.recordsProcessed, failed: 0 }
      });
    }, 3000);

    responseSuccess(res, { jobId: job.jobId, status: job.status, message: 'PI同步任务已启动' });
  } catch (error) {
    next(error);
  }
};

// 触发PI历史数据同步
export const syncPIHistoricalData = async (req, res, next) => {
  try {
    const { wellIds, startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: 'startDate 和 endDate 不能为空' });
    }

    const jobId = `PI-${uuidv4().substring(0, 8)}`;

    const job = await IntegrationJob.create({
      jobId,
      type: 'pi_historical_sync',
      status: 'running',
      parameters: { wellIds, dateRange: { start: new Date(startDate), end: new Date(endDate) } },
      startedAt: new Date(),
      executedBy: req.user?.userId
    });

    setTimeout(async () => {
      await job.update({
        status: 'completed',
        completedAt: new Date(),
        recordsProcessed: Math.floor(Math.random() * 10000) + 1000,
        result: { synced: job.recordsProcessed, failed: Math.floor(Math.random() * 10) }
      });
    }, 5000);

    responseSuccess(res, { jobId: job.jobId, status: job.status, message: 'PI历史数据同步任务已启动' });
  } catch (error) {
    next(error);
  }
};

// 获取SSO用户列表同步状态
export const getSSOSyncStatus = async (req, res, next) => {
  try {
    const jobs = await IntegrationJob.findAll({
      where: { type: 'sso_user_sync' },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    responseSuccess(res, { jobs });
  } catch (error) {
    next(error);
  }
};

// 触发SSO用户同步
export const triggerSSOSync = async (req, res, next) => {
  try {
    const jobId = `SSO-${uuidv4().substring(0, 8)}`;

    const job = await IntegrationJob.create({
      jobId,
      type: 'sso_user_sync',
      status: 'running',
      parameters: {},
      startedAt: new Date(),
      executedBy: req.user?.userId
    });

    setTimeout(async () => {
      await job.update({
        status: 'completed',
        completedAt: new Date(),
        result: { synced: Math.floor(Math.random() * 50) + 10, failed: 0 }
      });
    }, 2000);

    responseSuccess(res, { jobId: job.jobId, status: job.status, message: 'SSO用户同步任务已启动' });
  } catch (error) {
    next(error);
  }
};

// 获取集成任务详情
export const getIntegrationJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await IntegrationJob.findOne({ where: { jobId } });

    if (!job) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '集成任务不存在' });
    }

    responseSuccess(res, job);
  } catch (error) {
    next(error);
  }
};

// 重试失败的任务
export const retryIntegrationJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await IntegrationJob.findOne({ where: { jobId } });
    if (!job) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '集成任务不存在' });
    }

    if (job.status !== 'failed') {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: '只能重试失败的任务' });
    }

    const newJobId = `RETRY-${uuidv4().substring(0, 8)}`;
    const newJob = await IntegrationJob.create({
      jobId: newJobId,
      type: job.type,
      status: 'running',
      parameters: job.parameters,
      retryCount: job.retryCount + 1,
      startedAt: new Date(),
      executedBy: req.user?.userId
    });

    setTimeout(async () => {
      await newJob.update({
        status: 'completed',
        completedAt: new Date(),
        result: { synced: Math.floor(Math.random() * 100), failed: 0 }
      });
    }, 3000);

    responseSuccess(res, { jobId: newJob.jobId, status: newJob.status, message: '任务重试已启动' });
  } catch (error) {
    next(error);
  }
};
