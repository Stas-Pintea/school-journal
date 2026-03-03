import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { loginLocalI18n, pickLocalI18n, useI18n } from '../i18n/I18nContext';

export default function Login() {
  const { login } = useAuth();
  const { language } = useI18n();
  const tr = pickLocalI18n(loginLocalI18n, language);

  const nav = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      await login(usernameOrEmail, password);
      nav('/', { replace: true });
    } catch (e2) {
      setErr(e2.response?.data?.message || tr.failed);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shape login-shape-a"></div>
      <div className="login-shape login-shape-b"></div>

      <div className="login-card card border-0 shadow-lg">
        <div className="card-body p-4 p-md-5">
          <div className="login-brand mb-4">
            <div className="login-brand-icon">
              <i className="fas fa-school"></i>
            </div>
            <div>
              <div className="login-brand-name">SAP</div>
              <div className="login-brand-subtitle">{tr.title}</div>
            </div>
          </div>

          {err && <div className="alert alert-danger py-2">{err}</div>}

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">{tr.userOrEmail}</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fa-regular fa-user"></i>
                </span>
                <input
                  className="form-control"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">{tr.password}</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fa-solid fa-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button className="btn btn-primary w-100 login-submit-btn">
              <i className="fa-solid fa-right-to-bracket me-2"></i>
              {tr.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
