// useRealtimeData - 实时产量数据的Hook
import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

export function useRealtimeData(wellIds = [], refreshInterval = 30000) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    if (!wellIds || wellIds.length === 0) {
      setData({});
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/vfm/realtime/query', { wellIds });
      const dataMap = {};
      (response.data || []).forEach(item => {
        dataMap[item.wellId] = item;
      });
      setData(dataMap);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [wellIds.join(',')]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, lastUpdate, refetch: fetchData };
}

export default useRealtimeData;