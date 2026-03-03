import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { assignmentEditLocalI18n, pickLocalI18n, useI18n } from '../i18n/I18nContext';

function AssignmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useI18n();
  const tr = pickLocalI18n(assignmentEditLocalI18n, language);

  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [hours, setHours] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [asgRes, tRes, cRes, sRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/teachers'),
          api.get('/classes'),
          api.get('/subjects'),
        ]);

        setTeachers(tRes.data || []);
        setClasses(cRes.data || []);
        setSubjects(sRes.data || []);

        const found = (asgRes.data || []).find((a) => a._id === id);
        if (!found) {
          setError(tr.notFound);
          return;
        }

        setTeacherId(found.teacher?._id || '');
        setClassId(found.class?._id || '');
        setSubjectId(found.subject?._id || '');
        setHours(String(found.hours ?? ''));
      } catch {
        setError(tr.loadFailed);
      }
    };

    load();
  }, [id, tr.loadFailed, tr.notFound]);

  const save = async () => {
    if (!teacherId || !classId || !subjectId) {
      alert(tr.chooseAll);
      return;
    }

    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0) {
      alert(tr.invalidHours);
      return;
    }

    await api.put(`/assignments/${id}`, {
      teacher: teacherId,
      class: classId,
      subject: subjectId,
      hours: h,
    });

    navigate(`/assignments/${id}`);
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          <i className="fas fa-tasks me-1"></i>
          {tr.title}
        </h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to={`/assignments/${id}`}>
            {tr.cancel}
          </Link>
          <button className="btn btn-primary" onClick={save}>
            {tr.save}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">{tr.teacher} *</label>
              <select className="form-select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">{tr.chooseTeacher}</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">{tr.class} *</label>
              <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">{tr.chooseClass}</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">{tr.subject} *</label>
              <select className="form-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">{tr.chooseSubject}</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">{tr.hours} *</label>
              <input type="number" min="1" className="form-control" value={hours} onChange={(e) => setHours(e.target.value)} placeholder={tr.hoursPh} />
            </div>

            <div className="col-12">
              <div className="text-muted" style={{ fontSize: 14 }}>
                {tr.hint}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignmentEdit;
