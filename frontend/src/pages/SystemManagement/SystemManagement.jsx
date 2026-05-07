// SystemManagement 系统管理页面
import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Table } from '../../components/common';
import api from '../../services/api';

const mockIntegrationJobs = [
  { jobId: 'PI-SYNC-001', type: 'pi_realtime_sync', status: 'completed', recordsProcessed: 1500, completedAt: '2026-04-28 10:00' },
  { jobId: 'PI-SYNC-002', type: 'pi_realtime_sync', status: 'completed', recordsProcessed: 1480, completedAt: '2026-04-28 09:00' },
  { jobId: 'PI-SYNC-003', type: 'pi_realtime_sync', status: 'failed', errorDetails: 'Connection timeout', completedAt: '2026-04-28 08:00' },
  { jobId: 'SSO-SYNC-001', type: 'sso_user_sync', status: 'completed', recordsProcessed: 25, completedAt: '2026-04-28 07:00' },
];

const mockSSOConfig = {
  provider: 'dreamcloud',
  authUrl: 'https://sso.dreamcloud.com/oauth2/authorize',
  tokenUrl: 'https://sso.dreamcloud.com/oauth2/token',
  clientId: 'vfm-system'
};

export default function SystemManagement() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('integration');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ successRate: 0.98, totalJobs: 100, lastSyncTime: null });

  useEffect(() => {
    fetchIntegrationJobs();
  }, []);

  const fetchIntegrationJobs = async () => {
    setLoading(true);
    try {
      const response = await api.getIntegrationJobs({ pageSize: 50 });
      setJobs(response.data?.items || response.data || mockIntegrationJobs);
    } catch (error) {
      console.error('Failed to fetch integration jobs:', error);
      setJobs(mockIntegrationJobs);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (jobId) => {
    try {
      await api.retryIntegrationJob(jobId);
      alert(t('common.success'));
      fetchIntegrationJobs();
    } catch (error) {
      console.error('Failed to retry job:', error);
      alert(t('common.failed'));
    }
  };

  const handleTriggerSSOSync = async () => {
    try {
      await api.triggerSSOSync();
      alert(t('common.success'));
    } catch (error) {
      console.error('Failed to trigger SSO sync:', error);
      alert(t('common.failed'));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="status-badge valid">{t('reports.completed')}</span>;
      case 'running':
        return <span className="status-badge warning">{t('reports.running')}</span>;
      case 'pending_retry':
        return <span className="status-badge warning">{t('system.pendingRetry') || 'Pending Retry'}</span>;
      case 'failed':
        return <span className="status-badge invalid">{t('reports.failed')}</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const jobColumns = [
    { key: 'jobId', title: t('system.jobId'), sortable: true },
    {
      key: 'type',
      title: t('system.jobType'),
      render: (val) => val.replace(/_/g, ' ')
    },
    {
      key: 'status',
      title: t('common.status'),
      render: getStatusBadge
    },
    { key: 'recordsProcessed', title: t('system.recordsProcessed') || 'Records', sortable: true },
    { key: 'completedAt', title: t('reports.completedAt'), sortable: true },
    {
      key: 'actions',
      title: t('common.actions'),
      render: (_, record) => (
        record.status === 'failed' && (
          <button className="btn btn-sm btn-primary" onClick={() => handleRetry(record.jobId)}>
            {t('system.retry')}
          </button>
        )
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t('system.title')}</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'integration' ? 'active' : ''}`}
          onClick={() => setActiveTab('integration')}
        >
          {t('system.integration')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'sso' ? 'active' : ''}`}
          onClick={() => setActiveTab('sso')}
        >
          {t('system.ssoMapping')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          {t('system.haStatus')}
        </button>
      </div>

      {activeTab === 'integration' && (
        <>
          <div className="status-cards">
            <div className="status-card">
              <div className="status-label">{t('system.successRate')}</div>
              <div className="status-value">{(syncStatus.successRate * 100).toFixed(1)}%</div>
            </div>
            <div className="status-card">
              <div className="status-label">{t('system.totalJobs') || 'Total Jobs'}</div>
              <div className="status-value">{syncStatus.totalJobs}</div>
            </div>
            <div className="status-card">
              <div className="status-label">{t('system.lastSync')}</div>
              <div className="status-value">{syncStatus.lastSyncTime || '-'}</div>
            </div>
          </div>

          <Table
            columns={jobColumns}
            data={jobs}
            loading={loading}
            rowKey="jobId"
            emptyText={t('common.noData')}
          />
        </>
      )}

      {activeTab === 'sso' && (
        <div className="sso-config">
          <div className="config-section">
            <h3>{t('system.ssoMapping')}</h3>
            <div className="config-info">
              <div className="config-item">
                <span className="config-label">Provider:</span>
                <span className="config-value">{mockSSOConfig.provider}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Auth URL:</span>
                <span className="config-value">{mockSSOConfig.authUrl}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Client ID:</span>
                <span className="config-value">{mockSSOConfig.clientId}</span>
              </div>
            </div>
            <div className="role-mapping">
              <h4>Role Mapping</h4>
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>SSO Role</th>
                    <th>Local Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>DREAMCLOUD_PRODUCTION_ENGINEER</td>
                    <td>{t('role.production_engineer')}</td>
                  </tr>
                  <tr>
                    <td>DREAMCLOUD_MEASUREMENT_ENGINEER</td>
                    <td>{t('role.measurement_engineer')}</td>
                  </tr>
                  <tr>
                    <td>DREAMCLOUD_BLOCK_MANAGER</td>
                    <td>{t('role.block_manager')}</td>
                  </tr>
                  <tr>
                    <td>DREAMCLOUD_ADMIN</td>
                    <td>{t('role.admin')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button className="btn btn-primary" onClick={handleTriggerSSOSync}>
              {t('system.triggerSSOSync') || 'Trigger SSO Sync'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'status' && (
        <div className="ha-status">
          <div className="ha-cards">
            <div className="ha-card primary">
              <div className="ha-label">{t('system.primary')}</div>
              <div className="ha-status-indicator active"></div>
              <div className="ha-details">
                <div>API: localhost:3001</div>
                <div>Status: Healthy</div>
              </div>
            </div>
            <div className="ha-card standby">
              <div className="ha-label">{t('system.standby')}</div>
              <div className="ha-status-indicator"></div>
              <div className="ha-details">
                <div>API: localhost:3002</div>
                <div>Status: Standby</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
