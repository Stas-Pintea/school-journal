import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';
import { classViewLocalI18n, pickLocalI18n, useI18n } from '../i18n/I18nContext';
import { useAuth } from '../auth/AuthContext';

function ClassView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { language } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const tr = pickLocalI18n(classViewLocalI18n, language);

  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [allowedSubjectIds, setAllowedSubjectIds] = useState(null);
  const [performanceByStudent, setPerformanceByStudent] = useState({});
  const [performancePeriod, setPerformancePeriod] = useState('');
  const [error, setError] = useState('');

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) =>
      (a.fullName || '').localeCompare(b.fullName || '', language, { sensitivity: 'base' })
    );
  }, [students, language]);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [classRes, studentsRes, assignmentsRes, yearRes] = await Promise.all([
          api.get(`/classes/${id}`),
          api.get('/students'),
          isTeacher ? api.get('/assignments') : Promise.resolve({ data: [] }),
          api.get('/system-settings/academic-year').catch(() => ({ data: null })),
        ]);
        setCls(classRes.data);
        const list = (studentsRes.data || []).filter((s) => s.class?._id === id);
        setStudents(list);

        const firstSemesterYear = Number(yearRes?.data?.firstSemesterYear);
        const secondSemesterYear = Number(yearRes?.data?.secondSemesterYear);
        const period =
          Number.isInteger(firstSemesterYear) && Number.isInteger(secondSemesterYear)
            ? `${firstSemesterYear}-${secondSemesterYear}`
            : '';
        setPerformancePeriod(period);

        const perfEntries = await Promise.all(
          list.map(async (student) => {
            try {
              const perfRes = await api.get(
                `/students/${student._id}/performance`,
                period ? { params: { period } } : undefined
              );
              const rows = Array.isArray(perfRes.data?.rows) ? perfRes.data.rows : [];
              const bySubject = {};
              for (const r of rows) bySubject[String(r.subjectId)] = r;
              return [student._id, bySubject];
            } catch {
              return [student._id, {}];
            }
          })
        );
        setPerformanceByStudent(Object.fromEntries(perfEntries));

        if (isTeacher) {
          const teacherAssignments = (assignmentsRes.data || []).filter(
            (a) => a?.teacher?.user === user?.id && a?.class?._id === id && a?.subject?._id
          );
          setAllowedSubjectIds(new Set(teacherAssignments.map((a) => a.subject._id)));
        } else {
          setAllowedSubjectIds(null);
        }
      } catch {
        setError(tr.loadFailed);
      }
    };

    load();
  }, [id, tr.loadFailed, isTeacher, user?.id]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!cls) return <div className="text-muted">{tr.loading}</div>;

  const subjects = Array.isArray(cls.subjects)
    ? (isTeacher
      ? cls.subjects.filter((subj) => allowedSubjectIds?.has(subj?._id))
      : cls.subjects)
    : [];

  const getPerfValue = (studentId, subjectId, key) => {
    const row = performanceByStudent?.[studentId]?.[String(subjectId)];
    const val = row?.[key];
    return val === null || val === undefined || val === '' ? '-' : String(val);
  };

  return (
    <div className="class-view-page container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          <i className="fas fa-book me-1"></i>
          {cls.name} {tr.classSuffix}
        </h1>
        <div className="d-flex gap-2 print-hide">
          <Link className="btn btn-outline-secondary" to="/classes">
            <i className="fa-solid fa-chevron-left me-1"></i>
            {tr.back}
          </Link>
          <button className="btn btn-outline-dark" type="button" onClick={() => window.print()}>
            <i className="fa-solid fa-print me-1"></i>
            {tr.print}
          </button>
          {isAdmin && (
            <Link className="btn btn-primary" to={`/classes/${id}/edit`}>
              <i className="fa-solid fa-pen me-1"></i>
              {tr.edit}
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-3 class-view-section">
        <div className="card-body">
          <h5 className="mb-2">
            <i className="fas fa-book-open me-1"></i>
            {tr.classSubjects}
          </h5>

          {subjects.length ? (
            <div className="d-flex flex-wrap gap-2">
              {subjects.map((subj) => (
                <Link
                  key={subj._id}
                  to={`/journal/${id}/${subj._id}`}
                  className="badge bg-light text-dark border text-decoration-none"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <i className="fas fa-book-open me-1 text-muted"></i>
                  {subj.name}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-muted">{tr.noSubjects}</div>
          )}
        </div>
      </div>

      <div className="card class-view-section">
        <div className="card-body">
          <h5 className="mb-2">
            <i className="fas fa-user-graduate me-1"></i>
            {tr.classStudents}: {students.length}
          </h5>
          {performancePeriod && (
            <div className="text-muted mb-2" style={{ fontSize: 14 }}>
              {tr.periodLabel}: {performancePeriod}
            </div>
          )}

          {students.length ? (
            <div className="table-responsive">
              <table className="table table-bordered align-middle class-view-table">
                <thead>
                  <tr>
                    <th rowSpan={subjects.length ? 2 : 1} className="text-center">
                      #
                    </th>
                    <th rowSpan={subjects.length ? 2 : 1}>{tr.fullName}</th>
                    <th rowSpan={subjects.length ? 2 : 1} className="text-center">
                      {tr.status}
                    </th>
                    {subjects.map((subj) => (
                      <th key={`head-subj-${subj._id}`} className="text-center" colSpan={4}>
                        {subj.name}
                      </th>
                    ))}
                  </tr>
                  {subjects.length > 0 && (
                    <tr>
                      {subjects.map((subj) => (
                        <FragmentPerfHead key={`head-subj-sub-${subj._id}`} exam={tr.exam} semester1={tr.semester1} semester2={tr.semester2} year={tr.year} />
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {sortedStudents.map((s, idx) => (
                    <tr key={s._id}>
                      <td className="text-center">{idx + 1}</td>
                      <td>
                        {s.photo ? (
                          <img src={getFileUrl(s.photo)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '10%', marginRight: 10, verticalAlign: 'middle' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: '10%', background: '#eee', color: '#bbb', marginRight: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle' }}>
                            <i className="fas fa-user-graduate"></i>
                          </div>
                        )}
                        <Link to={`/students/${s._id}`} className="text-decoration-none">
                          {s.fullName}
                        </Link>
                      </td>
                      <td className="text-center">{s.status || '-'}</td>
                      {subjects.map((subj) => (
                        <FragmentPerfCell
                          key={`perf-${s._id}-${subj._id}`}
                          exam={getPerfValue(s._id, subj._id, 'exam')}
                          semester1={getPerfValue(s._id, subj._id, 'semester1')}
                          semester2={getPerfValue(s._id, subj._id, 'semester2')}
                          year={getPerfValue(s._id, subj._id, 'year')}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted">{tr.noStudents}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FragmentPerfHead({ exam, semester1, semester2, year }) {
  return (
    <>
      <th className="text-center">{exam}</th>
      <th className="text-center">{semester1}</th>
      <th className="text-center">{semester2}</th>
      <th className="text-center">{year}</th>
    </>
  );
}

function FragmentPerfCell({ exam, semester1, semester2, year }) {
  return (
    <>
      <td className="text-center">{exam}</td>
      <td className="text-center">{semester1}</td>
      <td className="text-center">{semester2}</td>
      <td className="text-center">{year}</td>
    </>
  );
}

export default ClassView;
