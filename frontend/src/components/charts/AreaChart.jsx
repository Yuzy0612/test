// AreaChart 组件 - 修复对齐问题
export default function AreaChart({
  data = [],
  xKey = 'time',
  yKey = 'value',
  height = 200,
  color = '#1890ff',
  fillOpacity = 0.3,
  showGrid = true,
  showTooltip = true,
  formatX,
  formatY,
  className = ''
}) {
  if (!data || data.length === 0) {
    return (
      <div className="area-chart-empty" style={{ height }}>
        No data available
      </div>
    );
  }

  // 计算数据范围
  const values = data.map(d => {
    const v = typeof d[yKey] !== 'undefined' ? d[yKey] : d.value;
    return typeof v === 'number' && !isNaN(v) ? v : 0;
  });

  if (values.length === 0 || values.every(v => v === 0)) {
    return (
      <div className="area-chart-empty" style={{ height }}>
        No data available
      </div>
    );
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // 格式化函数
  const formatValue = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '0';
    if (formatY) return formatY(val);
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'K';
    if (Math.abs(val) < 1) return val.toFixed(2);
    return val.toFixed(1);
  };

  // Y轴标签
  const yLabelValues = [0, 0.25, 0.5, 0.75, 1].map(pct => maxVal - pct * range);

  // 计算SVG内的归一化坐标
  const chartPadding = { top: 6, right: 4, bottom: 12, left: 4 };
  const chartWidth = 100 - chartPadding.left - chartPadding.right;
  const chartHeight = 100 - chartPadding.top - chartPadding.bottom;

  const normalizeX = (i) => chartPadding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
  const normalizeY = (v) => chartPadding.top + (1 - (v - minVal) / range) * chartHeight;

  // 生成路径点
  const points = data.map((d, i) => ({
    x: normalizeX(i),
    y: normalizeY(typeof d[yKey] !== 'undefined' ? d[yKey] : d.value),
    rawX: d[xKey] || d.time,
    rawY: typeof d[yKey] !== 'undefined' ? d[yKey] : d.value
  }));

  // 生成 SVG 路径
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x.toFixed(2)} ${chartPadding.top + chartHeight} L ${chartPadding.left} ${chartPadding.top + chartHeight} Z`;

  // X轴标签索引
  const labelCount = 5;
  const labelIndices = [];
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.round((i / (labelCount - 1)) * (points.length - 1));
    labelIndices.push(idx);
  }

  return (
    <div className={`area-chart-wrapper ${className}`} style={{ height }}>
      {/* Y-axis labels - 左侧 */}
      <div className="y-axis-container">
        {yLabelValues.reverse().map((val, i) => (
          <span key={i} className="y-axis-label">{formatValue(val)}</span>
        ))}
      </div>

      {/* SVG Chart */}
      <div className="chart-svg-container">
        <svg
          viewBox={`0 0 100 100`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = chartPadding.top + pct * chartHeight;
            return showGrid ? (
              <line
                key={i}
                x1={chartPadding.left}
                y1={y}
                x2={100 - chartPadding.right}
                y2={y}
                stroke="rgba(148, 163, 184, 0.15)"
                strokeWidth="0.3"
              />
            ) : null;
          })}

          {/* Area fill */}
          <path d={areaPath} fill={color} fillOpacity={fillOpacity} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="0.6"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="1.2" fill={color}>
              {showTooltip && <title>{formatValue(p.rawY)}</title>}
            </circle>
          ))}

          {/* X-axis labels */}
          {labelIndices.map((idx, i) => {
            const p = points[idx];
            if (!p) return null;
            const displayX = formatX ? formatX(p.rawX) : String(p.rawX).substring(0, 8);
            return (
              <text
                key={i}
                x={p.x}
                y={96}
                textAnchor="middle"
                fontSize="3.5"
                fontFamily="'Segoe UI', Arial, sans-serif"
                fontWeight="400"
                fill="#999"
              >
                {displayX}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}