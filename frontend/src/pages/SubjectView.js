import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { pickLocalI18n, subjectViewLocalI18n, useI18n } from '../i18n/I18nContext';
import { useAuth } from '../auth/AuthContext';

function SubjectView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { language } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';
  const tr = pickLocalI18n(subjectViewLocalI18n, language);

  const [subject, setSubject] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [subRes, asgRes] = await Promise.all([api.get(`/subjects/${id}`), api.get('/assignments')]);
        setSubject(subRes.data);
        const filtered = (asgRes.data || []).filter((a) => a.subject?._id === id);
        setAssignments(filtered);
      } catch {
        setError(tr.loadFailed);
      }
    };

    load();
  }, [id, tr.loadFailed]);

  const classesList = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (a.class?._id) map.set(a.class._id, a.class);
    });
    return Array.from(map.values()).sort((x, y) => (x.name || '').localeCompare(y.name || '', language));
  }, [assignments, language]);

  const teachersList = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (a.teacher?._id) map.set(a.teacher._id, a.teacher);
    });
    return Array.from(map.values()).sort((x, y) => (x.fullName || '').localeCompare(y.fullName || '', language));
  }, [assignments, language]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!subject) return <div className="text-muted">{tr.loading}</div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          <i className="fas fa-book-open me-1"></i>
          {tr.title}
        </h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/subjects">
            <i className="fa-solid fa-chevron-left me-1"></i>
            {tr.back}
          </Link>
          {isAdmin && (
            <Link className="btn btn-primary" to={`/subjects/${id}/edit`}>
              <i className="fa-solid fa-pen me-1"></i>
              {tr.edit}
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h3 className="mb-1">{subject.name}</h3>
          <div className="text-muted">
            {tr.assignments}: {assignments.length}
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="mb-2">{tr.classes}</h5>
              {classesList.length ? (
                <div className="d-flex flex-wrap gap-2">
                  {classesList.map((c) => (
                    <Link key={c._id} className="badge bg-secondary text-decoration-none" to={`/classes/${c._id}`}>
                      {c.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-muted">{tr.noClassAssigned}</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="mb-2">{tr.teachers}</h5>
              {teachersList.length ? (
                <div className="d-flex flex-wrap gap-2">
                  {teachersList.map((t) => (
                    <Link key={t._id} className="badge bg-primary text-decoration-none" to={`/teachers/${t._id}`}>
                      {t.fullName}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-muted">{tr.noTeacherAssigned}</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-2">{tr.assignmentDetails}</h5>

              {assignments.length ? (
                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead>
                      <tr>
                        <th style={{ width: '20%' }}>{tr.class}</th>
                        <th>{tr.teacher}</th>
                        <th style={{ width: '12%' }}>{tr.hours}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a._id}>
                          <td>{a.class?.name || '-'}</td>
                          <td>{a.teacher?.fullName || '-'}</td>
                          <td>{a.hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-muted">{tr.none}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectView;
