import { responseError, ERROR_CODES } from './response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return responseError(res, ERROR_CODES.PARAM_VALIDATION_FAILED, '参数校验失败', errors);
  }

  // Mongoose 唯一索引冲突
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return responseError(res, ERROR_CODES.PARAM_VALIDATION_FAILED, `${field}已存在`);
  }

  // Mongoose CastError (无效的 ObjectId)
  if (err.name === 'CastError') {
    return responseError(res, ERROR_CODES.PARAM_VALIDATION_FAILED, '无效的ID格式');
  }

  // Joi 验证错误
  if (err.isJoi) {
    const errors = err.details.map(d => d.message);
    return responseError(res, ERROR_CODES.PARAM_VALIDATION_FAILED, '参数校验失败', errors);
  }

  // 默认错误
  const statusCode = err.statusCode || 500;
  const message = err.message || '内部错误';

  responseError(res, ERROR_CODES.INTERNAL_ERROR, message);
};

// 404 处理
export const notFoundHandler = (req, res) => {
  responseError(res, 404, '接口不存在');
};
