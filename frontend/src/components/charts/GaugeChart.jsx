// GaugeChart 组件 - 仪表盘
export default function GaugeChart({
  value = 0,
  min = 0,
  max = 100,
  thresholds = [60, 80],
  label = '',
  unit = '',
  height = 200,
  className = ''
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const angle = (pct / 100) * 180 - 90;

  const getColor = (pct) => {
    if (pct >= thresholds[1]) return '#f5222d';
    if (pct >= thresholds[0]) return '#faad14';
    return '#52c41a';
  };

  const color = getColor(pct);

  // 计算弧线路径
  const radius = 40;
  const startAngle = -90;
  const endAngle = 90;
  const currentAngle = startAngle + (pct / 100) * (endAngle - startAngle);

  const polarToCartesian = (angle) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: 50 + radius * Math.cos(rad),
      y: 50 + radius * Math.sin(rad)
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const current = polarToCartesian(currentAngle);

  const describeArc = (startA, endA) => {
    const start = polarToCartesian(startA);
    const end = polarToCartesian(endA);
    const largeArcFlag = endA - startA <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  return (
    <div className={`gauge-chart ${className}`} style={{ height }}>
      <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%' }}>
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="#e8e8e8"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={describeArc(startAngle, currentAngle)}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Needle */}
        <line
          x1="50"
          y1="50"
          x2={current.x}
          y2={current.y}
          stroke="#333"
          strokeWidth="1"
        />
        <circle cx="50" cy="50" r="3" fill="#333" />

        {/* Value text */}
        <text x="50" y="45" textAnchor="middle" fontSize="10" fontWeight="bold">
          {value.toFixed(1)}
        </text>
        <text x="50" y="55" textAnchor="middle" fontSize="4" fill="#666">
          {unit}
        </text>
      </svg>

      {label && <div className="gauge-label">{label}</div>}

      {/* Scale labels */}
      <div className="gauge-scale">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
