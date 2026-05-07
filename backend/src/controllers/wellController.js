import { wells, realtimeByWell } from '../data.js';
import { responseSuccess, ERROR_CODES } from '../middleware/index.js';

// 获取井列表
export const getWells = async (req, res, next) => {
  try {
    const { field, block, liftType, page = 1, pageSize = 20 } = req.query;

    let filteredWells = [...wells];

    if (field) filteredWells = filteredWells.filter(w => w.field === field);
    if (block) filteredWells = filteredWells.filter(w => w.block === block);
    if (liftType) filteredWells = filteredWells.filter(w => w.liftType === liftType);

    const total = filteredWells.length;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedWells = filteredWells.slice(offset, offset + parseInt(pageSize));

    responseSuccess(res, {
      items: paginatedWells,
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    });
  } catch (error) {
    next(error);
  }
};

// 获取单个井详情
export const getWellById = async (req, res, next) => {
  try {
    const { wellId } = req.params;
    const well = wells.find(w => w.wellId === wellId);

    if (!well) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '井不存在' });
    }

    const realtime = realtimeByWell[wellId] || {};
    responseSuccess(res, { ...well, ...realtime });
  } catch (error) {
    next(error);
  }
};

// 批量新增井
export const createWells = async (req, res, next) => {
  try {
    const { wells } = req.body;

    if (!Array.isArray(wells) || wells.length === 0) {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: 'wells必须是非空数组' });
    }

    const wellsToInsert = wells.map(w => ({
      wellId: w.wellId || `WELL-${uuidv4().substring(0, 8)}`,
      field: w.field,
      block: w.block,
      liftType: w.liftType,
      templateId: w.templateId,
      status: 'offline'
    }));

    const result = await Well.bulkCreate(wellsToInsert, { validate: false });

    responseSuccess(res, {
      created: result.length,
      failed: wells.length - result.length
    }, 'created');
  } catch (error) {
    next(error);
  }
};

// 更新井信息
export const updateWell = async (req, res, next) => {
  try {
    const { wellId } = req.params;
    const updates = req.body;

    const well = await Well.findOne({ where: { wellId } });

    if (!well) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '井不存在' });
    }

    await well.update(updates);

    responseSuccess(res, well);
  } catch (error) {
    next(error);
  }
};

// 删除井
export const deleteWell = async (req, res, next) => {
  try {
    const { wellId } = req.params;

    const deleted = await Well.destroy({ where: { wellId } });

    if (deleted === 0) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '井不存在' });
    }

    responseSuccess(res, { deleted: 1 });
  } catch (error) {
    next(error);
  }
};
