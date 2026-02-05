import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

function TeacherView() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');

        const [tRes, aRes] = await Promise.all([
          api.get(`/teachers/${id}`),
          api.get('/assignments')
        ]);

        setTeacher(tRes.data);

        // оставляем только назначения этого учителя
        const list = (aRes.data || []).filter(a => a.teacher?._id === id);
        setAssignments(list);
      } catch (e) {
        setError('Не удалось загрузить учителя');
      }
    };

    load();
  }, [id]);

  const totalHours = useMemo(() => {
    return (assignments || []).reduce((sum, a) => sum + (Number(a.hours) || 0), 0);
  }, [assignments]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!teacher) return <div className="text-muted">Загрузка...</div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0"><i className="fas fa-chalkboard-teacher me-1"></i>Учитель</h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/teachers"><i className="fa-solid fa-chevron-left me-1"></i>Назад</Link>
          <Link className="btn btn-primary" to={`/teachers/${id}/edit`}><i className="fa-solid fa-pen me-1"></i>Редактировать</Link>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center">
            {teacher.photo ? (
              <img
                src={`http://localhost:5000${teacher.photo}`}
                alt=""
                style={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: '10%',
                  marginRight: 16,
                  verticalAlign: 'middle'
                }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '10%',
                  background: '#eee',
                  color: '#bbb',
                  marginRight: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  verticalAlign: 'middle',
                  fontSize: 32
                }}
              >
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
            )}

            <div className="flex-grow-1">
              <h3 className="mb-1">{teacher.fullName}</h3>
              <div className="text-muted">
                Статус: {teacher.status || '-'} • Всего часов: <i className="fa-regular fa-clock me-1"></i>{totalHours}
              </div>
            </div>
          </div>

          <hr />

          <div className="row g-3">
            <div className="col-md-4">
              <div className="text-muted"><i className="fa-solid fa-phone me-1"></i>Телефон</div>
              <div>
                {teacher.phone ? (
                  <a
                    className="text-decoration-none"
                    href={`tel:${teacher.phone}`}>{teacher.phone}</a>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-muted"><i className="fa-solid fa-envelope me-1"></i>Email</div>
              <div>
                {teacher.email ? (
                  <a
                    className="text-decoration-none"
                    href={`mailto:${teacher.email}`}
                  >
                    {teacher.email}
                  </a>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-muted"><i className="fa-regular fa-calendar-days me-1"></i>Дата рождения</div>
              <div>{teacher.birthDate ? new Date(teacher.birthDate).toLocaleDateString() : '-'}</div>
            </div>
            <div className="col-md-12">
              <div className="text-muted"><i className="fa-solid fa-map-location me-1"></i>Адрес</div>
              <div>{teacher.address || '-'}</div>
            </div>
          </div>

          <hr />

          <h5 className="mb-2"><i className="fas fa-tasks me-1"></i>Назначения</h5>

          {assignments.length ? (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th
                      className="p-3 text-center"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="fas fa-book me-1"></i>
                      Класс
                    </th>

                    <th
                      className="p-3"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="fas fa-book-open me-1"></i>
                      Предмет
                    </th>

                    <th
                      className="p-3 text-center"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="fa-regular fa-clock me-1"></i>
                      Часы
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a._id}>
                      <td className="text-center">
                        {a.class ? (
                          <Link to={`/classes/${a.class._id}`} className="text-decoration-none">
                            {a.class.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td>
                        {a.subject ? (
                          <Link to={`/subjects/${a.subject._id}`} className="text-decoration-none">
                            {a.subject.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="text-center">
                        {a.hours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted">Назначений нет</div>
          )}

          {teacher.subjects?.length ? (
            <>
              <hr />
              <h5 className="mb-2">Предметы (из профиля)</h5>
              <div className="d-flex flex-wrap gap-2">
                {teacher.subjects.map(s => (
                  <span key={s._id} className="badge bg-secondary">
                    {s.name}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default TeacherView;
