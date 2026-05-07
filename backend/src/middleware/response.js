// 统一响应格式
export const responseSuccess = (res, data, message = 'ok') => {
  return res.json({
    code: 0,
    message,
    data
  });
};

export const responseError = (res, code, message, details = null) => {
  const response = {
    code,
    message
  };
  if (details) {
    response.details = details;
  }
  return res.status(code >= 1000 ? 400 : code).json(response);
};

// 常用错误码
export const ERROR_CODES = {
  PARAM_VALIDATION_FAILED: 1001,
  UNAUTHORIZED: 1002,
  FORBIDDEN: 1003,
  NOT_FOUND: 1004,
  DATA_SOURCE_UNAVAILABLE: 2001,
  MODEL_CALCULATION_FAILED: 3001,
  EXTERNAL_SYNC_FAILED: 4001,
  INTERNAL_ERROR: 5000
};
