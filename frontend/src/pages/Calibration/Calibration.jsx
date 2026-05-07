// Calibration 标定管理页面
import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Table, FilterBar, Modal } from '../../components/common';
import api from '../../services/api';

const mockCalibrationRecords = [
  { id: 1, wellId: 'BIR-001', timestamp: '2026-04-27 08:00', oil: 52.3, gas: 1120, water: 38.7, source: 'manual', qualityStatus: 'valid' },
  { id: 2, wellId: 'BIR-001', timestamp: '2026-04-27 10:00', oil: 51.8, gas: 1095, water: 39.2, source: 'manual', qualityStatus: 'valid' },
  { id: 3, wellId: 'BIR-002', timestamp: '2026-04-27 09:00', oil: 48.1, gas: 980, water: 42.3, source: 'auto', qualityStatus: 'valid' },
  { id: 4, wellId: 'CAS-001', timestamp: '2026-04-27 11:00', oil: 61.4, gas: 1350, water: 28.9, source: 'manual', qualityStatus: 'warning' },
  { id: 5, wellId: 'PAR-001', timestamp: '2026-04-27 14:00', oil: 55.2, gas: 1180, water: 33.1, source: 'auto', qualityStatus: 'valid' },
];

const mockWells = [
  { wellId: 'BIR-001', field: 'Birrea' },
  { wellId: 'BIR-002', field: 'Birrea' },
  { wellId: 'CAS-001', field: 'Casava' },
  { wellId: 'PAR-001', field: 'Parkia' },
];

export default function Calibration() {
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({ wellId: '', status: '' });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await api.getCalibrationRecords({ pageSize: 100 });
      if (response.data?.items) {
        setRecords(response.data.items);
      } else if (Array.isArray(response.data)) {
        setRecords(response.data);
      } else {
        setRecords(mockCalibrationRecords);
      }
    } catch (error) {
      console.error('Failed to fetch calibration records:', error);
      setRecords(mockCalibrationRecords);
    } finally {
      setLoading(false);
    }
  };

  const handleQualityCheck = async () => {
    if (selectedRowKeys.length === 0) {
      alert(t('calibration.qualityCheck') + ': ' + t('common.noData'));
      return;
    }
    try {
      const response = await api.qualityCheck(selectedRowKeys);
      alert(t('common.success'));
      fetchRecords();
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Quality check failed:', error);
      alert(t('common.failed'));
    }
  };

  const handleImport = async (data) => {
    try {
      const wellId = data.wellId;
      const records = data.records;
      await api.importCalibrationData(wellId, records);
      alert(t('common.success'));
      setShowImportModal(false);
      fetchRecords();
    } catch (error) {
      console.error('Import failed:', error);
      alert(t('common.failed'));
    }
  };

  const getQualityStatus = (status) => {
    switch (status) {
      case 'valid':
        return <span className="status-badge valid">{t('calibration.valid')}</span>;
      case 'warning':
        return <span className="status-badge warning">{t('calibration.warning')}</span>;
      case 'invalid':
        return <span className="status-badge invalid">{t('calibration.failed')}</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const columns = [
    { key: 'wellId', title: t('calibration.wellId'), sortable: true },
    { key: 'timestamp', title: t('calibration.timestamp'), sortable: true },
    { key: 'oil', title: t('calibration.oil') + ' (m³)', sortable: true },
    { key: 'gas', title: t('calibration.gas') + ' (Sm³)', sortable: true },
    { key: 'water', title: t('calibration.water') + ' (m³)', sortable: true },
    {
      key: 'source',
      title: t('calibration.source'),
      render: (val) => t(`calibration.${val}`) || val
    },
    {
      key: 'qualityStatus',
      title: t('calibration.qualityStatus'),
      render: getQualityStatus
    }
  ];

  const filterConfig = [
    {
      key: 'wellId',
      label: t('calibration.wellId'),
      type: 'select',
      options: mockWells.map(w => ({ value: w.wellId, label: w.wellId }))
    },
    {
      key: 'status',
      label: t('calibration.qualityStatus'),
      type: 'select',
      options: [
        { value: 'valid', label: t('calibration.valid') },
        { value: 'warning', label: t('calibration.warning') },
        { value: 'invalid', label: t('calibration.failed') }
      ]
    }
  ];

  const filteredRecords = records.filter(record => {
    if (filters.wellId && record.wellId !== filters.wellId) return false;
    if (filters.status && record.qualityStatus !== filters.status) return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t('calibration.title')}</h1>
      </div>

      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        onSearch={() => {}}
        onReset={() => setFilters({ wellId: '', status: '' })}
      />

      <div className="action-bar">
        <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>
          {t('calibration.import')}
        </button>
        <button className="btn btn-secondary" onClick={handleQualityCheck}>
          {t('calibration.qualityCheck')}
        </button>
      </div>

      <Table
        columns={columns}
        data={filteredRecords}
        loading={loading}
        rowKey="id"
        onRowClick={(record) => console.log('Record clicked:', record)}
        emptyText={t('common.noData')}
      />

      {showImportModal && (
        <ImportModal
          wells={mockWells}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}

function ImportModal({ wells, onClose, onImport }) {
  const { t } = useLanguage();
  const [wellId, setWellId] = useState(wells[0]?.wellId || '');
  const [records, setRecords] = useState('');

  const handleSubmit = () => {
    if (!wellId || !records.trim()) {
      alert(t('common.required'));
      return;
    }
    try {
      const parsedRecords = JSON.parse(records);
      onImport({ wellId, records: parsedRecords });
    } catch {
      alert(t('error.validationError'));
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={t('calibration.import')}
      width="600px"
      footer={
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{t('common.confirm')}</button>
        </div>
      }
    >
      <div className="form-group">
        <label>{t('calibration.wellId')}</label>
        <select value={wellId} onChange={(e) => setWellId(e.target.value)}>
          {wells.map(w => (
            <option key={w.wellId} value={w.wellId}>{w.wellId}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>JSON {t('calibration.importRecord')}</label>
        <textarea
          value={records}
          onChange={(e) => setRecords(e.target.value)}
          placeholder='[{"timestamp": "2026-04-27 08:00", "oil": 52.3, "gas": 1120, "water": 38.7}]'
          rows={10}
        />
      </div>
    </Modal>
  );
}
