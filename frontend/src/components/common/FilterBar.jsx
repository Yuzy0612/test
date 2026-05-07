// FilterBar 组件 - 筛选工具栏
import { useLanguage } from '../../context/LanguageContext';

export default function FilterBar({
  filters = [],
  values = {},
  onChange,
  onSearch,
  onReset,
  className = ''
}) {
  const { t } = useLanguage();

  const handleChange = (key, value) => {
    onChange?.({ ...values, [key]: value });
  };

  const handleReset = () => {
    onReset?.();
  };

  const renderFilter = (filter) => {
    const value = values[filter.key];

    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.key} className="filter-item">
            <label>{filter.label}</label>
            <select
              value={value || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
            >
              <option value="">{filter.placeholder || 'All'}</option>
              {filter.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {filter.labels ? filter.labels[opt.value] : opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'date':
        return (
          <div key={filter.key} className="filter-item">
            <label>{filter.label}</label>
            <input
              type="date"
              value={value || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
            />
          </div>
        );

      case 'daterange':
        return (
          <div key={filter.key} className="filter-item">
            <label>{filter.label}</label>
            <div className="date-range">
              <input
                type="date"
                value={value?.start || ''}
                onChange={(e) => handleChange(filter.key, { ...value, start: e.target.value })}
              />
              <span>~</span>
              <input
                type="date"
                value={value?.end || ''}
                onChange={(e) => handleChange(filter.key, { ...value, end: e.target.value })}
              />
            </div>
          </div>
        );

      case 'text':
      default:
        return (
          <div key={filter.key} className="filter-item">
            <label>{filter.label}</label>
            <input
              type="text"
              value={value || ''}
              placeholder={filter.placeholder}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
            />
          </div>
        );
    }
  };

  return (
    <div className={`filter-bar ${className}`}>
      <div className="filter-items">
        {filters.map(renderFilter)}
      </div>
      <div className="filter-actions">
        <button onClick={onSearch} className="btn-search">
          {t('common.search')}
        </button>
        <button onClick={handleReset} className="btn-reset">
          {t('common.reset')}
        </button>
      </div>
    </div>
  );
}
