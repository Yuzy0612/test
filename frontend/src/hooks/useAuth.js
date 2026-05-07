// useAuth - 认证与权限Hook
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (resource, action) => {
    if (!user || !user.permissions) return false;

    const rolePermissions = {
      production_engineer: ['well:read', 'vfm:read', 'report:read'],
      measurement_engineer: ['well:read', 'calibration:read', 'calibration:write', 'model:read', 'report:read'],
      block_manager: ['well:read', 'allocation:read', 'allocation:write', 'report:read', 'report:write'],
      admin: ['*']
    };

    const userPermissions = rolePermissions[user.role] || [];

    return userPermissions.includes('*') ||
           userPermissions.includes(`${resource}:${action}`) ||
           userPermissions.includes(`${resource}:*`);
  };

  return { hasPermission };
}

export default useAuth;