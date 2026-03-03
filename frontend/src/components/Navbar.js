import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import api, { getFileUrl } from '../services/api';

function Navbar() {
  const { user, ready, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profileReady, setProfileReady] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const nextLanguage = language === 'ru' ? 'ro' : 'ru';
  const profileEditLabel = language === 'ro' ? 'Editare profil' : 'Редактирование профиля';
  const switchLanguageLabel = language === 'ro' ? 'Schimbă limba' : 'Сменить язык';

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!user) {
        setProfileName('');
        setProfilePhoto('');
        setPhotoFailed(false);
        setProfileReady(true);
        return;
      }

      setProfileReady(false);
      setPhotoFailed(false);

      if (user.teacherId) {
        try {
          const res = await api.get(`/teachers/${user.teacherId}`);
          if (cancelled) return;
          setProfileName(res.data?.fullName || user.username || user.email || '');
          setProfilePhoto(res.data?.photo || '');
          setProfileReady(true);
          return;
        } catch {
          // fallback to auth payload
        }
      }

      setProfileName(user.username || user.email || '');
      setProfilePhoto('');
      setProfileReady(true);
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const profileEditPath = useMemo(() => {
    if (!user) return '/login';
    if (user.teacherId) return `/teachers/${user.teacherId}/edit`;
    return '/teachers';
  }, [user]);

  if (location.pathname === '/login') return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark" style={{ minHeight: 64 }}>
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="fas fa-school me-2"></i>
          SAP
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/classes" title={t('navbar.classes')} aria-label={t('navbar.classes')}>
                    <i className="fas fa-book"></i>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/students" title={t('navbar.students')} aria-label={t('navbar.students')}>
                    <i className="fas fa-user-graduate"></i>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/teachers" title={t('navbar.teachers')} aria-label={t('navbar.teachers')}>
                    <i className="fas fa-chalkboard-teacher"></i>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/subjects" title={t('navbar.subjects')} aria-label={t('navbar.subjects')}>
                    <i className="fas fa-book-open"></i>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/assignments" title={t('navbar.assignments')} aria-label={t('navbar.assignments')}>
                    <i className="fas fa-tasks"></i>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/academic-calendar" title={t('navbar.calendar')} aria-label={t('navbar.calendar')}>
                    <i className="fas fa-calendar-alt"></i>
                  </Link>
                </li>
              </>
            )}

            <li className="nav-item ms-lg-3">
              <div className="d-flex align-items-center gap-2">
                {!ready ? (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10%',
                      background: '#f8f9fa',
                      opacity: 0.45
                    }}
                  />
                ) : !user ? (
                  <Link className="btn btn-outline-light btn-sm" to="/login" title={t('navbar.login')} aria-label={t('navbar.login')}>
                    <i className="fas fa-sign-in-alt"></i>
                  </Link>
                ) : !profileReady ? (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10%',
                      background: '#f8f9fa',
                      opacity: 0.45
                    }}
                  />
                ) : (
                  <div className="dropdown">
                    <button
                      className="btn p-0 border-0 bg-transparent d-inline-flex align-items-center"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      title={profileName || user.username || user.email || ''}
                      aria-label={profileName || user.username || user.email || 'Profile'}
                    >
                      {profilePhoto && !photoFailed ? (
                        <img
                          src={getFileUrl(profilePhoto)}
                          alt=""
                          onError={() => setPhotoFailed(true)}
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '10%' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '10%',
                            background: '#f8f9fa',
                            color: '#bbb',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            verticalAlign: 'middle'
                          }}
                        >
                          <i className="fas fa-user"></i>
                        </div>
                      )}
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <Link className="dropdown-item" to={profileEditPath}>
                          <i className="fa-solid fa-pen me-2"></i>
                          {profileEditLabel}
                        </Link>
                      </li>
                      <li>
                        <button className="dropdown-item" type="button" onClick={() => setLanguage(nextLanguage)}>
                          <i className="fa-solid fa-language me-2"></i>
                          {switchLanguageLabel} ({nextLanguage.toUpperCase()})
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button className="dropdown-item" type="button" onClick={onLogout}>
                          <i className="fas fa-sign-out-alt me-2"></i>
                          {t('navbar.logout')}
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
