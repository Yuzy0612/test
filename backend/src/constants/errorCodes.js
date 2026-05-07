// 通用错误码 (1xxx)
export const SUCCESS = 0;
export const PARAM_VALIDATION_FAILED = 1001;
export const NOT_FOUND = 1002;
export const UNAUTHORIZED = 1003;
export const FORBIDDEN = 1004;
export const INTERNAL_ERROR = 1005;
export const SERVICE_UNAVAILABLE = 1006;

// 数据错误 (2xxx)
export const DATA_SOURCE_UNAVAILABLE = 2001;
export const DATA_NOT_READY = 2002;
export const DATA_QUALITY_FAILED = 2003;

// 计算错误 (3xxx)
export const CALCULATION_FAILED = 3001;
export const MODEL_NOT_FOUND = 3002;
export const MODEL_VERSION_CONFLICT = 3003;
export const MODEL_ACCURACY_LOW = 3004;

// 业务错误 (4xxx)
export const CALIBRATION_INVALID = 4001;
export const ALLOCATION_RULE_NOT_FOUND = 4002;
export const ALLOCATION_DEVIATION_EXCEEDED = 4003;
export const REPORT_GENERATION_FAILED = 4004;

// 集成错误 (5xxx)
export const PI_SYNC_FAILED = 5001;
export const PI_CONNECTION_FAILED = 5002;
export const SSO_AUTH_FAILED = 5003;
export const SSO_TOKEN_EXPIRED = 5004;

export const ERROR_MESSAGES = {
  [SUCCESS]: 'Success',
  [PARAM_VALIDATION_FAILED]: 'Parameter validation failed',
  [NOT_FOUND]: 'Resource not found',
  [UNAUTHORIZED]: 'Unauthorized',
  [FORBIDDEN]: 'Access forbidden',
  [INTERNAL_ERROR]: 'Internal server error',
  [SERVICE_UNAVAILABLE]: 'Service unavailable',
  [DATA_SOURCE_UNAVAILABLE]: 'Data source unavailable',
  [DATA_NOT_READY]: 'Data not ready',
  [DATA_QUALITY_FAILED]: 'Data quality check failed',
  [CALCULATION_FAILED]: 'Calculation failed',
  [MODEL_NOT_FOUND]: 'Model not found',
  [MODEL_VERSION_CONFLICT]: 'Model version conflict',
  [MODEL_ACCURACY_LOW]: 'Model accuracy below threshold',
  [CALIBRATION_INVALID]: 'Calibration data invalid',
  [ALLOCATION_RULE_NOT_FOUND]: 'Allocation rule not found',
  [ALLOCATION_DEVIATION_EXCEEDED]: 'Allocation deviation exceeded threshold',
  [REPORT_GENERATION_FAILED]: 'Report generation failed',
  [PI_SYNC_FAILED]: 'PI sync failed',
  [PI_CONNECTION_FAILED]: 'PI connection failed',
  [SSO_AUTH_FAILED]: 'SSO authentication failed',
  [SSO_TOKEN_EXPIRED]: 'SSO token expired'
};