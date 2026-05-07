function LineChart({ data, width = 600, height = 200, visibleLines = { oil: true, gas: true, water: true } }) {
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: height, color: 'var(--text-muted)' }}>
        No data available
      </div>
    );
  }

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
    <line
      key={pct}
      x1={padding.left}
      x2={width - padding.right}
      y1={padding.top + chartHeight * pct}
      y2={padding.top + chartHeight * pct}
      stroke="rgba(148, 163, 184, 0.1)"
      strokeWidth="1"
    />
  ));

  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map(i => {
    const date = new Date(data[i].time);
    return (
      <text
        key={i}
        x={padding.left + scaleX(i)}
        y={height - 8}
        fill="var(--text-muted)"
        fontSize="10"
        textAnchor="middle"
      >
        {`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`}
      </text>
    );
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="oilGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-oil)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-oil)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-gas)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-gas)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-water)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-water)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines}

      {visibleLines.water && (
        <path d={createArea(scaleWater, 'water')} fill="url(#waterGradient)" />
      )}
      {visibleLines.gas && (
        <path d={createArea(scaleGas, 'gas')} fill="url(#gasGradient)" />
      )}
      {visibleLines.oil && (
        <path d={createArea(scaleOil, 'oil')} fill="url(#oilGradient)" />
      )}

      {visibleLines.oil && <path d={createPath(scaleOil, 'oil')} fill="none" stroke="var(--color-oil)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      {visibleLines.gas && <path d={createPath(scaleGas, 'gas')} fill="none" stroke="var(--color-gas)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      {visibleLines.water && <path d={createPath(scaleWater, 'water')} fill="none" stroke="var(--color-water)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

      {xLabels}
    </svg>
  );
}

export default LineChart;
