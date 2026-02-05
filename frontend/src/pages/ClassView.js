import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

function ClassView() {
  const { id } = useParams();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'ru', { sensitivity: 'base' }));
  }, [students]);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [classRes, studentsRes] = await Promise.all([
          api.get(`/classes/${id}`),
          api.get('/students')
        ]);

        setCls(classRes.data);

        // показываем учеников этого класса
        const list = (studentsRes.data || []).filter((s) => s.class?._id === id);
        setStudents(list);
      } catch (e) {
        setError('Не удалось загрузить класс');
      }
    };

    load();
  }, [id]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!cls) return <div className="text-muted">Загрузка...</div>;

  const subjects = Array.isArray(cls.subjects) ? cls.subjects : [];

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          <i className="fas fa-book me-1"></i>
          {cls.name} Класс
        </h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/classes">
            <i className="fa-solid fa-chevron-left me-1"></i>
            Назад
          </Link>
          <Link className="btn btn-primary" to={`/classes/${id}/edit`}>
            <i className="fa-solid fa-pen me-1"></i>
            Редактировать
          </Link>
        </div>
      </div>

      {/* Предметы класса */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="mb-2">
            <i className="fas fa-book-open me-1"></i>
            Предметы класса
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
            <div className="text-muted">Предметы для этого класса не назначены</div>
          )}
        </div>
      </div>

      {/* Ученики класса */}
      <div className="card">
        <div className="card-body">
          <h5 className="mb-2">
            <i className="fas fa-user-graduate me-1"></i>
            Учеников класса: {students.length}
          </h5>

          {students.length ? (
            <div className="table-responsive">
              <table className="table table-bordered align-middle table-hover">
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                      №
                    </th>
                    <th>ФИО</th>
                    <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((s, idx) => (
                    <tr key={s._id}>
                      <td className="text-center">{idx + 1}</td>
                      <td>
                        <Link to={`/students/${s._id}`} className="text-decoration-none">
                          {s.fullName}
                        </Link>
                      </td>
                      <td className="text-center">{s.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted">В этом классе пока нет учеников</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassView;
