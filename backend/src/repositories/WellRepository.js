import BaseRepository from './BaseRepository.js';
import { Well } from '../models/index.js';

class WellRepository extends BaseRepository {
  constructor() {
    super(Well);
  }

  /**
   * 根据井ID查找
   * @param {string} wellId
   */
  async findByWellId(wellId) {
    return this.model.findOne({ where: { wellId } });
  }

  /**
   * 根据油田和区块查找
   * @param {string} field
   * @param {string} block
   */
  async findByFieldAndBlock(field, block) {
    const where = {};
    if (field) where.field = field;
    if (block) where.block = block;
    return this.findAll({ where });
  }

  /**
   * 根据举升类型查找
   * @param {string} liftType
   */
  async findByLiftType(liftType) {
    return this.findAll({ where: { liftType } });
  }

  /**
   * 获取所有油田列表
   */
  async getFields() {
    const results = await this.model.findAll({
      attributes: ['field'],
      group: ['field']
    });
    return results.map(r => r.field);
  }

  /**
   * 获取某油田的所有区块
   * @param {string} field
   */
  async getBlocks(field) {
    const results = await this.model.findAll({
      attributes: ['block'],
      where: { field },
      group: ['block']
    });
    return results.map(r => r.block);
  }

  /**
   * 根据井ID列表查找
   * @param {Array<string>} wellIds
   */
  async findByWellIds(wellIds) {
    return this.findAll({
      where: { wellId: wellIds }
    });
  }

  /**
   * 更新井状态
   * @param {string} wellId
   * @param {string} status
   */
  async updateStatus(wellId, status) {
    const well = await this.findByWellId(wellId);
    if (!well) return null;
    return well.update({ status });
  }

  /**
   * 更新当前模型版本
   * @param {string} wellId
   * @param {string} modelVersion
   */
  async updateModelVersion(wellId, modelVersion) {
    const well = await this.findByWellId(wellId);
    if (!well) return null;
    return well.update({ currentModelVersion: modelVersion });
  }
}

export const wellRepository = new WellRepository();
export default WellRepository;