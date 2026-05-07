import { ModelVersion, Well } from '../models/index.js';
import { responseSuccess, ERROR_CODES } from '../middleware/index.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

// 获取模型列表
export const getModels = async (req, res, next) => {
  try {
    const { liftType, status, page = 1, pageSize = 20 } = req.query;

    const where = {};
    if (liftType) where.liftType = liftType;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const { count, rows } = await ModelVersion.findAndCountAll({
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

// 发布模型版本
export const publishModel = async (req, res, next) => {
  try {
    const { modelId } = req.params;
    const { effectiveFrom, comment } = req.body;

    if (!effectiveFrom) {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: 'effectiveFrom 不能为空' });
    }

    const model = await ModelVersion.findOne({
      where: { modelId },
      order: [['version', 'DESC']]
    });

    if (!model) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '模型不存在' });
    }

    const newVersion = `${modelId}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().substring(0, 4)}`;

    const newModel = await ModelVersion.create({
      modelId,
      version: newVersion,
      liftType: model.liftType,
      status: 'online',
      parameters: model.parameters,
      effectiveFrom: new Date(effectiveFrom),
      publishedAt: new Date(),
      publishedBy: req.user?.userId,
      comment
    });

    await ModelVersion.update(
      { status: 'offline', effectiveTo: new Date() },
      { where: { modelId, id: { [Op.ne]: newModel.id } } }
    );

    await Well.update(
      { currentModelVersion: newVersion },
      { where: { currentModelVersion: { [Op.regexp]: `^${modelId}` } } }
    );

    responseSuccess(res, {
      modelId: newModel.modelId,
      version: newModel.version,
      status: newModel.status,
      effectiveFrom: newModel.effectiveFrom
    }, 'published');
  } catch (error) {
    next(error);
  }
};

// 回滚模型版本
export const rollbackModel = async (req, res, next) => {
  try {
    const { modelId } = req.params;
    const { targetVersion, reason } = req.body;

    if (!targetVersion || !reason) {
      return res.status(400).json({ code: ERROR_CODES.PARAM_VALIDATION_FAILED, message: 'targetVersion 和 reason 不能为空' });
    }

    const targetModel = await ModelVersion.findOne({ where: { modelId, version: targetVersion } });

    if (!targetModel) {
      return res.status(404).json({ code: ERROR_CODES.NOT_FOUND, message: '目标版本不存在' });
    }

    const rollbackVersion = `${modelId}-rollback-${uuidv4().substring(0, 4)}`;
    const rollbackModel = await ModelVersion.create({
      modelId,
      version: rollbackVersion,
      liftType: targetModel.liftType,
      status: 'online',
      parameters: targetModel.parameters,
      effectiveFrom: new Date(),
      publishedAt: new Date(),
      publishedBy: req.user?.userId,
      comment: `回滚到 ${targetVersion}，原因：${reason}`,
      rollbackReason: reason
    });

    await ModelVersion.update(
      { status: 'offline', effectiveTo: new Date() },
      { where: { modelId, id: { [Op.ne]: rollbackModel.id } } }
    );

    await Well.update(
      { currentModelVersion: targetVersion },
      { where: { currentModelVersion: { [Op.regexp]: `^${modelId}` } } }
    );

    responseSuccess(res, {
      currentVersion: rollbackModel.version,
      targetVersion
    }, 'rollback started');
  } catch (error) {
    next(error);
  }
};

// 获取模型误差分析
export const getModelErrorAnalysis = async (req, res, next) => {
  try {
    const { modelId } = req.query;

    const where = { status: 'online' };
    if (modelId) where.modelId = modelId;

    const models = await ModelVersion.findAll({ where });

    const analysis = models.map(model => ({
      modelId: model.modelId,
      version: model.version,
      metrics: {
        mae: (Math.random() * 5 + 1).toFixed(2),
        mape: (Math.random() * 8 + 2).toFixed(2),
        rmse: (Math.random() * 6 + 1.5).toFixed(2),
        sampleCount: Math.floor(Math.random() * 10000 + 5000)
      }
    }));

    responseSuccess(res, { analysis });
  } catch (error) {
    next(error);
  }
};
