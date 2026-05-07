import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';

// 页面组件
import Dashboard from '../pages/Dashboard/Dashboard';
import WellDetail from '../pages/WellDetail/WellDetail';
import Calibration from '../pages/Calibration/Calibration';
import Allocation from '../pages/Allocation/Allocation';
import Trends from '../pages/Trends/Trends';
import Reports from '../pages/Reports/Reports';
import SystemManagement from '../pages/SystemManagement/SystemManagement';
import Login from '../pages/Login/Login';

// 路由守卫组件
function ProtectedRoute({ children, requiredRoles }) {
  const { isAuthenticated, user } = useContext(AuthContext);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 页面包装器（带布局）
function withLayout(Page) {
  return function WrappedPage(props) {
    return (
      <AppLayout>
        <Page {...props} />
      </AppLayout>
    );
  };
}

// 路由配置
const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/well/:wellId', name: 'WellDetail', component: WellDetail, meta: { requiresAuth: true } },
  { path: '/calibration', name: 'Calibration', component: Calibration, meta: { requiresAuth: true, roles: ['measurement_engineer', 'admin'] } },
  { path: '/allocation', name: 'Allocation', component: Allocation, meta: { requiresAuth: true, roles: ['block_manager', 'admin'] } },
  { path: '/trends', name: 'Trends', component: Trends, meta: { requiresAuth: true } },
  { path: '/reports', name: 'Reports', component: Reports, meta: { requiresAuth: true } },
  { path: '/system', name: 'SystemManagement', component: SystemManagement, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/login', name: 'Login', component: Login, meta: { requiresAuth: false } }
];

// 创建路由
function AppRoutes() {
  return (
    <Routes>
      {routes.map(route => (
        <Route
          key={route.path}
          path={route.path}
          element={
            route.meta?.requiresAuth ? (
              <ProtectedRoute requiredRoles={route.meta?.roles}>
                {route.path === '/login' ? (
                  <route.component />
                ) : (
                  withLayout(route.component)
                )}
              </ProtectedRoute>
            ) : (
              <route.component />
            )
          }
        />
      ))}
    </Routes>
  );
}

// 根路由组件
export default function Router() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export { routes };
export default Router;
