export const wells = [
  { wellId: "BIR-001", field: "Birrea", block: "B1", liftType: "ESP", status: "running" },
  { wellId: "CAS-002", field: "Casava", block: "C2", liftType: "PCP", status: "running" },
  { wellId: "PAR-003", field: "Parkia", block: "P1", liftType: "ESPCP", status: "warning" },
  { wellId: "MOU-004", field: "Moul", block: "M1", liftType: "ESP", status: "running" },
  { wellId: "RAP-005", field: "Raphia", block: "R1", liftType: "PCP", status: "stopped" }
];

export const realtimeByWell = {
  "BIR-001": { oilRate: 52.3, gasRate: 1120.5, waterRate: 38.7, qualityFlag: "valid" },
  "CAS-002": { oilRate: 41.8, gasRate: 950.2, waterRate: 44.9, qualityFlag: "valid" },
  "PAR-003": { oilRate: 36.1, gasRate: 870.4, waterRate: 56.3, qualityFlag: "estimated" },
  "MOU-004": { oilRate: 48.6, gasRate: 1035.9, waterRate: 47.2, qualityFlag: "valid" },
  "RAP-005": { oilRate: 0, gasRate: 0, waterRate: 0, qualityFlag: "invalid" }
};

export const allocationRules = [
  { ruleId: "rule-v1", blockId: "B1", weight: 1.0, effectiveFrom: "2026-04-01T00:00:00+08:00" },
  { ruleId: "rule-v2", blockId: "C2", weight: 0.95, effectiveFrom: "2026-04-10T00:00:00+08:00" }
];

export const roles = [
  {
    roleId: "role-admin",
    roleName: "系统管理员",
    roleCode: "ADMIN",
    permissions: ["user:create", "user:update", "user:delete", "role:manage"]
  },
  {
    roleId: "role-engineer",
    roleName: "生产工程师",
    roleCode: "ENGINEER",
    permissions: ["well:view", "vfm:view", "report:view"]
  }
];

export const users = [
  {
    userId: "user-001",
    username: "zhangsan",
    displayName: "张三",
    email: "zhangsan@vfm.local",
    status: "active",
    roleId: "role-admin"
  },
  {
    userId: "user-002",
    username: "lisi",
    displayName: "李四",
    email: "lisi@vfm.local",
    status: "active",
    roleId: "role-engineer"
  }
];

export const calibrationRecords = [
  {
    calibrationId: "cal-001",
    wellId: "BIR-001",
    timestamp: "2026-04-26T10:00:00+08:00",
    oil: 51.4,
    gas: 1102.2,
    water: 39.1,
    source: "field_test",
    qualityStatus: "passed",
    version: "cal-v1"
  }
];

export const modelVersions = [
  {
    modelId: "vfm-coupled-20260420-01",
    liftType: "ESP",
    status: "online",
    publishedAt: "2026-04-20T09:00:00+08:00",
    metrics: { mae: 4.3, mape: 11.2, rmse: 5.6 }
  },
  {
    modelId: "vfm-coupled-20260410-03",
    liftType: "ESP",
    status: "rollback_candidate",
    publishedAt: "2026-04-10T09:00:00+08:00",
    metrics: { mae: 5.0, mape: 13.8, rmse: 6.7 }
  }
];

export const reportTasks = [
  { reportId: 'RPT-001', name: '日报-2026-04-27', type: 'daily', format: 'pdf', status: 'completed', progress: 100, createdAt: '2026-04-27 08:00', completedAt: '2026-04-27 08:05', fileUrl: '/reports/RPT-001.pdf' },
  { reportId: 'RPT-002', name: '周报-第17周', type: 'weekly', format: 'excel', status: 'completed', progress: 100, createdAt: '2026-04-21 08:00', completedAt: '2026-04-21 08:10', fileUrl: '/reports/RPT-002.xlsx' },
  { reportId: 'RPT-003', name: '日报-2026-04-28', type: 'daily', format: 'pdf', status: 'running', progress: 60, createdAt: '2026-04-28 08:00', completedAt: null, fileUrl: null },
  { reportId: 'RPT-004', name: '月报-2026年4月', type: 'monthly', format: 'pdf', status: 'pending', progress: 0, createdAt: '2026-04-28 09:00', completedAt: null, fileUrl: null },
  { reportId: 'RPT-005', name: '日报-2026-04-29', type: 'daily', format: 'excel', status: 'failed', progress: 0, createdAt: '2026-04-29 08:00', completedAt: null, fileUrl: null },
];
