// AuthContext - 认证状态管理
import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('vfm_token'));
  const [loading, setLoading] = useState(true);

  // 初始化时检查token有效性
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vfm_token');
      if (storedToken) {
        try {
          // 验证token并获取用户信息
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          setToken(storedToken);
        } catch (error) {
          // token无效，清除
          localStorage.removeItem('vfm_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('vfm_token', newToken);
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('vfm_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;