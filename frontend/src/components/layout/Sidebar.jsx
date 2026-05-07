// Sidebar 组件
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', key: 'dashboard', roles: ['production_engineer', 'measurement_engineer', 'block_manager', 'admin'] },
  { path: '/trends', key: 'trends', roles: ['production_engineer', 'measurement_engineer', 'block_manager', 'admin'] },
  { path: '/calibration', key: 'calibration', roles: ['measurement_engineer', 'admin'] },
  { path: '/allocation', key: 'allocation', roles: ['block_manager', 'admin'] },
  { path: '/reports', key: 'reports', roles: ['production_engineer', 'measurement_engineer', 'block_manager', 'admin'] },
  { path: '/system', key: 'system', roles: ['admin'] }
];

export default function Sidebar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>VFM</h2>
      </div>
      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? 'active' : ''}
          >
            <span className="nav-icon">{getIcon(item.key)}</span>
            <span className="nav-label">{t(`nav.${item.key}`)}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function getIcon(key) {
  const icons = {
    dashboard: '◉',
    wells: '☰',
    calibration: '⚙',
    allocation: '⚖',
    trends: '📈',
    reports: '📊',
    system: '⚙'
  };
  return icons[key] || '●';
}
