// useWells - 获取井列表的Hook
import { useState, useEffect } from 'react';
import api from '../api/api';

export function useWells(filters = {}) {
  const [wells, setWells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  const fetchWells = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: pagination.pageSize,
        ...filters
      };
      const response = await api.get('/wells', { params });
      setWells(response.data.items || response.data);
      setPagination(prev => ({
        ...prev,
        page,
        total: response.data.total || wells.length
      }));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWells(1);
  }, [JSON.stringify(filters)]);

  return { wells, loading, error, pagination, refetch: () => fetchWells(pagination.page) };
}

export default useWells;