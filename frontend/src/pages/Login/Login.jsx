import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(username, password);
      if (response.data?.token) {
        authLogin(response.data.token, response.data.user);
        navigate('/');
      } else {
        setError('Invalid response');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>VFM</h1>
        <p className="subtitle">{t('system.title')}</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">{t('auth.username') || 'Username'}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.username') || 'Username'}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password') || 'Password'}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password') || 'Password'}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? t('common.loading') : t('auth.login') || 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Virtual Flow Metering System</p>
          <p>PSA Chad</p>
        </div>
      </div>
    </div>
  );
}
