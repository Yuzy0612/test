// 分钟级计算调度任务
import { scheduler, JOB_SCHEDULES } from '../../jobs/scheduler.js';
import { realtimeCalculator } from '../calculation/RealtimeCalculator.js';
import { dataIngestionService } from './DataIngestionService.js';
import { productionRepository } from '../../repositories/index.js';

class CalculationJob {
  constructor() {
    this.isRunning = false;
    this.lastRunTime = null;
    this.processedWells = new Set();
  }

  /**
   * 执行分钟级计算
   * 遍历所有活跃井，计算实时产量
   */
  async execute() {
    if (this.isRunning) {
      console.log('[CalculationJob] Previous job still running, skipping');
      return;
    }

    this.isRunning = true;
    this.lastRunTime = new Date();
    const startTime = Date.now();

    try {
      console.log('[CalculationJob] Starting minute calculation at', this.lastRunTime.toISOString());

      // 1. 获取所有活跃井
      const activeWells = await this.getActiveWells();

      // 2. 收集各井传感器数据
      const wellDataPromises = activeWells.map(well =>
        this.collectWellSensorData(well.wellId)
      );

      const wellDataResults = await Promise.allSettled(wellDataPromises);

      // 3. 计算每口井的产量
      const calculationResults = [];
      for (let i = 0; i < activeWells.length; i++) {
        const well = activeWells[i];
        const dataResult = wellDataResults[i];

        if (dataResult.status === 'fulfilled' && dataResult.value) {
          try {
            const result = await realtimeCalculator.calculate({
              wellId: well.wellId,
              sensorData: dataResult.value,
              liftType: well.liftType,
              modelVersion: well.currentModelVersion || 'default'
            });

            calculationResults.push({
              wellId: well.wellId,
              success: true,
              result
            });

            this.processedWells.add(well.wellId);
          } catch (error) {
            console.error(`[CalculationJob] Error calculating well ${well.wellId}:`, error.message);
            calculationResults.push({
              wellId: well.wellId,
              success: false,
              error: error.message
            });
          }
        } else {
          calculationResults.push({
            wellId: well.wellId,
            success: false,
            error: 'No sensor data available'
          });
        }
      }

      // 4. 批量保存结果
      const successResults = calculationResults
        .filter(r => r.success && r.result)
        .map(r => r.result);

      if (successResults.length > 0) {
        await this.saveResults(successResults);
      }

      const duration = Date.now() - startTime;
      console.log(`[CalculationJob] Completed: ${successResults.length}/${activeWells.length} wells in ${duration}ms`);

      return {
        total: activeWells.length,
        success: successResults.length,
        failed: calculationResults.filter(r => !r.success).length,
        duration
      };

    } catch (error) {
      console.error('[CalculationJob] Fatal error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 获取所有活跃井
   * Mock实现，实际应从数据库查询
   */
  async getActiveWells() {
    // Mock数据 - 实际应从Well模型查询status为running的井
    return [
      { wellId: 'BIR-001', liftType: 'ESP', currentModelVersion: 'vfm-esp-20260420-01' },
      { wellId: 'BIR-002', liftType: 'PCP', currentModelVersion: 'vfm-pcp-20260415-01' },
      { wellId: 'CAS-001', liftType: 'ESPCP', currentModelVersion: 'vfm-espcp-20260410-02' }
    ];
  }

  /**
   * 收集井的传感器数据
   * Mock实现，实际应从消息队列或实时数据API获取
   */
  async collectWellSensorData(wellId) {
    // Mock传感器数据
    return {
      dp: 50 + Math.random() * 30,           // 差压 kPa
      pressure: 3000 + Math.random() * 1000, // 压力 kPa
      temperature: 45 + Math.random() * 10,  // 温度 °C
      current: 80 + Math.random() * 20,      // 电流 A
      voltage: 380 + Math.random() * 20,     // 电压 V
      frequency: 50,                          // 频率 Hz
      waterCut: 0.3 + Math.random() * 0.2    // 含水率
    };
  }

  /**
   * 保存计算结果
   * @param {Array} results
   */
  async saveResults(results) {
    try {
      await productionRepository.upsertBatch(results);
    } catch (error) {
      console.error('[CalculationJob] Error saving results:', error);
    }
  }

  /**
   * 启动调度任务
   */
  start() {
    scheduler.addJob('minute_calculation', JOB_SCHEDULES.MINUTE_CALCULATION, () => {
      this.execute().catch(err => {
        console.error('[CalculationJob] Scheduled execution failed:', err);
      });
    });
    console.log('[CalculationJob] Started minute calculation scheduler');
  }

  /**
   * 停止调度任务
   */
  stop() {
    scheduler.removeJob('minute_calculation');
    console.log('[CalculationJob] Stopped minute calculation scheduler');
  }
}

export const calculationJob = new CalculationJob();
export default CalculationJob;