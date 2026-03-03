import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { pickLocalI18n, studentViewLocalI18n, useI18n } from '../i18n/I18nContext';

function StudentView() {
  const { ready, user } = useAuth();
  const { language } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';
  const tr = pickLocalI18n(studentViewLocalI18n, language);

  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [performanceRows, setPerformanceRows] = useState([]);
  const [performancePeriod, setPerformancePeriod] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;

    const load = async () => {
      try {
        setError('');

        const [res, ayRes] = await Promise.all([
          api.get(`/students/${id}`),
          api.get('/system-settings/academic-year').catch(() => ({ data: null })),
        ]);
        setStudent(res.data);

        const firstSemesterYear = Number(ayRes?.data?.firstSemesterYear);
        const secondSemesterYear = Number(ayRes?.data?.secondSemesterYear);
        const period =
          Number.isInteger(firstSemesterYear) && Number.isInteger(secondSemesterYear)
            ? `${firstSemesterYear}-${secondSemesterYear}`
            : '';

        const perf = await api.get(`/students/${id}/performance`, period ? { params: { period } } : undefined);
        setPerformanceRows(Array.isArray(perf.data?.rows) ? perf.data.rows : []);
        setPerformancePeriod(perf.data?.period || period || '');
      } catch (e) {
        const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : tr.networkError);
        setError(tr.loadFailed.replace('{msg}', msg));
      }
    };

    load();
  }, [id, ready, tr.loadFailed, tr.networkError]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!ready) return <div className="text-muted">{tr.loading}</div>;
  if (!student) return <div className="text-muted">{tr.loading}</div>;

  const fmtValue = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0"><i className="fas fa-user-graduate me-1"></i>{tr.title}</h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/students"><i className="fa-solid fa-chevron-left me-1"></i>{tr.back}</Link>
          {isAdmin && (
            <Link className="btn btn-primary" to={`/students/${id}/edit`}>
              <i className="fa-solid fa-pen me-1"></i>{tr.edit}
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            {student.photo ? (
              <img src={getFileUrl(student.photo)} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '10%', marginRight: 16, verticalAlign: 'middle' }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '10%', background: '#eee', color: '#bbb', marginRight: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle', fontSize: 32 }}>
                <i className="fas fa-user-graduate"></i>
              </div>
            )}

            <div>
              <h3 className="mb-1">{student.fullName}</h3>
              <div className="text-muted">
                <i className="fas fa-book me-1"></i>{tr.class}:{' '}
                {student.class ? <Link to={`/classes/${student.class._id}`} className="text-decoration-none">{student.class.name}</Link> : '-'}{' '}
                | {tr.status}: {student.status || '-'}
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-4"><div className="text-muted"><i className="fa-solid fa-phone me-1"></i>{tr.phone}</div><div>{student.phone ? <a className="text-decoration-none" href={`tel:${student.phone}`}>{student.phone}</a> : <span>-</span>}</div></div>
            <div className="col-md-4"><div className="text-muted"><i className="fa-solid fa-envelope me-1"></i>{tr.email}</div><div>{student.email ? <a className="text-decoration-none" href={`mailto:${student.email}`}>{student.email}</a> : <span>-</span>}</div></div>
            <div className="col-md-4"><div className="text-muted"><i className="fa-regular fa-calendar-days me-1"></i>{tr.birthDate}</div><div>{student.birthDate ? new Date(student.birthDate).toLocaleDateString() : '-'}</div></div>
            <div className="col-md-12"><div className="text-muted"><i className="fa-solid fa-map-location me-1"></i>{tr.address}</div><div>{student.address || '-'}</div></div>
          </div>

          <hr />

          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0"><i className="fa-solid fa-chart-column me-1"></i>{tr.performance}</h5>
            <div className="text-muted">{tr.period}: {performancePeriod || '-'}</div>
          </div>

          {performanceRows.length ? (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th>{tr.subject}</th>
                    <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{tr.exam}</th>
                    <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{tr.semester1}</th>
                    <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{tr.semester2}</th>
                    <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{tr.year}</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceRows.map((row) => (
                    <tr key={row.subjectId}>
                      <td><Link className="text-decoration-none" to={`/subjects/${row.subjectId}`}>{row.subjectName}</Link></td>
                      <td className="text-center">{fmtValue(row.exam)}</td>
                      <td className="text-center">{fmtValue(row.semester1)}</td>
                      <td className="text-center">{fmtValue(row.semester2)}</td>
                      <td className="text-center">{fmtValue(row.year)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted">{tr.noPerformance}</div>
          )}

          <hr />

          <h5><i className="fa-solid fa-person-breastfeeding"></i>{tr.parents}</h5>

          {student.parents?.length ? (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th>{tr.fullName}</th>
                    <th style={{ width: '18%' }}>{tr.phone}</th>
                    <th style={{ width: '14%' }}>{tr.type}</th>
                    <th>{tr.workplace}</th>
                  </tr>
                </thead>
                <tbody>
                  {student.parents.map((p, idx) => (
                    <tr key={idx}>
                      <td>{p.fullName || '-'}</td>
                      <td>{p.phone ? <a className="text-decoration-none" href={`tel:${p.phone}`}>{p.phone}</a> : <span>-</span>}</td>
                      <td>{p.type || '-'}</td>
                      <td>{p.workplace || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted">{tr.noParents}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentView;
