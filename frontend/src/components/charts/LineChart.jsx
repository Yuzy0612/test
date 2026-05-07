// AreaChart 组件
export default function AreaChart({
  data = [],
  xKey = 'time',
  yKey = 'value',
  height = 300,
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
      <div className="chart-empty" style={{ height }}>
        No data available
      </div>
    );
  }

  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartWidth = 100;
  const chartHeight = 100;
  const widthPercent = `calc(100% - ${padding.left + padding.right}px)`;
  const heightPercent = `calc(${height}px - ${padding.top + padding.bottom}px)`;

  // 计算范围
  const values = data.map(d => d[yKey]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // 归一化点
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1 || 1)) * 100,
    y: 100 - ((d[yKey] - minVal) / range) * 100,
    rawX: d[xKey],
    rawY: d[yKey]
  }));

  // 生成路径
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 100} 100 L 0 100 Z`;

  const formatValue = (val) => {
    if (formatY) return formatY(val);
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toFixed(2);
  };

  return (
    <div className={`area-chart ${className}`} style={{ height }}>
      <svg
        viewBox={`0 0 100 ${100 + (padding.top + padding.bottom) / 5}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Grid lines */}
        {showGrid && [0, 25, 50, 75, 100].map(pct => (
          <line
            key={pct}
            x1="0"
            y1={pct}
            x2="100"
            y2={pct}
            stroke="#e8e8e8"
            strokeDasharray="2,2"
          />
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill={color}
          fillOpacity={fillOpacity}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1"
            fill={color}
            className="data-point"
          >
            {showTooltip && (
              <title>{`${formatValue(p.rawY)}`}</title>
            )}
          </circle>
        ))}

        {/* X-axis labels */}
        {points.filter((_, i) => i % Math.ceil(points.length / 5) === 0).map((p, i) => (
          <text
            key={i}
            x={p.x}
            y="105"
            textAnchor="middle"
            fontSize="3"
            fill="#666"
          >
            {formatX ? formatX(p.rawX) : p.rawX}
          </text>
        ))}
      </svg>

      {/* Y-axis labels */}
      <div className="y-axis-labels" style={{ top: padding.top }}>
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <span
            key={pct}
            className="y-label"
            style={{ top: `${pct * 100}%` }}
          >
            {formatValue(maxVal - pct * range)}
          </span>
        ))}
      </div>
    </div>
  );
}
