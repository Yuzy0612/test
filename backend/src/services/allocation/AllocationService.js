// 区块回配服务
import { AllocationRule, AllocationResult } from '../../models/index.js';
import { Op } from 'sequelize';

class AllocationService {
  /**
   * 执行区块回配
   * @param {Object} params - { blockId, startTime, endTime, ruleVersion, granularity }
   */
  async executeAllocation(params) {
    const { blockId, startTime, endTime, ruleVersion, granularity } = params;

    // 1. 获取激活的分配规则
    const rule = await this.getActiveRule(blockId, ruleVersion);
    if (!rule) {
      throw new Error('Allocation rule not found');
    }

    // 2. 获取区块内所有井的实时产量
    const wellsProduction = await this.getWellsProduction(blockId, startTime, endTime);

    // 3. 计算总量
    const totals = this.calculateTotals(wellsProduction);

    // 4. 根据权重策略分配
    const allocations = await this.allocateByWeight(wellsProduction, totals, rule);

    // 5. 守恒校验
    const conservationCheck = this.verifyConservation(totals, allocations);

    // 6. 生成任务ID并保存结果
    const taskId = `ALLOC-${Date.now()}`;

    const result = await AllocationResult.create({
      taskId,
      block: blockId,
      allocationDate: new Date(startTime),
      ruleId: rule.ruleId,
      totalOil: totals.oilRate,
      totalGas: totals.gasRate,
      totalWater: totals.waterRate,
      deviation: conservationCheck.deviation,
      conservationCheck: conservationCheck.isValid,
      wellAllocations: allocations,
      status: 'completed',
      executedBy: params.operator || 'system'
    });

    return {
      taskId,
      blockId,
      totals,
      allocations,
      conservationCheck,
      status: 'completed'
    };
  }

  /**
   * 获取激活的分配规则
   */
  async getActiveRule(blockId, ruleVersion) {
    const where = {
      block: blockId,
      status: 'active'
    };

    if (ruleVersion) {
      where.ruleId = ruleVersion;
    }

    const rule = await AllocationRule.findOne({
      where: {
        ...where,
        effectiveFrom: { [Op.lte]: new Date() },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: new Date() } }
        ]
      },
      order: [['effectiveFrom', 'DESC']]
    });

    return rule;
  }

  /**
   * 获取区块内井的产量数据（Mock实现）
   * 实际应从realtime_production表查询
   */
  async getWellsProduction(blockId, startTime, endTime) {
    // Mock数据 - 实际应查询数据库
    return [
      { wellId: `${blockId}-001`, oilRate: 50, gasRate: 1000, waterRate: 30 },
      { wellId: `${blockId}-002`, oilRate: 45, gasRate: 900, waterRate: 25 }
    ];
  }

  /**
   * 计算总量
   */
  calculateTotals(wellsProduction) {
    return wellsProduction.reduce((acc, well) => ({
      oilRate: acc.oilRate + well.oilRate,
      gasRate: acc.gasRate + well.gasRate,
      waterRate: acc.waterRate + well.waterRate
    }), { oilRate: 0, gasRate: 0, waterRate: 0 });
  }

  /**
   * 权重分配算法
   */
  allocateByWeight(wellsProduction, totals, rule) {
    const { weightStrategy } = rule;

    return wellsProduction.map(well => {
      let weight;

      switch (weightStrategy) {
        case 'equal':
          weight = 1 / wellsProduction.length;
          break;
        case 'oil':
          weight = totals.oilRate > 0 ? well.oilRate / totals.oilRate : 0;
          break;
        case 'gas':
          weight = totals.gasRate > 0 ? well.gasRate / totals.gasRate : 0;
          break;
        case 'water':
          weight = totals.waterRate > 0 ? well.waterRate / totals.waterRate : 0;
          break;
        default:
          weight = 1 / wellsProduction.length;
      }

      return {
        wellId: well.wellId,
        allocatedOil: Number((totals.oilRate * weight).toFixed(2)),
        allocatedGas: Number((totals.gasRate * weight).toFixed(2)),
        allocatedWater: Number((totals.waterRate * weight).toFixed(2)),
        weight: Number(weight.toFixed(4)),
        allocationPercentage: Number((weight * 100).toFixed(2))
      };
    });
  }

  /**
   * 守恒校验
   */
  verifyConservation(totals, allocations) {
    const allocatedOil = allocations.reduce((sum, a) => sum + a.allocatedOil, 0);
    const allocatedGas = allocations.reduce((sum, a) => sum + a.allocatedGas, 0);
    const allocatedWater = allocations.reduce((sum, a) => sum + a.allocatedWater, 0);

    const deviationOil = totals.oilRate > 0 ? Math.abs(allocatedOil - totals.oilRate) / totals.oilRate : 0;
    const deviationGas = totals.gasRate > 0 ? Math.abs(allocatedGas - totals.gasRate) / totals.gasRate : 0;
    const deviationWater = totals.waterRate > 0 ? Math.abs(allocatedWater - totals.waterRate) / totals.waterRate : 0;

    const maxDeviation = Math.max(deviationOil, deviationGas, deviationWater);
    const threshold = 0.001; // 0.1%

    return {
      isValid: maxDeviation <= threshold,
      deviations: {
        oil: Number(deviationOil.toFixed(6)),
        gas: Number(deviationGas.toFixed(6)),
        water: Number(deviationWater.toFixed(6))
      },
      deviation: Number(maxDeviation.toFixed(6))
    };
  }

  /**
   * 获取回配规则列表
   */
  async getRules(blockId) {
    return AllocationRule.findAll({
      where: blockId ? { block: blockId } : {},
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * 创建回配规则
   */
  async createRule(ruleData) {
    const ruleId = `RULE-${Date.now()}`;
    return AllocationRule.create({
      ruleId,
      ...ruleData,
      status: 'draft'
    });
  }

  /**
   * 激活规则
   */
  async activateRule(ruleId) {
    const rule = await AllocationRule.findOne({ where: { ruleId } });
    if (!rule) return null;

    return rule.update({ status: 'active' });
  }
}

export const allocationService = new AllocationService();
export default AllocationService;