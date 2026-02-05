import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function AssignmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState('');

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // поля формы
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
          api.get('/subjects')
        ]);

        setTeachers(tRes.data);
        setClasses(cRes.data);
        setSubjects(sRes.data);

        const found = (asgRes.data || []).find(a => a._id === id);
        if (!found) {
          setError('Назначение не найдено');
          return;
        }

        setTeacherId(found.teacher?._id || '');
        setClassId(found.class?._id || '');
        setSubjectId(found.subject?._id || '');
        setHours(String(found.hours ?? ''));
      } catch (e) {
        setError('Не удалось загрузить данные для редактирования');
      }
    };

    load();
  }, [id]);

  const save = async () => {
    if (!teacherId || !classId || !subjectId) {
      alert('Выберите учителя, класс и предмет');
      return;
    }

    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0) {
      alert('Введите корректное количество часов');
      return;
    }

    await api.put(`/assignments/${id}`, {
      teacher: teacherId,
      class: classId,
      subject: subjectId,
      hours: h
    });

    navigate(`/assignments/${id}`);
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0"><i className="fas fa-tasks me-1"></i>Редактирование назначения</h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to={`/assignments/${id}`}>
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
              <label className="form-label">Учитель *</label>
              <select
                className="form-select"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                <option value="">Выберите учителя</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Класс *</label>
              <select
                className="form-select"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Выберите класс</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Предмет *</label>
              <select
                className="form-select"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">Выберите предмет</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Часы *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Например: 6"
              />
            </div>

            <div className="col-12">
              <div className="text-muted" style={{ fontSize: 14 }}>
                Назначение связывает учителя, класс и предмет и задаёт количество часов.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignmentEdit;
