import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { responseError, ERROR_CODES } from './response.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vfm-secret-key';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return responseError(res, ERROR_CODES.UNAUTHORIZED, '未认证或令牌失效');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.userId);
    if (!user || user.status !== 'active') {
      return responseError(res, ERROR_CODES.UNAUTHORIZED, '用户不存在或已禁用');
    }

    req.user = {
      userId: user.userId,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return responseError(res, ERROR_CODES.UNAUTHORIZED, '令牌无效');
    }
    if (error.name === 'TokenExpiredError') {
      return responseError(res, ERROR_CODES.UNAUTHORIZED, '令牌已过期');
    }
    next(error);
  }
};

// 权限检查中间件
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return responseError(res, ERROR_CODES.UNAUTHORIZED, '未认证');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return responseError(res, ERROR_CODES.FORBIDDEN, '无权限访问');
    }
    next();
  };
};
