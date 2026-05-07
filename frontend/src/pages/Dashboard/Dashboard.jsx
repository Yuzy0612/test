import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function Dashboard() {
  const { t } = useLanguage();
  const [wells, setWells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWells();
  }, []);

  const fetchWells = async () => {
    try {
      setLoading(true);
      const response = await api.getWells({ status: 'running', page: 1, pageSize: 50 });
      setWells(response.data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      running: '#52c41a',
      warning: '#faad14',
      alert: '#f5222d',
      offline: '#8c8c8c'
    };
    return colors[status] || colors.offline;
  };

  const formatNumber = (num, decimals = 2) => {
    if (num == null) return '-';
    return Number(num).toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={fetchWells}>{t('common.reset')}</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-value">{wells.length}</span>
            <span className="stat-label">{t('dashboard.wellList')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#52c41a' }}>
              {wells.filter(w => w.status === 'running').length}
            </span>
            <span className="stat-label">{t('dashboard.running')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#faad14' }}>
              {wells.filter(w => w.status === 'warning').length}
            </span>
            <span className="stat-label">{t('dashboard.warning')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#f5222d' }}>
              {wells.filter(w => w.status === 'alert').length}
            </span>
            <span className="stat-label">{t('dashboard.alert')}</span>
          </div>
        </div>
      </header>

      <div className="well-table-container">
        <table className="well-table">
          <thead>
            <tr>
              <th>{t('well.wellId')}</th>
              <th>{t('well.field')}</th>
              <th>{t('well.block')}</th>
              <th>{t('well.liftType')}</th>
              <th>{t('dashboard.oilRate')} (m³/d)</th>
              <th>{t('dashboard.gasRate')} (Sm³/d)</th>
              <th>{t('dashboard.waterRate')} (m³/d)</th>
              <th>{t('well.status')}</th>
              <th>{t('well.modelVersion')}</th>
            </tr>
          </thead>
          <tbody>
            {wells.length === 0 ? (
              <tr>
                <td colSpan={9} className="no-data">{t('common.noData')}</td>
              </tr>
            ) : (
              wells.map(well => (
                <tr key={well.wellId}>
                  <td>
                    <a href={`/well/${well.wellId}`}>{well.wellId}</a>
                  </td>
                  <td>{well.field || '-'}</td>
                  <td>{well.block || '-'}</td>
                  <td>{t(`well.${well.liftType}`) || well.liftType}</td>
                  <td>{formatNumber(well.oilRate)}</td>
                  <td>{formatNumber(well.gasRate)}</td>
                  <td>{formatNumber(well.waterRate)}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(well.status) }}
                    >
                      {t(`dashboard.${well.status}`) || well.status}
                    </span>
                  </td>
                  <td>{well.modelVersion || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
