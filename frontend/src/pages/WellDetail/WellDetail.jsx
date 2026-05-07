import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import LineChart from "../../components/LineChart";
import api from "../../services/api";

// Mock data for well detail
const mockWellData = {
  "BIR-001": { wellId: "BIR-001", field: "Birrea", block: "B1", liftType: "ESP", status: "running", oilRate: 52.3, gasRate: 1120, waterRate: 38.7 },
  "BIR-002": { wellId: "BIR-002", field: "Birrea", block: "B1", liftType: "ESP", status: "running", oilRate: 48.1, gasRate: 980, waterRate: 42.3 },
  "BIR-003": { wellId: "BIR-003", field: "Birrea", block: "B2", liftType: "PCP", status: "warning", oilRate: 35.6, gasRate: 720, waterRate: 55.2 },
  "CAS-001": { wellId: "CAS-001", field: "Casava", block: "C1", liftType: "ESPCP", status: "running", oilRate: 61.4, gasRate: 1350, waterRate: 28.9 },
  "CAS-002": { wellId: "CAS-002", field: "Casava", block: "C1", liftType: "ESP", status: "alert", oilRate: 12.8, gasRate: 280, waterRate: 89.3 },
};

const mockModelVersions = [
  { version: "vfm-esp-20260420-01", status: "online", publishedAt: "2026-04-20 10:00", publishedBy: "张三", comment: "优化差压参数" },
  { version: "vfm-esp-20260410-03", status: "offline", publishedAt: "2026-04-10 14:30", publishedBy: "李四", comment: "调整LSTM权重" },
  { version: "vfm-esp-20260328-01", status: "offline", publishedAt: "2026-03-28 09:15", publishedBy: "王五", comment: "初始版本" },
];

const mockErrorAnalysis = [
  { date: "2026-04-27", mae: 3.2, mape: 5.8, rmse: 4.1, sampleCount: 1440 },
  { date: "2026-04-26", mae: 2.8, mape: 5.2, rmse: 3.6, sampleCount: 1440 },
  { date: "2026-04-25", mae: 4.1, mape: 7.3, rmse: 5.2, sampleCount: 1440 },
  { date: "2026-04-24", mae: 3.5, mape: 6.4, rmse: 4.5, sampleCount: 1440 },
  { date: "2026-04-23", mae: 2.9, mape: 5.5, rmse: 3.8, sampleCount: 1440 },
];

function WellDetail() {
  const { wellId } = useParams();
  const [activeTab, setActiveTab] = useState("realtime");
  const [lang, setLang] = useState("zh");
  const [well, setWell] = useState(mockWellData[wellId] || mockWellData["BIR-001"]);
  const [modelVersions, setModelVersions] = useState(mockModelVersions);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [targetVersion, setTargetVersion] = useState(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollingBack, setRollingBack] = useState(false);

  const t = (zh, en) => lang === "zh" ? zh : en;

  useEffect(() => {
    fetchWellData();
    fetchModelVersions();
  }, [wellId]);

  const fetchWellData = async () => {
    try {
      const response = await api.getWellById(wellId);
      if (response.data) {
        setWell(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch well data:', error);
      // Fallback to mock data
      setWell(mockWellData[wellId] || mockWellData["BIR-001"]);
    }
  };

  const fetchModelVersions = async () => {
    try {
      const response = await api.getModels({ modelId: wellId });
      if (response.data?.items) {
        setModelVersions(response.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch model versions:', error);
    }
  };

  // Generate chart data
  const chartData = Array.from({ length: 60 }, (_, i) => ({
    time: Date.now() - (60 - i) * 60 * 1000,
    oil: well.oilRate + (Math.random() - 0.5) * 5 + Math.sin(i / 10) * 3,
    gas: well.gasRate + (Math.random() - 0.5) * 50 + Math.cos(i / 8) * 30,
    water: well.waterRate + (Math.random() - 0.5) * 3 + Math.sin(i / 12) * 2,
  }));

  const handleRollback = async () => {
    if (!targetVersion || !rollbackReason.trim()) {
      alert(t('请填写回滚原因', 'Please provide rollback reason'));
      return;
    }

    try {
      setRollingBack(true);
      await api.rollbackModel(targetVersion.modelId, {
        targetVersion: targetVersion.version,
        reason: rollbackReason
      });
      alert(t('回滚已启动', 'Rollback started'));
      setShowRollbackConfirm(false);
      setRollbackReason("");
      setTargetVersion(null);
      fetchModelVersions();
    } catch (error) {
      console.error('Rollback failed:', error);
      alert(t('回滚失败', 'Rollback failed'));
    } finally {
      setRollingBack(false);
    }
  };

  const openRollbackConfirm = (model) => {
    setTargetVersion(model);
    setShowRollbackConfirm(true);
  };

  return (
    <div className="page-content">
      {/* Rollback Confirmation Modal */}
      {showRollbackConfirm && targetVersion && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)",
            width: "500px", border: "1px solid var(--border-subtle)"
          }}>
            <h3 style={{ marginBottom: "var(--space-md)", fontSize: "18px", fontWeight: 600, color: "var(--status-warning)" }}>
              ⚠️ {t("确认回滚模型版本", "Confirm Model Version Rollback")}
            </h3>

            <div style={{
              background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px", padding: "var(--space-md)", marginBottom: "var(--space-lg)"
            }}>
              <div style={{ marginBottom: "var(--space-sm)" }}>
                <span style={{ color: "var(--text-muted)" }}>{t("目标版本", "Target Version")}: </span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{targetVersion.version}</span>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                {t("发布时间", "Published At")}: {targetVersion.publishedAt}
              </div>
            </div>

            <div style={{ marginBottom: "var(--space-md)" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "var(--space-xs)" }}>
                {t("回滚原因 (必填)", "Rollback Reason (Required)")}
              </label>
              <textarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder={t("请输入回滚原因...", "Please enter rollback reason...")}
                style={{
                  width: "100%", height: "100px", padding: "8px 12px",
                  background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)",
                  borderRadius: "6px", color: "var(--text-primary)", fontSize: "13px"
                }}
              />
            </div>

            <div style={{
              background: "var(--bg-tertiary)", borderRadius: "8px", padding: "var(--space-md)",
              marginBottom: "var(--space-lg)", fontSize: "13px"
            }}>
              <div style={{ fontWeight: 600, marginBottom: "var(--space-xs)" }}>
                {t("影响说明", "Impact Notes")}
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-secondary)" }}>
                <li>{t("当前在线版本将被替换为所选历史版本", "Current online version will be replaced with selected historical version")}</li>
                <li>{t("所有使用该模型的井将自动切换到新版本", "All wells using this model will automatically switch to the new version")}</li>
                <li>{t("回滚操作会创建一条新的回滚记录", "Rollback operation will create a new rollback record")}</li>
                <li>{t("切换过程预计需要数秒", "Switching process is expected to take a few seconds")}</li>
              </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-sm)" }}>
              <button className="btn btn-secondary" onClick={() => { setShowRollbackConfirm(false); setRollbackReason(""); }} disabled={rollingBack}>
                {t("取消", "Cancel")}
              </button>
              <button className="btn btn-primary" onClick={handleRollback} disabled={rollingBack}>
                {rollingBack ? t("回滚中...", "Rolling back...") : t("确认回滚", "Confirm Rollback")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            {well.wellId}
            <span className={`well-type-badge ${well.liftType?.toLowerCase() || 'esp'}`}>{well.liftType || 'ESP'}</span>
            <span className={`table-status ${well.status || 'running'}`} style={{ fontSize: '12px' }}>
              {well.status === "running" ? t("运行中", "Running") : well.status === "warning" ? t("告警", "Warning") : t("离线", "Offline")}
            </span>
          </h1>
          <p className="page-subtitle">
            {well.field} / {well.block} / {t("采油方式", "Lift Type")}: {well.liftType}
          </p>
        </div>
        <div className="header-actions">
          <button className="lang-toggle" onClick={() => setLang(l => l === "zh" ? "en" : "zh")}>
            {lang === "zh" ? "EN" : "中"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "var(--space-lg)" }}>
        <button className={`tab-btn ${activeTab === 'realtime' ? 'active' : ''}`} onClick={() => setActiveTab("realtime")}>
          {t("实时曲线", "Real-time")}
        </button>
        <button className={`tab-btn ${activeTab === 'model' ? 'active' : ''}`} onClick={() => setActiveTab("model")}>
          {t("模型版本", "Model Version")}
        </button>
        <button className={`tab-btn ${activeTab === 'error' ? 'active' : ''}`} onClick={() => setActiveTab("error")}>
          {t("误差分析", "Error Analysis")}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "realtime" && (
        <div className="main-grid">
          <div className="well-list-section">
            <div className="section-header">
              <div className="section-title">{t("实时产量曲线", "Real-time Production")}</div>
              <div className="section-actions">
                <select className="filter-select" style={{ background: "var(--bg-tertiary)", padding: "4px 8px", borderRadius: "6px" }}>
                  <option>{t("最近1小时", "Last 1 hour")}</option>
                  <option>{t("最近6小时", "Last 6 hours")}</option>
                  <option>{t("最近24小时", "Last 24 hours")}</option>
                </select>
              </div>
            </div>
            <div className="chart-container" style={{ height: "350px" }}>
              <div className="chart-canvas">
                <LineChart data={chartData} height={320} />
              </div>
            </div>
            <div className="chart-legend">
              <div className="legend-item"><span className="legend-dot oil"></span>{t("油产量", "Oil")}</div>
              <div className="legend-item"><span className="legend-dot gas"></span>{t("气产量", "Gas")}</div>
              <div className="legend-item"><span className="legend-dot water"></span>{t("水产量", "Water")}</div>
            </div>
          </div>

          <div className="right-panel">
            <div className="well-detail-card">
              <div className="well-detail-header">
                <div className="well-detail-title">{t("当前产量", "Current Production")}</div>
              </div>
              <div className="detail-stats">
                <div className="detail-stat">
                  <div className="detail-stat-value oil">{well.oilRate || 0}<span className="detail-stat-unit">m³/d</span></div>
                  <div className="detail-stat-label">{t("油", "Oil")}</div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-value gas">{well.gasRate || 0}<span className="detail-stat-unit">Sm³/d</span></div>
                  <div className="detail-stat-label">{t("气", "Gas")}</div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-value water">{well.waterRate || 0}<span className="detail-stat-unit">m³/d</span></div>
                  <div className="detail-stat-label">{t("水", "Water")}</div>
                </div>
              </div>
              <div className="detail-footer">
                <div className={`quality-badge ${well.status === "running" ? "valid" : "estimated"}`}>
                  <span className="status-dot" style={{ background: "currentColor" }}></span>
                  {well.status === "running" ? t("数据有效", "Valid") : t("数据估计", "Estimated")}
                </div>
                <div className="model-version">{well.currentModelVersion || `vfm-${well.liftType?.toLowerCase() || 'esp'}-20260420`}</div>
              </div>
            </div>

            <div className="alert-panel" style={{ marginTop: "var(--space-lg)" }}>
              <div className="section-header">
                <div className="section-title">{t("输入参数", "Input Parameters")}</div>
              </div>
              <div className="alert-list">
                <div className="alert-item">
                  <div className="alert-icon info">📊</div>
                  <div className="alert-content">
                    <div className="alert-title">{t("井口压力", "Wellhead Pressure")}</div>
                    <div className="alert-meta">3.2 MPa</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon info">📊</div>
                  <div className="alert-content">
                    <div className="alert-title">{t("井口温度", "Wellhead Temperature")}</div>
                    <div className="alert-meta">45.8 °C</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon info">📊</div>
                  <div className="alert-content">
                    <div className="alert-title">{t("计量差压", "Metering DP")}</div>
                    <div className="alert-meta">125.3 kPa</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "model" && (
        <div className="well-list-section">
          <div className="section-header">
            <div className="section-title">{t("模型版本历史", "Model Version History")}</div>
            <button className="btn btn-sm btn-secondary">{t("模型对比", "Compare")}</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("版本", "Version")}</th>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("状态", "Status")}</th>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("发布时间", "Published At")}</th>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("发布人", "Published By")}</th>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("备注", "Comment")}</th>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("操作", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              {modelVersions.map((model) => (
                <tr key={model.version} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "13px" }}>{model.version}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`table-status ${model.status === "online" ? "running" : "offline"}`}>
                      {model.status === "online" ? t("在线", "Online") : model.status === "testing" ? t("测试中", "Testing") : t("离线", "Offline")}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {model.publishedAt ? new Date(model.publishedAt).toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px" }}>{model.publishedBy || '-'}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-muted)" }}>{model.comment || '-'}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {model.status === "offline" && (
                      <button className="btn btn-sm btn-secondary" onClick={() => openRollbackConfirm(model)}>
                        {t("回滚", "Rollback")}
                      </button>
                    )}
                    {model.status === "online" && (
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>✓ {t("当前版本", "Current")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "error" && (
        <div className="main-grid">
          <div className="well-list-section">
            <div className="section-header">
              <div className="section-title">{t("误差统计 (MAE/MAPE/RMSE)", "Error Statistics")}</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("日期", "Date")}</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>MAE</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>MAPE (%)</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>RMSE</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("样本数", "Samples")}</th>
                </tr>
              </thead>
              <tbody>
                {mockErrorAnalysis.map((row) => (
                  <tr key={row.date} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)" }}>{row.date}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", color: row.mae > 4 ? "var(--status-alert)" : "var(--status-running)" }}>{row.mae}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", color: row.mape > 7 ? "var(--status-alert)" : "var(--status-running)" }}>{row.mape}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", color: row.rmse > 5 ? "var(--status-alert)" : "var(--status-running)" }}>{row.rmse}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{row.sampleCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="right-panel">
            <div className="stat-card wells">
              <div className="stat-label">{t("平均绝对误差 (MAE)", "Mean Absolute Error")}</div>
              <div className="stat-value" style={{ color: "var(--status-running)" }}>3.3</div>
              <div className="stat-footer">
                <span className="stat-trend up">✓</span>
                <span className="stat-period">{t("优于目标", "Below Target")}</span>
              </div>
            </div>
            <div className="stat-card oil" style={{ marginTop: "var(--space-md)" }}>
              <div className="stat-label">{t("平均百分比误差 (MAPE)", "Mean Absolute % Error")}</div>
              <div className="stat-value oil">6.0%</div>
              <div className="stat-footer">
                <span className="stat-trend up">✓</span>
                <span className="stat-period">{t("优于目标", "Below Target")}</span>
              </div>
            </div>
            <div className="stat-card water" style={{ marginTop: "var(--space-md)" }}>
              <div className="stat-label">{t("均方根误差 (RMSE)", "Root Mean Square Error")}</div>
              <div className="stat-value water">4.2</div>
              <div className="stat-footer">
                <span className="stat-trend up">✓</span>
                <span className="stat-period">{t("优于目标", "Below Target")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WellDetail;
