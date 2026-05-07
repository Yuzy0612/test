import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate, BrowserRouter } from "react-router-dom";
import "./styles.css";

import WellDetail from "./pages/WellDetail/WellDetail";
import Calibration from "./pages/Calibration/Calibration";
import Allocation from "./pages/Allocation/Allocation";
import Trends from "./pages/Trends/Trends";
import Reports from "./pages/Reports/Reports";
import SystemManagement from "./pages/SystemManagement/SystemManagement";
import api from "./services/api";

const navItems = [
  { id: "dashboard", label: "实时看板", icon: "📊", path: "/" },
  { id: "well-detail", label: "井详情", icon: "🛢️", path: "/well/:wellId" },
  { id: "calibration", label: "标定管理", icon: "📏", path: "/calibration" },
  { id: "allocation", label: "区块回配", icon: "📊", path: "/allocation" },
  { id: "trends", label: "趋势分析", icon: "📈", path: "/trends" },
  { id: "reports", label: "报表中心", icon: "📑", path: "/reports" },
];

const systemNav = [
  { id: "system", label: "系统管理", icon: "⚙️", path: "/system" },
];

// Mock data for fallback when API is unavailable
const mockWells = [
  { wellId: "BIR-001", field: "Birrea", block: "B1", liftType: "ESP", status: "running", oilRate: 52.3, gasRate: 1120, waterRate: 38.7 },
  { wellId: "BIR-002", field: "Birrea", block: "B1", liftType: "ESP", status: "running", oilRate: 48.1, gasRate: 980, waterRate: 42.3 },
  { wellId: "BIR-003", field: "Birrea", block: "B2", liftType: "PCP", status: "warning", oilRate: 35.6, gasRate: 720, waterRate: 55.2 },
  { wellId: "CAS-001", field: "Casava", block: "C1", liftType: "ESPCP", status: "running", oilRate: 61.4, gasRate: 1350, waterRate: 28.9 },
  { wellId: "CAS-002", field: "Casava", block: "C1", liftType: "ESP", status: "alert", oilRate: 12.8, gasRate: 280, waterRate: 89.3 },
  { wellId: "PAR-001", field: "Parkia", block: "P1", liftType: "ESP", status: "running", oilRate: 55.2, gasRate: 1050, waterRate: 35.8 },
  { wellId: "PAR-002", field: "Parkia", block: "P2", liftType: "PCP", status: "running", oilRate: 42.8, gasRate: 890, waterRate: 48.2 },
];

// Generate chart data
const generateChartData = (points = 24) => {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    time: now - (points - i) * 5 * 60 * 1000,
    oil: 40 + Math.random() * 20 + Math.sin(i / 3) * 8,
    gas: 1000 + Math.random() * 300 + Math.cos(i / 4) * 150,
    water: 35 + Math.random() * 15 + Math.sin(i / 2) * 5,
  }));
};

const generateSparklineData = (base, variance, points = 12) => {
  return Array.from({ length: points }, (_, i) => ({
    value: base + (Math.random() - 0.5) * variance + Math.sin(i / 2) * (variance / 3),
  }));
};

// Line Chart Component (local)
function LineChart({ data, width = 600, height = 200, visibleLines = { oil: true, gas: true, water: true } }) {
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (!data || data.length === 0) return null;

  const maxOil = Math.max(...data.map(d => d.oil));
  const maxGas = Math.max(...data.map(d => d.gas));
  const maxWater = Math.max(...data.map(d => d.water));

  const scaleX = (i) => (i / (data.length - 1)) * chartWidth;
  const scaleOil = (v) => chartHeight - (v / (maxOil * 1.1)) * chartHeight;
  const scaleGas = (v) => chartHeight - (v / (maxGas * 1.1)) * chartHeight;
  const scaleWater = (v) => chartHeight - (v / (maxWater * 1.1)) * chartHeight;

  const createPath = (scaleFn, key) => {
    return data.map((d, i) => {
      const x = scaleX(i);
      const y = padding.top + scaleFn(d[key]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const createArea = (scaleFn, key) => {
    const linePath = data.map((d, i) => {
      const x = scaleX(i);
      const y = padding.top + scaleFn(d[key]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    return `${linePath} L ${chartWidth} ${padding.top + chartHeight} L 0 ${padding.top + chartHeight} Z`;
  };

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => (
    <line key={pct} x1={padding.left} x2={width - padding.right} y1={padding.top + chartHeight * pct} y2={padding.top + chartHeight * pct} className="chart-grid-line" />
  ));

  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map(i => {
    const date = new Date(data[i].time);
    return (
      <text key={i} x={padding.left + scaleX(i)} y={height - 8} className="chart-axis-label" textAnchor="middle">
        {`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`}
      </text>
    );
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="oilGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-oil)" stopOpacity="0.3" /><stop offset="100%" stopColor="var(--color-oil)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-gas)" stopOpacity="0.3" /><stop offset="100%" stopColor="var(--color-gas)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-water)" stopOpacity="0.3" /><stop offset="100%" stopColor="var(--color-water)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines}
      {visibleLines.water && <path d={createArea(scaleWater, 'water')} fill="url(#waterGradient)" />}
      {visibleLines.gas && <path d={createArea(scaleGas, 'gas')} fill="url(#gasGradient)" />}
      {visibleLines.oil && <path d={createArea(scaleOil, 'oil')} fill="url(#oilGradient)" />}
      {visibleLines.oil && <path d={createPath(scaleOil, 'oil')} className="chart-line oil" />}
      {visibleLines.gas && <path d={createPath(scaleGas, 'gas')} className="chart-line gas" />}
      {visibleLines.water && <path d={createPath(scaleWater, 'water')} className="chart-line water" />}
      {xLabels}
    </svg>
  );
}

function Gauge({ value, max, label, color, unit }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="gauge-item">
      <div className="gauge-label">{label}</div>
      <div className="gauge-ring">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} className="gauge-ring-bg" />
          <circle cx="40" cy="40" r={radius} className={`gauge-ring-progress ${color}`} style={{ strokeDasharray: circumference, strokeDashoffset }} />
        </svg>
        <div className="gauge-value">
          <span className={`gauge-number ${color}`}>{value.toFixed(1)}</span>
          <span className="gauge-unit">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function MiniChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;

  return (
    <div className="stat-mini-chart">
      {data.map((d, i) => (
        <div key={i} className={`stat-mini-bar ${color}`} style={{ height: `${((d.value - min) / range) * 30 + 10}px` }} />
      ))}
    </div>
  );
}

// Dashboard Page Component
function Dashboard({ fieldFilter = "all", liftTypeFilter = "all", statusFilter = "all", alerts = [], setAlerts } = {}) {
  const [wells, setWells] = useState([]);
  const [selectedWell, setSelectedWell] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lang, setLang] = useState("zh");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chartData, setChartData] = useState(() => generateChartData(24));
  const [visibleLines, setVisibleLines] = useState({ oil: true, gas: true, water: true });
  const [activeTab, setActiveTab] = useState("2H");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch wells and real-time data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [wellsRes, realtimeRes] = await Promise.all([
          api.getWells(),
          api.queryWellsRealtime([], new Date().toISOString())
        ]);
        const wellsData = wellsRes.data?.items || wellsRes.wells || wellsRes.data || wellsRes || [];
        setWells(wellsData);
        if (wellsData.length > 0 && !selectedWell) {
          setSelectedWell(wellsData[0]);
        }
        // Fetch realtime data for each well
        if (wellsData.length > 0) {
          const realtime = realtimeRes.data || realtimeRes || [];
          const wellsWithRealtime = wellsData.map(well => {
            const rt = realtime.find(r => r.wellId === well.wellId) || {};
            return { ...well, ...rt };
          });
          setWells(wellsWithRealtime);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        // Fallback to mock data when API fails
        setWells(mockWells);
        if (!selectedWell) {
          setSelectedWell(mockWells[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const pollTimer = setInterval(fetchData, 30000); // Poll every 30s
    return () => { clearInterval(timer); clearInterval(pollTimer); };
  }, []);

  // Filter wells
  const filteredWells = wells.filter(well => {
    if (fieldFilter !== "all" && well.field !== fieldFilter) return false;
    if (liftTypeFilter !== "all" && well.liftType !== liftTypeFilter) return false;
    if (statusFilter !== "all" && well.status !== statusFilter) return false;
    if (searchTerm && !(well.wellId || "").toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalOil = wells.filter(w => w.status !== "offline").reduce((sum, w) => sum + (w.oilRate || w.oilProduction || 0), 0);
  const totalGas = wells.filter(w => w.status !== "offline").reduce((sum, w) => sum + (w.gasRate || w.gasProduction || 0), 0);
  const totalWater = wells.filter(w => w.status !== "offline").reduce((sum, w) => sum + (w.waterRate || w.waterProduction || 0), 0);
  const runningWells = wells.filter(w => w.status === "running").length;
  const activeWells = wells.filter(w => w.status !== "offline").length;

  const oilSparkData = generateSparklineData(totalOil, 10);
  const gasSparkData = generateSparklineData(totalGas, 100);
  const waterSparkData = generateSparklineData(totalWater, 8);

  const formatTime = (date) => date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const formatDate = (date) => date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  const toggleLine = (line) => setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }));
  const t = (zh, en) => lang === "zh" ? zh : en;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            {t("实时监控看板", "Real-time Dashboard")}
            <span className="live-indicator"><span className="live-dot"></span>LIVE</span>
          </h1>
          <p className="page-subtitle">{t(`监控 ${activeWells} 口井，其中 ${runningWells} 口运行中`, `Monitoring ${activeWells} wells, ${runningWells} running`)}</p>
        </div>
        <div className="page-actions">
          <button className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('grid')}>▦</button>
          <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('table')}>☰</button>
          <button className="lang-toggle" onClick={() => setLang(l => l === "zh" ? "en" : "zh")}>
            {lang === "zh" ? "EN" : "中"}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card oil">
          <div className="stat-header"><div className="stat-icon oil">🛢️</div></div>
          <div className="stat-label">{t("日产油量", "Oil Production")}</div>
          <div className="stat-value oil">{totalOil.toFixed(1)}<span className="stat-unit">m³/d</span></div>
          <MiniChart data={oilSparkData} color="oil" />
          <div className="stat-footer"><span className="stat-trend up">↑ 2.3%</span><span className="stat-period">{t("较昨日", "vs yesterday")}</span></div>
        </div>
        <div className="stat-card gas">
          <div className="stat-header"><div className="stat-icon gas">🔥</div></div>
          <div className="stat-label">{t("日产气量", "Gas Production")}</div>
          <div className="stat-value gas">{(totalGas / 1000).toFixed(2)}<span className="stat-unit">kSm³/d</span></div>
          <MiniChart data={gasSparkData} color="gas" />
          <div className="stat-footer"><span className="stat-trend up">↑ 1.8%</span><span className="stat-period">{t("较昨日", "vs yesterday")}</span></div>
        </div>
        <div className="stat-card water">
          <div className="stat-header"><div className="stat-icon water">💧</div></div>
          <div className="stat-label">{t("日产水量", "Water Production")}</div>
          <div className="stat-value water">{totalWater.toFixed(1)}<span className="stat-unit">m³/d</span></div>
          <MiniChart data={waterSparkData} color="water" />
          <div className="stat-footer"><span className="stat-trend down">↓ 0.5%</span><span className="stat-period">{t("较昨日", "vs yesterday")}</span></div>
        </div>
        <div className="stat-card wells">
          <div className="stat-header"><div className="stat-icon wells">📊</div></div>
          <div className="stat-label">{t("运行井数", "Active Wells")}</div>
          <div className="stat-value" style={{ color: "var(--status-running)" }}>{runningWells}<span className="stat-unit">/ {activeWells}</span></div>
          <div className="stat-footer"><span className="stat-period">{wells.length} {t("口井总数", "total wells")}</span></div>
        </div>
      </div>

      <div className="main-grid">
        <div>
          {viewMode === 'grid' ? (
            <>
              <div className="well-list-section">
                <div className="section-header">
                  <div className="section-title">{t("井列表", "Well List")}<span className="section-count">{filteredWells.length}</span></div>
                  <div className="section-actions">
                    <input
                      type="text"
                      className="search-input"
                      placeholder={t("搜索井...", "Search wells...")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="well-list">
                  {filteredWells.map((well) => (
                    <div key={well.wellId} className={`well-item ${selectedWell?.wellId === well.wellId ? "selected" : ""}`} onClick={() => setSelectedWell(well)}>
                      <span className={`well-status-indicator ${well.status || 'offline'}`}></span>
                      <div className="well-info">
                        <div className="well-name">
                          {well.wellId}
                          <span className={`well-type-badge ${(well.liftType || 'ESP').toLowerCase()}`}>{well.liftType || 'ESP'}</span>
                        </div>
                        <div className="well-meta"><span>{well.field || well.fieldName || '-'}</span><span>·</span><span>{well.block || well.blockName || '-'}</span></div>
                      </div>
                      <div className="well-rates">
                        <div className="rate-item"><span className="rate-value" style={{ color: "var(--color-oil)" }}>{(well.oilRate || well.oilProduction || 0).toFixed(1)}</span><span className="rate-unit">油</span></div>
                        <div className="rate-item"><span className="rate-value" style={{ color: "var(--color-gas)" }}>{(well.gasRate || well.gasProduction || 0).toFixed(0)}</span><span className="rate-unit">气</span></div>
                        <div className="rate-item"><span className="rate-value" style={{ color: "var(--color-water)" }}>{(well.waterRate || well.waterProduction || 0).toFixed(1)}</span><span className="rate-unit">水</span></div>
                      </div>
                    </div>
                  ))}
                  {filteredWells.length === 0 && !loading && (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      {t("没有符合条件的井", "No wells match the criteria")}
                    </div>
                  )}
                </div>
              </div>
              <div className="chart-section" style={{ marginTop: "var(--space-lg)" }}>
                <div className="chart-header">
                  <div className="section-title">{t("实时趋势", "Real-time Trend")}<span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 400, marginLeft: "8px" }}>{t("最近2小时", "Last 2 hours")}</span></div>
                  <div className="tabs">
                    <button className={`tab-btn ${activeTab === '2H' ? 'active' : ''}`} onClick={() => setActiveTab('2H')}>2H</button>
                    <button className={`tab-btn ${activeTab === '6H' ? 'active' : ''}`} onClick={() => setActiveTab('6H')}>6H</button>
                    <button className={`tab-btn ${activeTab === '24H' ? 'active' : ''}`} onClick={() => setActiveTab('24H')}>24H</button>
                  </div>
                </div>
                <div className="chart-container">
                  <div className="chart-canvas"><LineChart data={chartData} visibleLines={visibleLines} /></div>
                </div>
                <div className="chart-legend">
                  <div className={`legend-item ${!visibleLines.oil ? 'disabled' : ''}`} onClick={() => toggleLine('oil')}><span className="legend-dot oil"></span><span>{t("油产量", "Oil")}</span></div>
                  <div className={`legend-item ${!visibleLines.gas ? 'disabled' : ''}`} onClick={() => toggleLine('gas')}><span className="legend-dot gas"></span><span>{t("气产量", "Gas")}</span></div>
                  <div className={`legend-item ${!visibleLines.water ? 'disabled' : ''}`} onClick={() => toggleLine('water')}><span className="legend-dot water"></span><span>{t("水产量", "Water")}</span></div>
                </div>
              </div>
            </>
          ) : (
            <div className="production-table-section">
              <div className="section-header">
                <div className="section-title">{t("生产数据表", "Production Data")}<span className="section-count">{filteredWells.length}</span></div>
                <button className="btn btn-sm btn-secondary">{t("导出", "Export")}</button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t("井号", "Well ID")}</th><th>{t("油田/区块", "Field/Block")}</th><th>{t("举升方式", "Lift Type")}</th><th>{t("状态", "Status")}</th>
                      <th>{t("油 (m³/d)", "Oil (m³/d)")}</th><th>{t("气 (Sm³/d)", "Gas (Sm³/d)")}</th><th>{t("水 (m³/d)", "Water (m³/d)")}</th><th>{t("含水率", "WCut")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWells.map((well) => {
                      const oil = well.oilRate || well.oilProduction || 0;
                      const water = well.waterRate || well.waterProduction || 0;
                      const wcut = oil + water > 0 ? (water / (oil + water) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={well.wellId} onClick={() => setSelectedWell(well)} style={{ cursor: 'pointer' }}>
                          <td><span className="table-well-id">{well.wellId}</span></td>
                          <td>{(well.field || well.fieldName || '-')} / {well.block || well.blockName || '-'}</td>
                          <td><span className={`well-type-badge ${(well.liftType || 'ESP').toLowerCase()}`}>{well.liftType || 'ESP'}</span></td>
                          <td><span className={`table-status ${well.status || 'offline'}`}>{well.status === "running" ? t("运行", "Running") : well.status === "warning" ? t("告警", "Warning") : well.status === "alert" ? t("严重", "Critical") : t("离线", "Offline")}</span></td>
                          <td style={{ color: "var(--color-oil)", fontFamily: "var(--font-mono)" }}>{oil.toFixed(1)}</td>
                          <td style={{ color: "var(--color-gas)", fontFamily: "var(--font-mono)" }}>{(well.gasRate || well.gasProduction || 0).toFixed(0)}</td>
                          <td style={{ color: "var(--color-water)", fontFamily: "var(--font-mono)" }}>{water.toFixed(1)}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{wcut}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredWells.length === 0 && !loading && (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                    {t("没有符合条件的井", "No wells match the criteria")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="right-panel">
          <div className="alert-panel">
            <div className="section-header">
              <div className="section-title">{t("实时告警", "Alerts")}<span className="section-count" style={{ background: "rgba(239, 68, 68, 0.2)", color: "var(--status-alert)" }}>{alerts.length}</span></div>
              <button className="btn btn-sm btn-secondary">{t("查看全部", "View All")}</button>
            </div>
            <div className="alert-list">
              {alerts.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  {t("暂无告警", "No alerts")}
                </div>
              ) : alerts.map((alert) => (
                <div key={alert.id} className="alert-item">
                  <div className={`alert-icon ${alert.type}`}>{alert.type === "critical" ? "!" : alert.type === "warning" ? "⚠" : "i"}</div>
                  <div className="alert-content">
                    <div className="alert-title">{alert.title}</div>
                    <div className="alert-meta"><span className="alert-well">{alert.well}</span><span>·</span><span>{alert.time}</span></div>
                    <div className="alert-actions">
                      <button className="alert-action-btn">{t("确认", "Ack")}</button>
                      <button className="alert-action-btn">{t("详情", "Details")}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="well-detail-card">
            <div className="well-detail-header">
              <div>
                <div className="well-detail-title">
                  {selectedWell?.wellId || '-'}
                  <span className={`well-type-badge ${(selectedWell?.liftType || 'ESP').toLowerCase()}`}>{selectedWell?.liftType || 'ESP'}</span>
                </div>
                <div className="well-detail-subtitle">
                  <span>{selectedWell?.field || selectedWell?.fieldName || '-'}</span><span>·</span><span>{selectedWell?.block || selectedWell?.blockName || '-'}</span><span>·</span>
                  <span className={`well-status-indicator ${selectedWell?.status || 'offline'}`} style={{ width: "6px", height: "6px" }}></span>
                  <span>{selectedWell?.status === "running" ? t("运行中", "Running") : selectedWell?.status === "warning" ? t("告警", "Warning") : selectedWell?.status === "alert" ? t("严重告警", "Critical") : t("离线", "Offline")}</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => navigate(`/well/${selectedWell?.wellId}`)}>→</button>
            </div>
            <div className="detail-stats">
              <div className="detail-stat"><div className="detail-stat-value oil">{(selectedWell?.oilRate || selectedWell?.oilProduction || 0).toFixed(1)}<span className="detail-stat-unit">m³/d</span></div><div className="detail-stat-label">{t("日产油", "Oil Rate")}</div></div>
              <div className="detail-stat"><div className="detail-stat-value gas">{(selectedWell?.gasRate || selectedWell?.gasProduction || 0).toFixed(0)}<span className="detail-stat-unit">Sm³/d</span></div><div className="detail-stat-label">{t("日产气", "Gas Rate")}</div></div>
              <div className="detail-stat"><div className="detail-stat-value water">{(selectedWell?.waterRate || selectedWell?.waterProduction || 0).toFixed(1)}<span className="detail-stat-unit">m³/d</span></div><div className="detail-stat-label">{t("日产水", "Water Rate")}</div></div>
            </div>
            <div className="detail-footer">
              <div className={`quality-badge ${selectedWell?.status === "running" ? "valid" : selectedWell?.status === "warning" ? "estimated" : "invalid"}`}>
                <span className="status-dot" style={{ background: "currentColor" }}></span>
                {selectedWell?.status === "running" ? t("数据有效", "Valid") : selectedWell?.status === "warning" ? t("数据估计", "Estimated") : t("数据无效", "Invalid")}
              </div>
              <div className="model-version">{selectedWell?.modelVersion || `vfm-${(selectedWell?.liftType || 'esp').toLowerCase()}-20260420`}</div>
            </div>
          </div>

          <div className="gauge-section">
            <div className="section-header"><div className="section-title">{t("当前配产", "Allocation")}</div></div>
            <div className="gauge-grid">
              <Gauge value={totalOil} max={500} label={t("日产油", "Oil")} color="oil" unit="m³/d" />
              <Gauge value={totalGas / 1000} max={15} label={t("日产气", "Gas")} color="gas" unit="kSm³/d" />
              <Gauge value={totalWater} max={500} label={t("日产水", "Water")} color="water" unit="m³/d" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Layout Component
function Layout({ children, filterProps }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lang, setLang] = useState("zh");
  const [fieldFilter, setFieldFilter] = useState(filterProps?.fieldFilter || "all");
  const [liftTypeFilter, setLiftTypeFilter] = useState(filterProps?.liftTypeFilter || "all");
  const [statusFilter, setStatusFilter] = useState(filterProps?.statusFilter || "all");
  const [alerts, setAlerts] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const formatDate = (date) => date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  const t = (zh, en) => lang === "zh" ? zh : en;

  const isActive = (path) => location.pathname === path || (path === "/" && location.pathname === "/");

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">V</div>
            <div><div className="logo-text">VFM</div><div className="logo-subtitle">Virtual Flow Metering</div></div>
          </div>
        </div>
        <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          {sidebarCollapsed ? '→' : '←'}
        </button>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">{t("业务模块", "Business")}</div>
            {navItems.map((item) => (
              <Link key={item.id} to={item.path} className={`nav-item ${isActive(item.path) ? "active" : ""}`}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="nav-section">
            <div className="nav-section-title">{t("系统", "System")}</div>
            {systemNav.map((item) => (
              <Link key={item.id} to={item.path} className={`nav-item ${isActive(item.path) ? "active" : ""}`}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="connection-status"><span className="connection-dot"></span><span>{t("系统在线 · 已连接", "System Online")}</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-filters">
            <div className="filter-group"><span className="filter-label">{t("油田", "Field")}</span>
              <select className="filter-select" value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)}>
                <option value="all">{t("全部", "All")}</option>
                <option value="Birrea">Birrea</option>
                <option value="Casava">Casava</option>
                <option value="Parkia">Parkia</option>
              </select>
            </div>
            <div className="filter-group"><span className="filter-label">{t("井型", "Lift Type")}</span>
              <select className="filter-select" value={liftTypeFilter} onChange={(e) => setLiftTypeFilter(e.target.value)}>
                <option value="all">{t("全部", "All")}</option>
                <option value="ESP">ESP</option>
                <option value="PCP">PCP</option>
                <option value="ESPCP">ESPCP</option>
              </select>
            </div>
            <div className="filter-group"><span className="filter-label">{t("状态", "Status")}</span>
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">{t("全部", "All")}</option>
                <option value="running">{t("运行中", "Running")}</option>
                <option value="warning">{t("告警", "Warning")}</option>
                <option value="offline">{t("离线", "Offline")}</option>
              </select>
            </div>
          </div>
          <div className="header-actions">
            <span className="header-time">{formatDate(currentTime)} {formatTime(currentTime)}</span>
            <button className="notification-btn">🔔<span className="notification-count">{alerts.length}</span></button>
            <button className="lang-toggle" onClick={() => setLang(l => l === "zh" ? "en" : "zh")}>{lang === "zh" ? "EN" : "中"}</button>
          </div>
        </header>
        {React.cloneElement(children, { fieldFilter, liftTypeFilter, statusFilter, setFieldFilter, setLiftTypeFilter, setStatusFilter, alerts, setAlerts })}
      </main>
    </div>
  );
}

// Main App with Routes
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/well/:wellId" element={<Layout><WellDetail /></Layout>} />
        <Route path="/calibration" element={<Layout><Calibration /></Layout>} />
        <Route path="/allocation" element={<Layout><Allocation /></Layout>} />
        <Route path="/trends" element={<Layout><Trends /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/system" element={<Layout><SystemManagement /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
