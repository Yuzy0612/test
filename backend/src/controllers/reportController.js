import { ReportTask } from '../models/index.js';
import { responseSuccess, ERROR_CODES } from '../middleware/index.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { reportTasks as mockReportTasks } from '../data.js';
import { generateDailyReport, generateWeeklyReport, generateMonthlyReport, generateExcelReport } from '../services/reportGenerator.js';

// 获取报表任务列表
export const getReportTasks = async (req, res, next) => {
  try {
    const { type, status, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    // Try database first
    let items = [];
    let total = 0;

    try {
      const where = {};
      if (type) where.type = type;
      if (status) where.status = status;
      if (startDate || endDate) {
        where.scheduledAt = {};
        if (startDate) where.scheduledAt[Op.gte] = new Date(startDate);
        if (endDate) where.scheduledAt[Op.lte] = new Date(endDate);
      }

      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const { count, rows } = await ReportTask.findAndCountAll({
        where,
        offset,
        limit: parseInt(pageSize),
        order: [['scheduledAt', 'DESC']]
      });
      items = rows;
      total = count;
    } catch (dbError) {
      // Fallback to mock data
      let filtered = [...mockReportTasks];
      if (type) filtered = filtered.filter(t => t.type === type);
      if (status) filtered = filtered.filter(t => t.status === status);
      total = filtered.length;
      const pageNum = parseInt(page);
      const size = parseInt(pageSize);
      const start = (pageNum - 1) * size;
      items = filtered.slice(start, start + size);
    }

    responseSuccess(res, {
      items,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    next(error);
  }
};

// 创建报表任务
export const createReportTask = async (req, res, next) => {
  try {
    const { type, name, parameters, scheduledAt, format } = req.body;

    if (!type || !name) {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: 'type 和 name 不能为空' });
    }

    let task;
    try {
      task = await ReportTask.create({
        reportId: `RPT-${uuidv4().substring(0, 8)}`,
        type,
        name,
        format: format || 'pdf',
        parameters: parameters || {},
        status: 'pending',
        progress: 0,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        createdBy: req.user?.userId
      });
    } catch (dbError) {
      // Mock mode - create in-memory task
      task = {
        reportId: `RPT-${uuidv4().substring(0, 8)}`,
        type,
        name,
        format: format || 'pdf',
        parameters: parameters || {},
        status: 'pending',
        progress: 0,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        createdAt: new Date().toISOString(),
        completedAt: null,
        fileUrl: null
      };
      mockReportTasks.push(task);
    }

    responseSuccess(res, task, 'created');
  } catch (error) {
    next(error);
  }
};

// 获取报表任务详情
export const getReportTaskById = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    let task;
    try {
      task = await ReportTask.findOne({ where: { reportId } });
    } catch (dbError) {
      task = mockReportTasks.find(t => t.reportId === reportId);
    }

    if (!task) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '报表任务不存在' });
    }

    responseSuccess(res, task);
  } catch (error) {
    next(error);
  }
};

// 手动触发报表生成
export const triggerReportGeneration = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    let task;
    try {
      task = await ReportTask.findOne({ where: { reportId } });
    } catch (dbError) {
      task = mockReportTasks.find(t => t.reportId === reportId);
    }

    if (!task) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '报表任务不存在' });
    }

    task.status = 'running';
    task.progress = 0;
    task.startedAt = new Date();

    // Generate report file asynchronously
    (async () => {
      try {
        const now = new Date();
        let filePath;

        if (task.format === 'excel') {
          filePath = await generateExcelReport(task.reportId, task);
        } else if (task.type === 'daily') {
          filePath = await generateDailyReport(task.reportId, now.toISOString().split('T')[0]);
        } else if (task.type === 'weekly') {
          const weekNum = getWeekNumber(now);
          filePath = await generateWeeklyReport(task.reportId, weekNum, now.getFullYear());
        } else if (task.type === 'monthly') {
          filePath = await generateMonthlyReport(task.reportId, now.getFullYear(), now.getMonth() + 1);
        } else {
          filePath = await generateDailyReport(task.reportId, now.toISOString().split('T')[0]);
        }

        task.progress = 100;
        task.status = 'completed';
        task.completedAt = new Date();
        const fileName = filePath.split(/[/\\]/).pop();
        task.fileUrl = `/reports/${fileName}`;
      } catch (err) {
        console.error('Report generation error:', err);
        task.status = 'failed';
        task.progress = 0;
      }
    })();

    responseSuccess(res, { reportId: task.reportId, status: task.status, message: '报表生成已启动' });
  } catch (error) {
    next(error);
  }
};

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 删除报表任务
export const deleteReportTask = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    let deleted;
    try {
      deleted = await ReportTask.destroy({ where: { reportId } });
    } catch (dbError) {
      const idx = mockReportTasks.findIndex(t => t.reportId === reportId);
      if (idx >= 0) {
        mockReportTasks.splice(idx, 1);
        deleted = 1;
      } else {
        deleted = 0;
      }
    }

    if (deleted === 0) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '报表任务不存在' });
    }

    responseSuccess(res, { deleted: 1 });
  } catch (error) {
    next(error);
  }
};

// 下载报表
export const downloadReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    let task;
    try {
      task = await ReportTask.findOne({ where: { reportId } });
    } catch (dbError) {
      task = mockReportTasks.find(t => t.reportId === reportId);
    }

    if (!task) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '报表任务不存在' });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: '报表尚未生成完成' });
    }

    responseSuccess(res, { fileUrl: task.fileUrl, reportId: task.reportId });
  } catch (error) {
    next(error);
  }
};
