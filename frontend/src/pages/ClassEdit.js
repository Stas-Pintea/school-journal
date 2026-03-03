import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { classEditLocalI18n, pickLocalI18n, useI18n } from '../i18n/I18nContext';

function ClassEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useI18n();
  const tr = pickLocalI18n(classEditLocalI18n, language);

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjectIds, setSubjectIds] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [classRes, subjectsRes] = await Promise.all([api.get(`/classes/${id}`), api.get('/subjects')]);

        const cls = classRes.data;
        setName(cls?.name || '');
        const subjIds = (cls?.subjects || []).map((s) => (typeof s === 'string' ? s : s?._id)).filter(Boolean);
        setSubjectIds(subjIds);
        setAllSubjects(subjectsRes.data || []);
      } catch {
        setError(tr.loadFailed);
      }
    };

    load();
  }, [id, tr.loadFailed]);

  const toggleSubject = (subjectId) => {
    setSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const save = async () => {
    if (!name.trim()) {
      alert(tr.nameRequired);
      return;
    }

    await api.put(`/classes/${id}`, {
      name: name.trim(),
      subjects: subjectIds,
    });

    navigate(`/classes/${id}`);
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          <i className="fas fa-book me-1"></i>
          {tr.title}
        </h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to={`/classes/${id}`}>
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
              <label className="form-label">{tr.name}</label>
              <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr.namePh} />
            </div>

            <div className="col-md-6">
              <label className="form-label">{tr.subjects}</label>
              <div className="border rounded p-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {allSubjects.map((s) => (
                  <div className="form-check" key={s._id}>
                    <input
                      id={`edit-class-subject-${s._id}`}
                      className="form-check-input"
                      type="checkbox"
                      checked={subjectIds.includes(s._id)}
                      onChange={() => toggleSubject(s._id)}
                    />
                    <label className="form-check-label" htmlFor={`edit-class-subject-${s._id}`}>
                      {s.name}
                    </label>
                  </div>
                ))}
                {allSubjects.length === 0 && (
                  <div className="text-muted" style={{ fontSize: 14 }}>
                    -
                  </div>
                )}
              </div>

              <div className="text-muted mt-1" style={{ fontSize: 14 }}>
                {tr.subjectsHint}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassEdit;
