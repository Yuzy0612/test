// 任务调度器
import cron from 'node-cron';

class Scheduler {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * 添加定时任务
   * @param {string} name - 任务名称
   * @param {string} cronExpression - cron表达式
   * @param {Function} handler - 任务处理函数
   */
  addJob(name, cronExpression, handler) {
    if (this.jobs.has(name)) {
      console.warn(`Job ${name} already exists, skipping`);
      return;
    }

    const job = cron.schedule(cronExpression, handler, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });

    this.jobs.set(name, job);
    console.log(`Scheduled job: ${name} (${cronExpression})`);
  }

  /**
   * 移除任务
   * @param {string} name - 任务名称
   */
  removeJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`Removed job: ${name}`);
    }
  }

  /**
   * 停止所有任务
   */
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop();
    });
    this.jobs.clear();
    console.log('All jobs stopped');
  }
}

export const scheduler = new Scheduler();

// 预定义任务
export const JOB_SCHEDULES = {
  // 分钟级计算任务 - 每分钟执行
  MINUTE_CALCULATION: '*/1 * * * *',
  // 迟到数据重算 - 每5分钟
  LATE_DATA_RECALC: '*/5 * * * *',
  // PI实时同步 - 每分钟
  PI_REALTIME_SYNC: '*/1 * * * *',
  // PI历史同步 - 每天凌晨2点
  PI_HISTORY_SYNC: '0 2 * * *',
  // 报表生成 - 每天早上8点
  REPORT_GENERATION: '0 8 * * *',
  // 模型精度监控 - 每天凌晨1点
  MODEL_ACCURACY_CHECK: '0 1 * * *',
  // 审计日志清理 - 每周一凌晨3点
  AUDIT_LOG_CLEANUP: '0 3 * * 1'
};