import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function TeacherView() {
  const { ready, user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';

  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;

    const load = async () => {
      try {
        setError('');
        const [tRes, aRes] = await Promise.all([api.get(`/teachers/${id}`), api.get('/assignments')]);
        setTeacher(tRes.data);
        setAssignments((aRes.data || []).filter((a) => a.teacher?._id === id));
      } catch (e) {
        const msg =
          e.response?.data?.message ||
          (e.response?.status ? `HTTP ${e.response.status}` : t('teacherCommon.networkError'));
        setError(t('teacherView.loadFailed', { msg }));
      }
    };

    load();
  }, [id, ready, t]);

  const totalHours = useMemo(() => (assignments || []).reduce((sum, a) => sum + (Number(a.hours) || 0), 0), [assignments]);
  const canEdit = isAdmin;

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!ready || !teacher) return <div className="text-muted">{t('teacherCommon.loading')}</div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          <i className="fas fa-chalkboard-teacher me-1"></i>
          {t('teacherView.title')}
        </h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/teachers">
            <i className="fa-solid fa-chevron-left me-1"></i>
            {t('teacherView.back')}
          </Link>
          {canEdit && (
            <Link className="btn btn-primary" to={`/teachers/${id}/edit`}>
              <i className="fa-solid fa-pen me-1"></i>
              {t('teacherCommon.edit')}
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center">
            {teacher.photo ? (
              <img
                src={getFileUrl(teacher.photo)}
                alt=""
                style={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: '10%',
                  marginRight: 16,
                  verticalAlign: 'middle',
                }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '10%',
                  background: '#eee',
                  color: '#bbb',
                  marginRight: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  verticalAlign: 'middle',
                  fontSize: 32,
                }}
              >
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
            )}

            <div className="flex-grow-1">
              <h3 className="mb-1">{teacher.fullName}</h3>
              <div className="text-muted">
                {t('teacherView.statusTotal', { status: teacher.status || '-', hours: totalHours })}
              </div>
            </div>
          </div>

          <hr />

          <div className="row g-3">
            <div className="col-md-4">
              <div className="text-muted">
                <i className="fa-solid fa-phone me-1"></i>
                {t('teacherView.phone')}
              </div>
              <div>{teacher.phone || '-'}</div>
            </div>

            <div className="col-md-4">
              <div className="text-muted">
                <i className="fa-solid fa-envelope me-1"></i>
                {t('teacherView.email')}
              </div>
              <div>{teacher.email || '-'}</div>
            </div>

            <div className="col-md-4">
              <div className="text-muted">
                <i className="fa-regular fa-calendar-days me-1"></i>
                {t('teacherView.birthDate')}
              </div>
              <div>{teacher.birthDate ? new Date(teacher.birthDate).toLocaleDateString() : '-'}</div>
            </div>

            <div className="col-md-12">
              <div className="text-muted">
                <i className="fa-solid fa-map-location me-1"></i>
                {t('teacherView.address')}
              </div>
              <div>{teacher.address || '-'}</div>
            </div>
          </div>

          <hr />

          <h5 className="mb-2">{t('teacherView.assignments')}</h5>
          {assignments.length ? (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th className="text-center">{t('teacherView.class')}</th>
                    <th>{t('teacherView.subject')}</th>
                    <th className="text-center">{t('teacherView.hours')}</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a._id}>
                      <td className="text-center">
                        {a.class?._id ? (
                          <Link to={`/classes/${a.class._id}`} className="text-decoration-none">
                            {a.class.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {a.class?._id && a.subject?._id ? (
                          <Link to={`/journal/${a.class._id}/${a.subject._id}`} className="text-decoration-none">
                            {a.subject.name}
                          </Link>
                        ) : (
                          a.subject?.name || '-'
                        )}
                      </td>
                      <td className="text-center">{a.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted">{t('teacherView.noAssignments')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherView;
