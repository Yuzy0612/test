// Header 组件
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language, changeLanguage } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>{t('system.title')}</h1>
      </div>
      <div className="header-right">
        <button onClick={toggleLanguage} className="lang-toggle">
          {language === 'zh' ? 'EN' : '中文'}
        </button>
        <div className="user-info">
          <span className="user-name">{user?.displayName || user?.username}</span>
          <span className="user-role">{t(`role.${user?.role}`) || user?.role}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          {t('auth.logout') || 'Logout'}
        </button>
      </div>
    </header>
  );
}
