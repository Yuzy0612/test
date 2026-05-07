// Reports 报表中心页面
import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Table, FilterBar, Modal } from '../../components/common';
import api from '../../services/api';

const mockReportTasks = [
  { reportId: 'RPT-001', name: '日报-2026-04-27', type: 'daily', format: 'pdf', status: 'completed', progress: 100, createdAt: '2026-04-27 08:00', completedAt: '2026-04-27 08:05' },
  { reportId: 'RPT-002', name: '周报-第17周', type: 'weekly', format: 'excel', status: 'completed', progress: 100, createdAt: '2026-04-21 08:00', completedAt: '2026-04-21 08:10' },
  { reportId: 'RPT-003', name: '日报-2026-04-28', type: 'daily', format: 'pdf', status: 'running', progress: 60, createdAt: '2026-04-28 08:00', completedAt: null },
  { reportId: 'RPT-004', name: '月报-2026年4月', type: 'monthly', format: 'pdf', status: 'pending', progress: 0, createdAt: '2026-04-28 09:00', completedAt: null },
];

export default function Reports() {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({ type: '', status: '' });
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  // Poll for running tasks to update progress
  useEffect(() => {
    const hasRunning = tasks.some(t => t.status === 'running');
    if (hasRunning && !pollingInterval) {
      const interval = setInterval(() => {
        fetchTasks();
      }, 2000);
      setPollingInterval(interval);
    } else if (!hasRunning && pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [tasks, pollingInterval]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.getReportTasks();
      setTasks(response.data?.items || response.data || mockReportTasks);
    } catch (error) {
      console.error('Failed to fetch report tasks:', error);
      setTasks(mockReportTasks);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await api.createReportTask(taskData);
      alert(t('common.success'));
      setShowCreateModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to create report task:', error);
      alert(t('common.failed'));
    }
  };

  const handleTriggerGeneration = async (reportId) => {
    try {
      await api.triggerReportGeneration(reportId);
      alert(t('common.success'));
      fetchTasks();
    } catch (error) {
      console.error('Failed to trigger report generation:', error);
      alert(t('common.failed'));
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const response = await api.downloadReport(reportId);
      if (response.data?.fileUrl) {
        // Use absolute URL for download
        const baseUrl = import.meta.env.VITE_API_BASE?.replace('/api/v1', '') || 'http://localhost:3001';
        window.open(baseUrl + response.data.fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to download report:', error);
      alert(t('common.failed'));
    }
  };

  const handleDelete = async (reportId) => {
    if (!confirm(t('common.confirm') + '?')) return;
    try {
      await api.deleteReportTask(reportId);
      alert(t('common.success'));
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete report task:', error);
      alert(t('common.failed'));
    }
  };

  const getStatusBadge = (status, progress) => {
    switch (status) {
      case 'completed':
        return <span className="status-badge valid">{t('reports.completed')}</span>;
      case 'running':
        return <span className="status-badge warning">{t('reports.running')} ({progress}%)</span>;
      case 'pending':
        return <span className="status-badge">{t('reports.pending')}</span>;
      case 'failed':
        return <span className="status-badge invalid">{t('reports.failed')}</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const columns = [
    { key: 'reportId', title: 'ID', sortable: true },
    { key: 'name', title: t('reports.taskName'), sortable: true },
    {
      key: 'type',
      title: t('reports.reportType'),
      render: (val) => t(`reports.${val}`) || val
    },
    {
      key: 'format',
      title: t('reports.format'),
      render: (val) => val.toUpperCase()
    },
    {
      key: 'status',
      title: t('reports.status'),
      render: (val, record) => getStatusBadge(val, record.progress)
    },
    { key: 'createdAt', title: t('reports.createdAt'), sortable: true },
    {
      key: 'actions',
      title: t('common.actions'),
      render: (_, record) => (
        <div className="action-buttons">
          {record.status === 'pending' && (
            <button className="btn btn-sm btn-primary" onClick={() => handleTriggerGeneration(record.reportId)}>
              {t('reports.generate')}
            </button>
          )}
          {record.status === 'completed' && (
            <button className="btn btn-sm btn-secondary" onClick={() => handleDownload(record.reportId)}>
              {t('reports.download')}
            </button>
          )}
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(record.reportId)}>
            {t('common.delete')}
          </button>
        </div>
      )
    }
  ];

  const filterConfig = [
    {
      key: 'type',
      label: t('reports.reportType'),
      type: 'select',
      options: [
        { value: 'daily', label: t('reports.daily') },
        { value: 'weekly', label: t('reports.weekly') },
        { value: 'monthly', label: t('reports.monthly') }
      ]
    },
    {
      key: 'status',
      label: t('reports.status'),
      type: 'select',
      options: [
        { value: 'pending', label: t('reports.pending') },
        { value: 'running', label: t('reports.running') },
        { value: 'completed', label: t('reports.completed') },
        { value: 'failed', label: t('reports.failed') }
      ]
    }
  ];

  const filteredTasks = tasks.filter(task => {
    if (filters.type && task.type !== filters.type) return false;
    if (filters.status && task.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t('reports.title')}</h1>
      </div>

      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        onSearch={() => {}}
        onReset={() => setFilters({ type: '', status: '' })}
      />

      <div className="action-bar">
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          {t('reports.generate')}
        </button>
      </div>

      <Table
        columns={columns}
        data={filteredTasks}
        loading={loading}
        rowKey="reportId"
        emptyText={t('common.noData')}
      />

      {showCreateModal && (
        <CreateReportModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}
    </div>
  );
}

function CreateReportModal({ onClose, onSubmit }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    type: 'daily',
    format: 'pdf',
    parameters: {}
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert(t('common.required'));
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={t('reports.generate')}
      footer={
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{t('common.confirm')}</button>
        </div>
      }
    >
      <div className="form-group">
        <label>{t('reports.taskName')}</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('reports.taskName')}
        />
      </div>
      <div className="form-group">
        <label>{t('reports.reportType')}</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="daily">{t('reports.daily')}</option>
          <option value="weekly">{t('reports.weekly')}</option>
          <option value="monthly">{t('reports.monthly')}</option>
        </select>
      </div>
      <div className="form-group">
        <label>{t('reports.format')}</label>
        <select
          value={formData.format}
          onChange={(e) => setFormData({ ...formData, format: e.target.value })}
        >
          <option value="pdf">{t('reports.pdf')}</option>
          <option value="excel">{t('reports.excel')}</option>
        </select>
      </div>
    </Modal>
  );
}
