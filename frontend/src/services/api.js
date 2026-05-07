const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api/v1';

const getToken = () => localStorage.getItem('token');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const api = {
  // Wells
  getWells: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/wells${query ? `?${query}` : ''}`);
  },
  getWellById: (wellId) => request(`/wells/${wellId}`),
  createWells: (wells) => request('/wells', { method: 'POST', body: JSON.stringify({ wells }) }),
  updateWell: (wellId, data) => request(`/wells/${wellId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWell: (wellId) => request(`/wells/${wellId}`, { method: 'DELETE' }),

  // VFM
  getWellRealtime: (wellId) => request(`/vfm/realtime/${wellId}`),
  queryWellsRealtime: (wellIds, time) => request('/vfm/realtime/batch', { method: 'POST', body: JSON.stringify({ wellIds, time }) }),
  getWellHistory: (wellId, params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/vfm/history/${wellId}${query ? `?${query}` : ''}`);
  },

  // Calibration
  getCalibrationRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/calibration${query ? `?${query}` : ''}`);
  },
  importCalibrationData: (wellId, records) => request('/calibration/import', { method: 'POST', body: JSON.stringify({ wellId, records }) }),
  qualityCheck: (recordIds) => request('/calibration/quality-check', { method: 'POST', body: JSON.stringify({ recordIds }) }),

  // Models
  getModels: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/models${query ? `?${query}` : ''}`);
  },
  publishModel: (modelId, data) => request(`/models/${modelId}/publish`, { method: 'POST', body: JSON.stringify(data) }),
  rollbackModel: (modelId, data) => request(`/models/${modelId}/rollback`, { method: 'POST', body: JSON.stringify(data) }),
  getModelErrorAnalysis: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/models/error-analysis${query ? `?${query}` : ''}`);
  },

  // Allocation
  getAllocationRules: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/allocation/rules${query ? `?${query}` : ''}`);
  },
  createAllocationRule: (data) => request('/allocation/rules', { method: 'POST', body: JSON.stringify(data) }),
  updateAllocationRule: (ruleId, data) => request(`/allocation/rules/${ruleId}`, { method: 'PUT', body: JSON.stringify(data) }),
  activateAllocationRule: (ruleId) => request(`/allocation/rules/${ruleId}/activate`, { method: 'POST' }),
  runAllocation: (data) => request('/allocation/run', { method: 'POST', body: JSON.stringify(data) }),
  getAllocationResults: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/allocation/results${query ? `?${query}` : ''}`);
  },

  // Reports
  getReportTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports${query ? `?${query}` : ''}`);
  },
  createReportTask: (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  getReportTaskById: (reportId) => request(`/reports/${reportId}`),
  triggerReportGeneration: (reportId) => request(`/reports/${reportId}/trigger`, { method: 'POST' }),
  deleteReportTask: (reportId) => request(`/reports/${reportId}`, { method: 'DELETE' }),
  downloadReport: (reportId) => request(`/reports/${reportId}/download`),

  // Integration
  getIntegrationJobs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/integration${query ? `?${query}` : ''}`);
  },
  getIntegrationJobById: (jobId) => request(`/integration/${jobId}`),
  syncPIRealtime: (wellIds, timeRange) => request('/integration/pi/realtime', { method: 'POST', body: JSON.stringify({ wellIds, timeRange }) }),
  syncPIHistorical: (wellIds, startDate, endDate) => request('/integration/pi/historical', { method: 'POST', body: JSON.stringify({ wellIds, startDate, endDate }) }),
  triggerSSOSync: () => request('/integration/sso/sync', { method: 'POST' }),
  retryIntegrationJob: (jobId) => request(`/integration/${jobId}/retry`, { method: 'POST' }),

  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
};

export default api;
