import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function Subjects() {
  const { ready, user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';

  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  const total = useMemo(() => subjects.length, [subjects]);

  const loadSubjects = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/subjects');
      setSubjects(res.data || []);
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : t('common.networkError'));
      setError(t('subjects.loadFailed', { msg }));
    }
  }, [t]);

  useEffect(() => {
    if (!ready) return;
    loadSubjects();
  }, [ready, loadSubjects]);

  const resetForm = () => setName('');

  const createSubject = async () => {
    if (!isAdmin) return;
    if (!name.trim()) return alert(t('subjects.nameRequired'));

    try {
      await api.post('/subjects', { name: name.trim() });
      resetForm();
      loadSubjects();
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : t('common.networkError'));
      setError(t('subjects.createFailed', { msg }));
    }
  };

  const deleteSubject = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm(t('subjects.deleteConfirm'))) return;

    try {
      await api.delete(`/subjects/${id}`);
      loadSubjects();
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : t('common.networkError'));
      setError(t('subjects.deleteFailed', { msg }));
    }
  };

  if (!ready) return <div className="container py-4 text-muted">{t('common.loading')}</div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0">
            <i className="fas fa-book-open me-1"></i>{t('subjects.title')}
          </h1>
          <div className="text-muted">{t('subjects.total', { count: total })}</div>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addSubjectModal" onClick={resetForm}>
            {t('subjects.add')}
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover">
          <thead>
            <tr>
              <th>{t('subjects.name')}</th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{t('subjects.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td className="text-end">
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                    <Link to={`/subjects/${s._id}`} className="btn btn-outline-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                      <i className="fa-solid fa-eye me-1"></i>{t('teacherCommon.open')}
                    </Link>
                    {isAdmin && (
                      <Link to={`/subjects/${s._id}/edit`} className="btn btn-outline-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fa-solid fa-pen me-1"></i>{t('teacherCommon.edit')}
                      </Link>
                    )}
                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => deleteSubject(s._id)}>
                        <i className="fa-solid fa-xmark me-1"></i>{t('teacherCommon.delete')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {subjects.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center text-muted">
                  {t('subjects.none')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="modal fade" id="addSubjectModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('subjects.addTitle')}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetForm}></button>
              </div>

              <div className="modal-body">
                <label className="form-label">{t('subjects.nameLabel')}</label>
                <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('subjects.placeholder')} />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={resetForm}>
                  {t('teacherCommon.cancel')}
                </button>
                <button type="button" className="btn btn-primary" onClick={createSubject} data-bs-dismiss="modal">
                  {t('teacherCommon.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;
