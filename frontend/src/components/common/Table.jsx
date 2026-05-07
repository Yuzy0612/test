// Table 组件 - 通用数据表格
import { useState } from 'react';

export default function Table({
  columns,
  data,
  loading,
  emptyText = 'No data',
  onRowClick,
  rowKey = 'id',
  pagination,
  onPageChange,
  className = ''
}) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (column) => {
    if (!column.sortable) return;

    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (aVal < bVal) return -1 * modifier;
    if (aVal > bVal) return 1 * modifier;
    return 0;
  });

  const renderCell = (column, row) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    return row[column.key] ?? '-';
  };

  return (
    <div className={`table-container ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={col.sortable ? 'sortable' : ''}
                onClick={() => handleSort(col)}
                style={{ width: col.width }}
              >
                {col.title}
                {sortColumn === col.key && (
                  <span className="sort-icon">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="loading-cell">
                Loading...
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-cell">
                {emptyText}
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => (
              <tr
                key={row[rowKey] || idx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'clickable' : ''}
              >
                {columns.map(col => (
                  <td key={col.key}>{renderCell(col, row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && (
        <div className="table-pagination">
          <span className="page-info">
            Total {pagination.total || data.length} items
          </span>
          <div className="page-controls">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
            <button
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
