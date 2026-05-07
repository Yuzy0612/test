import { AuditLog } from '../models/index.js';

export const createAuditLog = async (req, res, next) => {
  // 响应完成后记录审计日志
  res.on('finish', async () => {
    try {
      const logData = {
        userId: req.user?.userId,
        username: req.user?.username || 'anonymous',
        action: req.method,
        resource: req.originalUrl.split('?')[0],
        target: req.params.id || req.body?.id,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        requestBody: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
        responseCode: res.statusCode,
        result: res.statusCode < 400 ? 'success' : 'failure',
        duration: Date.now() - (req.startTime || Date.now())
      };

      await AuditLog.create(logData);
    } catch (error) {
      console.error('Audit log error:', error);
    }
  });
  next();
};
