import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function ClassEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const [allSubjects, setAllSubjects] = useState([]);
  const [subjectIds, setSubjectIds] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');

        const [classRes, subjectsRes] = await Promise.all([
          api.get(`/classes/${id}`),
          api.get('/subjects')
        ]);

        const cls = classRes.data;
        setName(cls?.name || '');

        // subjects может прийти как массив ObjectId или как populate-объекты — поддержим оба случая
        const subjIds = (cls?.subjects || [])
          .map((s) => (typeof s === 'string' ? s : s?._id))
          .filter(Boolean);

        setSubjectIds(subjIds);
        setAllSubjects(subjectsRes.data || []);
      } catch (e) {
        setError('Не удалось загрузить класс для редактирования');
      }
    };

    load();
  }, [id]);

  const onSubjectsChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSubjectIds(selected);
  };

  const save = async () => {
    if (!name.trim()) {
      alert('Введите название класса');
      return;
    }

    await api.put(`/classes/${id}`, {
      name: name.trim(),
      subjects: subjectIds
    });

    navigate(`/classes/${id}`);
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          <i className="fas fa-book me-1"></i>
          Редактирование класса
        </h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to={`/classes/${id}`}>
            Отмена
          </Link>
          <button className="btn btn-primary" onClick={save}>
            Сохранить
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Название *</label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: 10-А"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Предметы (опционально)</label>
              <select
                className="form-select"
                multiple
                value={subjectIds}
                onChange={onSubjectsChange}
                style={{ minHeight: 160 }}
              >
                {allSubjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <div className="text-muted mt-1" style={{ fontSize: 14 }}>
                Можно выбрать несколько (Ctrl/Command + клик).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassEdit;
