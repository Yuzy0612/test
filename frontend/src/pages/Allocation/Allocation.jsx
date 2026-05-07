// Allocation 区块回配页面
import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Table, FilterBar, Modal } from '../../components/common';
import api from '../../services/api';

const mockRules = [
  { ruleId: 'AR-001', block: 'B1', weightStrategy: 'oil', status: 'active', effectiveFrom: '2026-04-01' },
  { ruleId: 'AR-002', block: 'B2', weightStrategy: 'equal', status: 'draft', effectiveFrom: '2026-04-15' },
  { ruleId: 'AR-003', block: 'C1', weightStrategy: 'gas', status: 'active', effectiveFrom: '2026-03-20' },
];

const mockResults = [
  { taskId: 'ALLOC-20260427-001', block: 'B1', allocationDate: '2026-04-27', totalOil: 520, totalGas: 10400, totalWater: 380, deviation: 0.002, status: 'completed' },
  { taskId: 'ALLOC-20260426-001', block: 'B1', allocationDate: '2026-04-26', totalOil: 515, totalGas: 10300, totalWater: 375, deviation: 0.001, status: 'completed' },
  { taskId: 'ALLOC-20260427-002', block: 'C1', allocationDate: '2026-04-27', totalOil: 310, totalGas: 6200, totalWater: 145, deviation: 0.003, status: 'completed' },
];

const mockBlocks = [
  { value: 'B1', label: 'Birrea Block 1' },
  { value: 'B2', label: 'Birrea Block 2' },
  { value: 'C1', label: 'Casava Block 1' },
  { value: 'C2', label: 'Casava Block 2' },
];

export default function Allocation() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'rules') {
        const response = await api.getAllocationRules();
        setRules(response.data?.items || response.data || mockRules);
      } else {
        const response = await api.getAllocationResults();
        setResults(response.data?.items || response.data || mockResults);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setRules(mockRules);
      setResults(mockResults);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (ruleData) => {
    try {
      await api.createAllocationRule(ruleData);
      alert(t('common.success'));
      setShowRuleModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create rule:', error);
      alert(t('common.failed'));
    }
  };

  const handleExecuteAllocation = async (data) => {
    try {
      await api.runAllocation(data);
      alert(t('common.success'));
      setShowExecuteModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to execute allocation:', error);
      alert(t('common.failed'));
    }
  };

  const ruleColumns = [
    { key: 'ruleId', title: t('allocation.rule'), sortable: true },
    { key: 'block', title: t('allocation.block'), sortable: true },
    {
      key: 'weightStrategy',
      title: t('allocation.weightStrategy'),
      render: (val) => t(`allocation.${val}`) || val
    },
    {
      key: 'status',
      title: t('common.status'),
      render: (val) => (
        <span className={`status-badge ${val === 'active' ? 'valid' : 'warning'}`}>
          {val}
        </span>
      )
    },
    { key: 'effectiveFrom', title: t('allocation.startTime'), sortable: true },
    {
      key: 'actions',
      title: t('common.actions'),
      render: (_, record) => (
        record.status === 'draft' && (
          <button className="btn btn-sm btn-primary" onClick={() => handleActivate(record)}>
            {t('allocation.execute')}
          </button>
        )
      )
    }
  ];

  const resultColumns = [
    { key: 'taskId', title: 'Task ID', sortable: true },
    { key: 'block', title: t('allocation.block'), sortable: true },
    { key: 'allocationDate', title: t('allocation.startTime'), sortable: true },
    { key: 'totalOil', title: t('allocation.totalOil'), sortable: true },
    { key: 'totalGas', title: t('allocation.totalGas'), sortable: true },
    { key: 'totalWater', title: t('allocation.totalWater'), sortable: true },
    {
      key: 'deviation',
      title: t('allocation.deviation'),
      render: (val) => (
        <span style={{ color: val < 0.01 ? 'green' : 'red' }}>
          {(val * 100).toFixed(2)}%
        </span>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t('allocation.title')}</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          {t('allocation.rule')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          {t('allocation.result')}
        </button>
      </div>

      <div className="action-bar">
        {activeTab === 'rules' ? (
          <>
            <button className="btn btn-primary" onClick={() => setShowRuleModal(true)}>
              {t('common.add')} {t('allocation.rule')}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowExecuteModal(true)}>
              {t('allocation.execute')}
            </button>
          </>
        ) : null}
      </div>

      <Table
        columns={activeTab === 'rules' ? ruleColumns : resultColumns}
        data={activeTab === 'rules' ? rules : results}
        loading={loading}
        rowKey={activeTab === 'rules' ? 'ruleId' : 'taskId'}
        emptyText={t('common.noData')}
      />

      {showRuleModal && (
        <RuleModal
          blocks={mockBlocks}
          onClose={() => setShowRuleModal(false)}
          onSubmit={handleCreateRule}
        />
      )}

      {showExecuteModal && (
        <ExecuteModal
          blocks={mockBlocks}
          onClose={() => setShowExecuteModal(false)}
          onSubmit={handleExecuteAllocation}
        />
      )}
    </div>
  );
}

function RuleModal({ blocks, onClose, onSubmit }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    block: blocks[0]?.value || '',
    weightStrategy: 'oil',
    effectiveFrom: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={t('common.add') + ' ' + t('allocation.rule')}
      footer={
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{t('common.confirm')}</button>
        </div>
      }
    >
      <div className="form-group">
        <label>{t('allocation.block')}</label>
        <select
          value={formData.block}
          onChange={(e) => setFormData({ ...formData, block: e.target.value })}
        >
          {blocks.map(b => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>{t('allocation.weightStrategy')}</label>
        <select
          value={formData.weightStrategy}
          onChange={(e) => setFormData({ ...formData, weightStrategy: e.target.value })}
        >
          <option value="equal">{t('allocation.equal')}</option>
          <option value="oil">{t('allocation.oil')}</option>
          <option value="gas">{t('allocation.gas')}</option>
          <option value="water">{t('allocation.water')}</option>
        </select>
      </div>
      <div className="form-group">
        <label>{t('allocation.startTime')}</label>
        <input
          type="date"
          value={formData.effectiveFrom}
          onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
        />
      </div>
    </Modal>
  );
}

function ExecuteModal({ blocks, onClose, onSubmit }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    block: blocks[0]?.value || '',
    allocationDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={t('allocation.execute')}
      footer={
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{t('common.confirm')}</button>
        </div>
      }
    >
      <div className="form-group">
        <label>{t('allocation.block')}</label>
        <select
          value={formData.block}
          onChange={(e) => setFormData({ ...formData, block: e.target.value })}
        >
          {blocks.map(b => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>{t('allocation.startTime')}</label>
        <input
          type="date"
          value={formData.allocationDate}
          onChange={(e) => setFormData({ ...formData, allocationDate: e.target.value })}
        />
      </div>
    </Modal>
  );
}
