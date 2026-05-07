// Trends 趋势分析页面
import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FilterBar } from '../../components/common';
import { AreaChart } from '../../components/charts';
import api from '../../services/api';

const mockTrendsData = {
  oil: Array.from({ length: 30 }, (_, i) => ({
    time: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 50 + Math.random() * 10 + Math.sin(i / 5) * 5
  })),
  gas: Array.from({ length: 30 }, (_, i) => ({
    time: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 1000 + Math.random() * 200 + Math.cos(i / 4) * 100
  })),
  water: Array.from({ length: 30 }, (_, i) => ({
    time: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 35 + Math.random() * 10 + Math.sin(i / 6) * 3
  }))
};

const mockWells = [
  { wellId: 'BIR-001', field: 'Birrea' },
  { wellId: 'BIR-002', field: 'Birrea' },
  { wellId: 'CAS-001', field: 'Casava' },
  { wellId: 'PAR-001', field: 'Parkia' },
];

export default function Trends() {
  const { t } = useLanguage();
  const [selectedWell, setSelectedWell] = useState('BIR-001');
  const [timeRange, setTimeRange] = useState('30day');
  const [metrics, setMetrics] = useState(['oil', 'gas', 'water']);
  const [data, setData] = useState({ oil: [], gas: [], water: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrendsData();
  }, [selectedWell, timeRange]);

  const fetchTrendsData = async () => {
    setLoading(true);
    try {
      const params = {
        wellId: selectedWell,
        timeRange,
        metrics: metrics.join(',')
      };
      const response = await api.getWellHistory(selectedWell, params);
      if (response.data) {
        setData(response.data);
      } else {
        setData(mockTrendsData);
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error);
      setData(mockTrendsData);
    } finally {
      setLoading(false);
    }
  };

  const toggleMetric = (metric) => {
    setMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const filterConfig = [
    {
      key: 'wellId',
      label: t('well.wellId'),
      type: 'select',
      options: mockWells.map(w => ({ value: w.wellId, label: `${w.wellId} (${w.field})` }))
    },
    {
      key: 'timeRange',
      label: t('trends.timeRange'),
      type: 'select',
      options: [
        { value: '7day', label: t('trends.dailyLabel') },
        { value: '30day', label: t('trends.weeklyLabel') },
        { value: '90day', label: t('trends.monthlyLabel') }
      ]
    }
  ];

  const getChartData = (metric) => {
    return (data[metric] || []).map((d, i) => {
      let val = d.value || d[metric] || 0;
      // Ensure value is a proper number
      val = Number(val);
      if (isNaN(val)) val = 0;
      return {
        time: d.time || d.timestamp || '',
        value: val
      };
    });
  };

  const metricColors = {
    oil: '#f59e0b',
    gas: '#06b6d4',
    water: '#10b981'
  };

  const metricUnits = {
    oil: 'm³/d',
    gas: 'Sm³/d',
    water: 'm³/d'
  };

  const metricLabels = {
    oil: t('trends.oilTrend'),
    gas: t('trends.gasTrend'),
    water: t('trends.waterTrend')
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t('trends.title')}</h1>
      </div>

      <FilterBar
        filters={filterConfig}
        values={{ wellId: selectedWell, timeRange }}
        onChange={(vals) => {
          if (vals.wellId) setSelectedWell(vals.wellId);
          if (vals.timeRange) setTimeRange(vals.timeRange);
        }}
        onSearch={fetchTrendsData}
        onReset={() => {}}
      />

      <div className="metric-selector">
        <span className="metric-label">{t('trends.metrics')}:</span>
        {['oil', 'gas', 'water'].map(metric => (
          <button
            key={metric}
            className={`metric-btn ${metrics.includes(metric) ? 'active' : ''}`}
            style={{ '--metric-color': metricColors[metric] }}
            onClick={() => toggleMetric(metric)}
          >
            <span className="metric-dot" style={{ background: metricColors[metric] }}></span>
            {metricLabels[metric]}
          </button>
        ))}
      </div>

      <div className="charts-container">
        <div className="charts-wrapper">
          {metrics.map(metric => (
            <div key={metric} className="chart-card">
              <div className="chart-header">
                <h3>{metricLabels[metric]}</h3>
                <span className="chart-unit">{metricUnits[metric]}</span>
              </div>
              <div className="chart-body">
                {loading ? (
                  <div className="chart-loading">{t('common.loading')}</div>
                ) : (
                  <AreaChart
                    data={getChartData(metric)}
                    xKey="time"
                    yKey="value"
                    height={260}
                    color={metricColors[metric]}
                    formatY={(v) => Number(v).toFixed(2)}
                  />
                )}
              </div>
              <div className="chart-stats">
                <div className="stat-item">
                  <span className="stat-label">{t('trends.min')}</span>
                  <span className="stat-value">
                    {data[metric]?.length > 0
                      ? Number(Math.min(...data[metric].map(d => d.value || d[metric]))).toFixed(2)
                      : '-'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('trends.max')}</span>
                  <span className="stat-value">
                    {data[metric]?.length > 0
                      ? Number(Math.max(...data[metric].map(d => d.value || d[metric]))).toFixed(2)
                      : '-'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('trends.avg')}</span>
                  <span className="stat-value">
                    {data[metric]?.length > 0
                      ? Number(data[metric].reduce((sum, d) => sum + (d.value || d[metric]), 0) / data[metric].length).toFixed(2)
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
