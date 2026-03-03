import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function Teachers() {
  const { ready, user } = useAuth();
  const { language, t } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';

  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');

  const [sortBy, setSortBy] = useState('fullName');
  const [sortDir, setSortDir] = useState('asc');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [photo, setPhoto] = useState(null);
  const photoInputRef = useRef(null);

  const total = useMemo(() => teachers.length, [teachers]);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [teachersRes, assignmentsRes] = await Promise.all([api.get('/teachers'), api.get('/assignments')]);
      setTeachers(teachersRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.status ? `HTTP ${e.response.status}` : t('teacherCommon.networkError'));
      setError(t('teachers.loadFailed', { msg }));
    }
  }, [t]);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setAddress('');
    setBirthDate('');
    setStatus('Active');
    setPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const hoursByTeacher = useMemo(() => {
    const map = {};
    for (const a of assignments) {
      const tid = a.teacher?._id;
      if (!tid) continue;
      map[tid] = (map[tid] || 0) + (Number(a.hours) || 0);
    }
    return map;
  }, [assignments]);

  const onSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sortedTeachers = useMemo(() => {
    const arr = [...teachers];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'fullName') {
        cmp = String(a.fullName || '').localeCompare(String(b.fullName || ''), language, { sensitivity: 'base' });
      } else if (sortBy === 'hours') {
        cmp = (hoursByTeacher[a._id] || 0) - (hoursByTeacher[b._id] || 0);
      } else if (sortBy === 'status') {
        cmp = String(a.status || '').localeCompare(String(b.status || ''), language, { sensitivity: 'base' });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [teachers, sortBy, sortDir, hoursByTeacher, language]);

  const createTeacher = async () => {
    if (!isAdmin) return;
    if (!fullName.trim()) return alert(t('teachers.enterFullName'));
    if (!email.trim()) return alert(t('teachers.enterEmail'));
    if (password.length < 6) return alert(t('teachers.passwordMin'));

    const formData = new FormData();
    formData.append('fullName', fullName.trim());
    formData.append('phone', phone.trim());
    formData.append('email', email.trim());
    formData.append('password', password);
    formData.append('address', address.trim());
    formData.append('birthDate', birthDate || '');
    formData.append('status', status);
    if (photo) formData.append('photo', photo);

    try {
      await api.post('/teachers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      resetForm();
      loadData();
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.status ? `HTTP ${e.response.status}` : t('teacherCommon.networkError'));
      setError(t('teachers.createFailed', { msg }));
    }
  };

  const deleteTeacher = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm(t('teachers.deleteConfirm'))) return;
    try {
      await api.delete(`/teachers/${id}`);
      loadData();
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.status ? `HTTP ${e.response.status}` : t('teacherCommon.networkError'));
      setError(t('teachers.deleteFailed', { msg }));
    }
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0">
            <i className="fas fa-chalkboard-teacher me-1"></i>{t('teachers.title')}
          </h1>
          <div className="text-muted">{t('teachers.total', { count: total })}</div>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addTeacherModal" disabled={!ready}>
            {t('teachers.addTeacher')}
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover">
          <thead>
            <tr>
              <th role="button" className="user-select-none" onClick={() => onSort('fullName')}>
                {t('teachers.tableFullName')}
              </th>
              <th role="button" className="text-center user-select-none" onClick={() => onSort('hours')}>
                {t('teachers.tableHours')}
              </th>
              <th role="button" className="text-center user-select-none" onClick={() => onSort('status')}>
                {t('teachers.tableStatus')}
              </th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{t('teachers.tableActions')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeachers.map((teacher) => (
              <tr key={teacher._id}>
                <td>
                  {teacher.photo ? (
                    <img
                      src={getFileUrl(teacher.photo)}
                      alt=""
                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '10%', marginRight: 10, verticalAlign: 'middle' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10%',
                        background: '#eee',
                        color: '#bbb',
                        marginRight: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        verticalAlign: 'middle'
                      }}
                    >
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                  {teacher.fullName}
                </td>
                <td className="text-center">{hoursByTeacher[teacher._id] || 0}</td>
                <td className="text-center">{teacher.status || '-'}</td>
                <td className="text-end" style={{ width: 1, whiteSpace: 'nowrap' }}>
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                    <Link to={`/teachers/${teacher._id}`} className="btn btn-outline-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                      <i className="fa-solid fa-eye me-1"></i>{t('teacherCommon.open')}
                    </Link>
                    {isAdmin && (
                      <Link to={`/teachers/${teacher._id}/edit`} className="btn btn-outline-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fa-solid fa-pen me-1"></i>{t('teacherCommon.edit')}
                      </Link>
                    )}
                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => deleteTeacher(teacher._id)}>
                        <i className="fa-solid fa-xmark me-1"></i>{t('teacherCommon.delete')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center text-muted">{t('teachers.noTeachers')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="modal fade" id="addTeacherModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('teachers.modalTitle')}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetForm}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">{t('teachers.fullName')}</label>
                    <input className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!ready} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{t('teachers.photo')}</label>
                    <input ref={photoInputRef} type="file" className="form-control" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} disabled={!ready} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">{t('teachers.birthDate')}</label>
                    <input type="date" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={!ready} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">{t('teachers.phone')}</label>
                    <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!ready} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">{t('teachers.email')}</label>
                    <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!ready} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">{t('teachers.password')}</label>
                    <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!ready} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">{t('teachers.status')}</label>
                    <input className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} disabled={!ready} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">{t('teachers.address')}</label>
                    <input className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} disabled={!ready} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={resetForm}>{t('teacherCommon.cancel')}</button>
                <button type="button" className="btn btn-primary" onClick={createTeacher} data-bs-dismiss="modal" disabled={!ready}>{t('teacherCommon.save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;
