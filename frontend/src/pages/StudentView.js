import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function StudentView() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const res = await api.get(`/students/${id}`);
        setStudent(res.data);
      } catch (e) {
        setError('Не удалось загрузить ученика');
      }
    };
    load();
  }, [id]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!student) return <div className="text-muted">Загрузка...</div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0"><i className="fas fa-user-graduate me-1"></i>Ученик</h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/students"><i className="fa-solid fa-chevron-left me-1"></i>Назад</Link>
          <Link className="btn btn-primary" to={`/students/${id}/edit`}><i className="fa-solid fa-pen me-1"></i>Редактировать</Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            {student.photo ? (
              <img
                src={`http://localhost:5000${student.photo}`}
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
                <i className="fas fa-user-graduate"></i>
              </div>
            )}

            <div>
              <h3 className="mb-1">{student.fullName}</h3>
              <div className="text-muted">
                <i className="fas fa-book me-1"></i>Класс:{' '} {student.class ? (
                <Link to={`/classes/${student.class._id}`} className="text-decoration-none">
                  {student.class.name}
                </Link>
                ) : (   '-' )} {' '} • Статус: {student.status || '-'}
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <div className="text-muted">
                <i className="fa-solid fa-phone me-1"></i>
                Телефон
              </div>
              <div>
                {student.phone ? (
                  <a
                    className="text-decoration-none"
                    href={`tel:${student.phone}`}
                  >
                    {student.phone}
                  </a>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>

            <div className="col-md-4">
              <div className="text-muted">
                <i className="fa-solid fa-envelope me-1"></i>
                Email
              </div>
              <div>
                {student.email ? (
                  <a
                    className="text-decoration-none"
                    href={`mailto:${student.email}`}
                  >
                    {student.email}
                  </a>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-muted"><i className="fa-regular fa-calendar-days me-1"></i>Дата рождения</div>
              <div>{student.birthDate ? new Date(student.birthDate).toLocaleDateString() : '-'}</div>
            </div>
            <div className="col-md-12">
              <div className="text-muted"><i className="fa-solid fa-map-location me-1"></i>Адрес</div>
              <div>{student.address || '-'}</div>
            </div>
          </div>

          <hr />

          <h5><i className="fa-solid fa-person-breastfeeding"></i>Родители</h5>
          {student.parents?.length ? (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th style={{ width: '18%' }}>Телефон</th>
                    <th style={{ width: '14%' }}>Тип</th>
                    <th>Место работы</th>
                  </tr>
                </thead>
                <tbody>
                  {student.parents.map((p, idx) => (
                    <tr key={idx}>
                      <td>{p.fullName || '-'}</td>
                      <td>
                        {p.phone ? (
                          <a
                            className="text-decoration-none"
                            href={`tel:${p.phone}`}
                          >
                            {p.phone}
                          </a>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td>{p.type || '-'}</td>
                      <td>{p.workplace || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted">Родители не указаны</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentView;
