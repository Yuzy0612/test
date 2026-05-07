// useTrends - 历史趋势查询的Hook
import { useState } from 'react';
import api from '../api/api';

export function useTrends() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const queryTrends = async ({ wellId, blockId, metrics, startTime, endTime, interval }) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        metrics,
        startTime,
        endTime,
        interval
      };
      if (wellId) params.wellId = wellId;
      if (blockId) params.blockId = blockId;

      const response = await api.get('/trends', { params });
      setData(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format = 'csv') => {
    if (!data) return null;
    // 导出逻辑
    return data;
  };

  return { data, loading, error, queryTrends, exportData };
}

export default useTrends;