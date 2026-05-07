// 数据访问层 - 基础仓储
import { Model } from 'sequelize';

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * 根据ID查找
   * @param {number} id
   */
  async findById(id) {
    return this.model.findByPk(id);
  }

  /**
   * 查找所有
   * @param {Object} options
   */
  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  /**
   * 分页查找
   * @param {Object} options - { where, limit, offset, order }
   */
  async findPaginated(options = {}) {
    const { where = {}, limit = 20, offset = 0, order = [['createdAt', 'DESC']] } = options;

    const { count, rows } = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order
    });

    return {
      items: rows,
      total: count,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * 创建记录
   * @param {Object} data
   */
  async create(data) {
    return this.model.create(data);
  }

  /**
   * 批量创建
   * @param {Array} dataArray
   */
  async bulkCreate(dataArray) {
    return this.model.bulkCreate(dataArray);
  }

  /**
   * 更新
   * @param {number} id
   * @param {Object} data
   */
  async update(id, data) {
    const instance = await this.findById(id);
    if (!instance) return null;
    return instance.update(data);
  }

  /**
   * 根据条件更新
   * @param {Object} where
   * @param {Object} data
   */
  async updateWhere(where, data) {
    const [affectedCount] = await this.model.update(data, { where });
    return affectedCount;
  }

  /**
   * 删除
   * @param {number} id
   */
  async delete(id) {
    const instance = await this.findById(id);
    if (!instance) return false;
    await instance.destroy();
    return true;
  }

  /**
   * 根据条件删除
   * @param {Object} where
   */
  async deleteWhere(where) {
    return this.model.destroy({ where });
  }

  /**
   * 查找或创建
   * @param {Object} where
   * @param {Object} defaults
   */
  async findOrCreate(where, defaults) {
    return this.model.findOrCreate({ where, defaults });
  }

  /**
   * 更新或创建（upsert）
   * @param {Object} data
   */
  async upsert(data) {
    return this.model.upsert(data);
  }
}

export default BaseRepository;