import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { assignmentViewLocalI18n, pickLocalI18n, useI18n } from '../i18n/I18nContext';
import { useAuth } from '../auth/AuthContext';

function AssignmentView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { language } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';
  const tr = pickLocalI18n(assignmentViewLocalI18n, language);

  const [assignment, setAssignment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const res = await api.get('/assignments');
        const found = (res.data || []).find((a) => a._id === id);
        if (!found) {
          setError(tr.notFound);
          setAssignment(null);
          return;
        }
        setAssignment(found);
      } catch {
        setError(tr.loadFailed);
      }
    };

    load();
  }, [id, tr.loadFailed, tr.notFound]);

  const title = useMemo(() => {
    if (!assignment) return '';
    const t = assignment.teacher?.fullName || '-';
    const c = assignment.class?.name || '-';
    const s = assignment.subject?.name || '-';
    return `${t} | ${c} | ${s}`;
  }, [assignment]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!assignment) return <div className="text-muted">{tr.loading}</div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          <i className="fas fa-tasks me-1"></i>
          {tr.title}
        </h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/assignments">
            <i className="fa-solid fa-chevron-left me-1"></i>
            {tr.back}
          </Link>
          {isAdmin && (
            <Link className="btn btn-primary" to={`/assignments/${id}/edit`}>
              <i className="fa-solid fa-pen me-1"></i>
              {tr.edit}
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h4 className="mb-2">{title}</h4>

          <div className="row g-3">
            <div className="col-md-4">
              <div className="text-muted">{tr.teacher}</div>
              {assignment.teacher?._id ? (
                <Link to={`/teachers/${assignment.teacher._id}`} className="text-decoration-none">
                  {assignment.teacher.fullName}
                </Link>
              ) : (
                <div>-</div>
              )}
            </div>

            <div className="col-md-4">
              <div className="text-muted">{tr.class}</div>
              {assignment.class?._id ? (
                <Link to={`/classes/${assignment.class._id}`} className="text-decoration-none">
                  {assignment.class.name}
                </Link>
              ) : (
                <div>-</div>
              )}
            </div>

            <div className="col-md-4">
              <div className="text-muted">{tr.subject}</div>
              {assignment.subject?._id ? (
                <Link to={`/subjects/${assignment.subject._id}`} className="text-decoration-none">
                  {assignment.subject.name}
                </Link>
              ) : (
                <div>-</div>
              )}
            </div>

            <div className="col-md-4">
              <div className="text-muted">{tr.hours}</div>
              <div>{assignment.hours}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignmentView;
