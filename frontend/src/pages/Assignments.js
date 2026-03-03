import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function Assignments() {
  const { ready, user } = useAuth();
  const { language, t } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';

  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');

  const [sortBy, setSortBy] = useState('teacher');
  const [sortDir, setSortDir] = useState('asc');

  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [hours, setHours] = useState('');

  const total = useMemo(() => assignments.length, [assignments]);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [a, tRes, c, s] = await Promise.all([
        api.get('/assignments'),
        api.get('/teachers'),
        api.get('/classes'),
        api.get('/subjects'),
      ]);

      setAssignments(a.data || []);
      setTeachers(tRes.data || []);
      setClasses(c.data || []);
      setSubjects(s.data || []);
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : t('common.networkError'));
      setError(t('assignments.loadFailed', { msg }));
    }
  }, [t]);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const resetForm = () => {
    setTeacherId('');
    setClassId('');
    setSubjectId('');
    setHours('');
  };

  const createAssignment = async () => {
    if (!isAdmin) return;

    if (!teacherId || !classId || !subjectId) {
      alert(t('assignments.chooseTeacherClassSubject'));
      return;
    }

    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0) {
      alert(t('assignments.invalidHours'));
      return;
    }

    try {
      await api.post('/assignments', {
        teacher: teacherId,
        class: classId,
        subject: subjectId,
        hours: h,
      });

      resetForm();
      loadData();
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : t('common.networkError'));
      setError(t('assignments.createFailed', { msg }));
    }
  };

  const deleteAssignment = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm(t('assignments.deleteConfirm'))) return;
    try {
      await api.delete(`/assignments/${id}`);
      loadData();
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : t('common.networkError'));
      setError(t('assignments.deleteFailed', { msg }));
    }
  };

  const missingAssignments = useMemo(() => {
    const existing = new Set(
      (assignments || [])
        .filter((a) => a?.class?._id && a?.subject?._id)
        .map((a) => `${a.class._id}|${a.subject._id}`)
    );

    const out = [];

    for (const c of classes || []) {
      const classSubjects = Array.isArray(c.subjects) ? c.subjects : [];
      for (const subj of classSubjects) {
        const sid = typeof subj === 'string' ? subj : subj?._id;
        const sname = typeof subj === 'string' ? subjects.find((x) => x._id === subj)?.name || '-' : subj?.name || '-';

        if (!c?._id || !sid) continue;

        const key = `${c._id}|${sid}`;
        if (existing.has(key)) continue;

        out.push({ key, classId: c._id, className: c.name || '-', subjectId: sid, subjectName: sname });
      }
    }

    out.sort((a, b) => {
      const c = (a.className || '').localeCompare(b.className || '', language, { numeric: true, sensitivity: 'base' });
      if (c !== 0) return c;
      return (a.subjectName || '').localeCompare(b.subjectName || '', language, { sensitivity: 'base' });
    });

    return out;
  }, [assignments, classes, subjects, language]);

  const prefillAndOpenModal = (cid, sid) => {
    setClassId(cid);
    setSubjectId(sid);
    setTeacherId('');
    setHours('');
  };

  const onSort = (field) => {
    if (sortBy === field) setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sortedAssignments = useMemo(() => {
    const arr = [...assignments];

    arr.sort((a, b) => {
      let cmp = 0;

      if (sortBy === 'teacher') {
        cmp = String(a.teacher?.fullName || '').localeCompare(String(b.teacher?.fullName || ''), language, {
          numeric: true,
          sensitivity: 'base',
        });
      }

      if (sortBy === 'class') {
        cmp = String(a.class?.name || '').localeCompare(String(b.class?.name || ''), language, {
          numeric: true,
          sensitivity: 'base',
        });
      }

      if (sortBy === 'subject') {
        cmp = String(a.subject?.name || '').localeCompare(String(b.subject?.name || ''), language, {
          numeric: true,
          sensitivity: 'base',
        });
      }

      if (sortBy === 'hours') {
        cmp = (Number(a.hours) || 0) - (Number(b.hours) || 0);
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [assignments, sortBy, sortDir, language]);

  if (!ready) return <div className="container py-4 text-muted">{t('common.loading')}</div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0">
            <i className="fas fa-tasks me-1"></i>{t('assignments.title')}
          </h1>
          <div className="text-muted">{t('assignments.total', { count: total })}</div>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addAssignmentModal" onClick={resetForm}>
            {t('assignments.add')}
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fa-solid fa-triangle-exclamation me-2 text-warning"></i>
              {t('assignments.needAssignments')}
            </h5>
            <div className="text-muted">{missingAssignments.length}</div>
          </div>

          <div className="text-muted mt-1" style={{ fontSize: 14 }}>
            {t('assignments.needAssignmentsHint')}
          </div>

          {missingAssignments.length ? (
            <div className="table-responsive mt-3">
              <table className="table table-bordered align-middle table-hover">
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>
                      <i className="fas fa-book me-1"></i>{t('assignments.class')}
                    </th>
                    <th style={{ whiteSpace: 'nowrap' }}>
                      <i className="fas fa-book-open me-1"></i>{t('assignments.subject')}
                    </th>
                    {isAdmin && <th className="text-end" style={{ width: 1, whiteSpace: 'nowrap' }}>{t('assignments.actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {missingAssignments.map((m) => (
                    <tr key={m.key}>
                      <td>
                        <Link to={`/classes/${m.classId}`} className="text-decoration-none">{m.className}</Link>
                      </td>
                      <td>
                        <Link to={`/subjects/${m.subjectId}`} className="text-decoration-none">{m.subjectName}</Link>
                      </td>
                      {isAdmin && (
                        <td className="text-end">
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ whiteSpace: 'nowrap' }}
                            data-bs-toggle="modal"
                            data-bs-target="#addAssignmentModal"
                            onClick={() => prefillAndOpenModal(m.classId, m.subjectId)}
                          >
                            <i className="fa-solid fa-plus me-1"></i>{t('assignments.add')}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted mt-3">{t('assignments.allAssigned')}</div>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover">
          <thead>
            <tr>
              <th role="button" className="user-select-none" style={{ whiteSpace: 'nowrap' }} onClick={() => onSort('teacher')}>
                <i className="fas fa-chalkboard-teacher me-1"></i>{t('assignments.teacher')}
              </th>
              <th role="button" className="text-center user-select-none" style={{ whiteSpace: 'nowrap' }} onClick={() => onSort('class')}>
                <i className="fas fa-book me-1"></i>{t('assignments.class')}
              </th>
              <th role="button" className="text-center user-select-none" style={{ whiteSpace: 'nowrap' }} onClick={() => onSort('subject')}>
                <i className="fas fa-book-open me-1"></i>{t('assignments.subject')}
              </th>
              <th role="button" className="text-center user-select-none" style={{ whiteSpace: 'nowrap' }} onClick={() => onSort('hours')}>
                <i className="fa-regular fa-clock me-1"></i>{t('assignments.hours')}
              </th>
              {isAdmin && <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{t('assignments.actions')}</th>}
            </tr>
          </thead>

          <tbody>
            {sortedAssignments.map((a) => (
              <tr key={a._id}>
                <td>{a.teacher ? <Link to={`/teachers/${a.teacher._id}`} className="text-decoration-none">{a.teacher.fullName}</Link> : '-'}</td>
                <td className="text-center">{a.class ? <Link to={`/classes/${a.class._id}`} className="text-decoration-none">{a.class.name}</Link> : '-'}</td>
                <td className="text-center">{a.subject ? <Link to={`/subjects/${a.subject._id}`} className="text-decoration-none">{a.subject.name}</Link> : '-'}</td>
                <td className="text-center">{a.hours}</td>

                {isAdmin && (
                  <td className="text-center">
                    <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                      <Link to={`/assignments/${a._id}`} className="btn btn-outline-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fa-solid fa-eye me-2"></i>{t('teacherCommon.open')}
                      </Link>
                      <Link to={`/assignments/${a._id}/edit`} className="btn btn-outline-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fa-solid fa-pen me-2"></i>{t('teacherCommon.edit')}
                      </Link>
                      <button className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => deleteAssignment(a._id)}>
                        <i className="fa-solid fa-trash me-2"></i>{t('teacherCommon.delete')}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {assignments.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="text-center text-muted">{t('assignments.none')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="modal fade" id="addAssignmentModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('assignments.modalTitle')}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetForm}></button>
              </div>

              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">{t('assignments.teacher')} *</label>
                  <select className="form-select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                    <option value="">{t('assignments.chooseTeacher')}</option>
                    {teachers.map((tt) => (
                      <option key={tt._id} value={tt._id}>{tt.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label">{t('assignments.class')} *</label>
                  <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
                    <option value="">{t('assignments.chooseClass')}</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label">{t('assignments.subject')} *</label>
                  <select className="form-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                    <option value="">{t('assignments.chooseSubject')}</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label">{t('assignments.hours')} *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder={t('assignments.hoursPlaceholder')}
                  />
                </div>

                <div className="text-muted" style={{ fontSize: 14 }}>{t('assignments.hint')}</div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={resetForm}>
                  {t('teacherCommon.cancel')}
                </button>
                <button type="button" className="btn btn-primary" onClick={createAssignment} data-bs-dismiss="modal">
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

export default Assignments;
