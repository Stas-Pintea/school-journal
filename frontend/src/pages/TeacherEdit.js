import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function TeacherEdit() {
  const { ready, user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';

  const { id } = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [teacherUserId, setTeacherUserId] = useState('');
  const [photo, setPhoto] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (!ready) return;

    const load = async () => {
      try {
        setError('');
        const tRes = await api.get(`/teachers/${id}`);
        const teacher = tRes.data;

        setFullName(teacher.fullName || '');
        setPhone(teacher.phone || '');
        setEmail(teacher.email || '');
        setAddress(teacher.address || '');
        setBirthDate(teacher.birthDate ? String(teacher.birthDate).slice(0, 10) : '');
        setStatus(teacher.status || 'Active');
        setTeacherUserId(teacher.user?._id || '');
      } catch (e) {
        const msg =
          e.response?.data?.message ||
          (e.response?.status ? `HTTP ${e.response.status}` : t('teacherCommon.networkError'));
        setError(t('teacherEdit.loadFailed', { msg }));
      }
    };

    load();
  }, [id, ready, t]);

  const save = async () => {
    const canEdit = isAdmin || (teacherUserId && String(teacherUserId) === String(user?.id || ''));
    if (!canEdit) return;
    if (!fullName.trim()) return alert(t('teacherEdit.enterFullName'));
    if (password && password.length < 6) return alert(t('teacherEdit.passwordMin'));
    if (password && password !== passwordConfirm) return alert(t('teacherEdit.passwordMismatch'));

    const formData = new FormData();
    formData.append('fullName', fullName.trim());
    formData.append('phone', phone.trim());
    formData.append('email', email.trim());
    formData.append('address', address.trim());
    formData.append('birthDate', birthDate || '');
    if (isAdmin) formData.append('status', status);
    if (password) formData.append('password', password);
    if (photo) formData.append('photo', photo);

    try {
      await api.put(`/teachers/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhoto(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
      navigate(`/teachers/${id}`);
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.status ? `HTTP ${e.response.status}` : t('teacherCommon.networkError'));
      setError(t('teacherEdit.saveFailed', { msg }));
    }
  };

  const canEdit = isAdmin || (teacherUserId && String(teacherUserId) === String(user?.id || ''));
  const disabled = !ready || !canEdit;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          <i className="fas fa-chalkboard-teacher me-1"></i>
          {t('teacherEdit.title')}
        </h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to={`/teachers/${id}`}>
            <i className="fa-solid fa-chevron-left me-1"></i>
            {t('teacherCommon.cancel')}
          </Link>
          <button className="btn btn-primary" onClick={save} disabled={disabled}>
            <i className="fa-solid fa-floppy-disk me-1"></i>
            {t('teacherCommon.save')}
          </button>
        </div>
      </div>

      {!canEdit && <div className="alert alert-info">{t('teacherEdit.ownProfileOnly')}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                <i className="fa-solid fa-user me-1"></i>
                {t('teacherEdit.fullName')}
              </label>
              <input className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={disabled} />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                <i className="fa-solid fa-image me-1"></i>
                {t('teacherEdit.photoReplace')}
              </label>
              <input ref={photoInputRef} type="file" className="form-control" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} disabled={disabled} />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                <i className="fa-regular fa-calendar-days me-1"></i>
                {t('teacherEdit.birthDate')}
              </label>
              <input type="date" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={disabled} />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                <i className="fa-solid fa-phone me-1"></i>
                {t('teacherEdit.phone')}
              </label>
              <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={disabled} />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                <i className="fa-solid fa-envelope me-1"></i>
                {t('teacherEdit.email')}
              </label>
              <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} disabled={disabled} />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                <i className="fa-solid fa-lock me-1"></i>
                {t('teacherEdit.password')}
              </label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('teacherEdit.keepPassword')}
                disabled={disabled}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                <i className="fa-solid fa-lock me-1"></i>
                {t('teacherEdit.passwordConfirm')}
              </label>
              <input
                type="password"
                className="form-control"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder={t('teacherEdit.keepPassword')}
                disabled={disabled}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                <i className="fa-solid fa-map-location me-1"></i>
                {t('teacherEdit.address')}
              </label>
              <input className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} disabled={disabled} />
            </div>

            <div className="col-md-2">
              <label className="form-label">
                <i className="fa-solid fa-circle-info me-1"></i>
                {t('teacherEdit.status')}
              </label>
              <input
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={disabled || !isAdmin}
                title={!isAdmin ? t('teacherEdit.statusAdminOnly') : ''}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherEdit;
