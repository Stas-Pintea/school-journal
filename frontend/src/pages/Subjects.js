import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

function Subjects() {
  const [subjects, setSubjects] = useState([]);

  // поля модалки
  const [name, setName] = useState('');

  const total = useMemo(() => subjects.length, [subjects]);

  const loadSubjects = async () => {
    const res = await api.get('/subjects');
    setSubjects(res.data);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const resetForm = () => {
    setName('');
  };

  const createSubject = async () => {
    if (!name.trim()) {
      alert('Введите название предмета');
      return;
    }

    await api.post('/subjects', { name: name.trim() });
    resetForm();
    loadSubjects();
  };

  const deleteSubject = async (id) => {
    await api.delete(`/subjects/${id}`);
    loadSubjects();
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0"><i className="fas fa-book-open me-1"></i>Предметы</h1>
          <div className="text-muted">Общее количество: {total}</div>
        </div>

        <button
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#addSubjectModal"
        >
          + Добавить предмет
        </button>
      </div>
      <div className="table-responsive">  
        <table className="table table-bordered align-middle table-hover">
          <thead>
            <tr>
              <th>Название</th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td className="text-end">
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                    <Link to={`/subjects/${s._id}`} className="btn btn-outline-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} >
                      <i className="fa-solid fa-eye me-1"></i>
                      Открыть
                    </Link>

                    <Link to={`/subjects/${s._id}/edit`} className="btn btn-outline-primary btn-sm" style={{ whiteSpace: 'nowrap' }} >
                      <i className="fa-solid fa-pen me-1"></i>
                      Редактировать
                    </Link>

                    <button className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => deleteSubject(s._id)}>
                      <i className="fa-solid fa-xmark me-1"></i>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {subjects.length === 0 && (
              <tr>
                <td colSpan="2" className="text-center text-muted">
                  Пока нет предметов
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* МОДАЛЬНОЕ ОКНО — ТОЛЬКО ДЛЯ ПРЕДМЕТОВ */}
      <div className="modal fade" id="addSubjectModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Добавить предмет</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={resetForm}
              ></button>
            </div>

            <div className="modal-body">
              <label className="form-label">Название *</label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Математика"
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
                onClick={resetForm}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={createSubject}
                data-bs-dismiss="modal"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Subjects;
