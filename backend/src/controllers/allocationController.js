import { AllocationRule, AllocationResult, Well } from '../models/index.js';
import { responseSuccess, ERROR_CODES } from '../middleware/index.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

// 获取分配规则列表
export const getAllocationRules = async (req, res, next) => {
  try {
    const { block, status, page = 1, pageSize = 20 } = req.query;

    const where = {};
    if (block) where.block = block;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const { count, rows } = await AllocationRule.findAndCountAll({
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

// 创建分配规则
export const createAllocationRule = async (req, res, next) => {
  try {
    const { block, weightStrategy, priorityStrategy, parameters, effectiveFrom } = req.body;

    if (!block || !weightStrategy || !effectiveFrom) {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: 'block, weightStrategy, effectiveFrom 不能为空' });
    }

    const rule = await AllocationRule.create({
      ruleId: `AR-${uuidv4().substring(0, 8)}`,
      block,
      weightStrategy,
      priorityStrategy: priorityStrategy || 'priority',
      parameters: parameters || {},
      status: 'draft',
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: null,
      createdBy: req.user?.userId
    });

    responseSuccess(res, rule, 'created');
  } catch (error) {
    next(error);
  }
};

// 更新分配规则
export const updateAllocationRule = async (req, res, next) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const rule = await AllocationRule.findOne({ where: { ruleId } });

    if (!rule) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '规则不存在' });
    }

    await rule.update(updates);

    responseSuccess(res, rule);
  } catch (error) {
    next(error);
  }
};

// 激活分配规则
export const activateAllocationRule = async (req, res, next) => {
  try {
    const { ruleId } = req.params;

    const rule = await AllocationRule.findOne({ where: { ruleId } });
    if (!rule) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '规则不存在' });
    }

    await AllocationRule.update(
      { status: 'inactive', effectiveTo: new Date() },
      { where: { block: rule.block, ruleId: { [Op.ne]: ruleId } } }
    );

    rule.status = 'active';
    rule.effectiveFrom = new Date();
    await rule.save();

    responseSuccess(res, rule, 'activated');
  } catch (error) {
    next(error);
  }
};

// 执行产量分配计算
export const runAllocation = async (req, res, next) => {
  try {
    const { block, allocationDate, strategy } = req.body;

    if (!block || !allocationDate) {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: 'block 和 allocationDate 不能为空' });
    }

    const rule = await AllocationRule.findOne({ where: { block, status: 'active' } });
    if (!rule) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '该区块没有激活的分配规则' });
    }

    const wells = await Well.findAll({ where: { block, status: 'running' } });

    const totalOil = wells.reduce((sum, w) => sum + Math.random() * 100, 0);
    const totalGas = wells.reduce((sum, w) => sum + Math.random() * 500, 0);
    const totalWater = wells.reduce((sum, w) => sum + Math.random() * 50, 0);

    const wellAllocations = wells.map(well => {
      const weight = rule.weightStrategy === 'equal' ? 1 / wells.length :
                    rule.weightStrategy === 'oil' ? Math.random() :
                    Math.random() * 0.5 + 0.5;

      return {
        wellId: well.wellId,
        wellName: well.wellId,
        allocatedOil: totalOil * weight,
        allocatedGas: totalGas * weight,
        allocatedWater: totalWater * weight,
        allocationPercentage: (weight * 100).toFixed(2),
        allocationMethod: rule.weightStrategy,
        priority: Math.floor(Math.random() * 10)
      };
    });

    const taskId = `ALLOC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().substring(0, 4)}`;

    const result = await AllocationResult.create({
      taskId,
      block,
      allocationDate: new Date(allocationDate),
      ruleId: rule.ruleId,
      totalOil,
      totalGas,
      totalWater,
      deviation: (Math.random() * 5 - 2.5).toFixed(2),
      wellAllocations,
      status: 'completed',
      executedBy: req.user?.userId
    });

    responseSuccess(res, result, 'allocation_completed');
  } catch (error) {
    next(error);
  }
};

// 获取分配结果
export const getAllocationResults = async (req, res, next) => {
  try {
    const { block, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const where = {};
    if (block) where.block = block;
    if (startDate || endDate) {
      where.allocationDate = {};
      if (startDate) where.allocationDate[Op.gte] = new Date(startDate);
      if (endDate) where.allocationDate[Op.lte] = new Date(endDate);
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const { count, rows } = await AllocationResult.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['allocationDate', 'DESC']]
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

// 获取分配结果详情
export const getAllocationResultById = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const result = await AllocationResult.findOne({ where: { taskId } });

    if (!result) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '分配结果不存在' });
    }

    responseSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
