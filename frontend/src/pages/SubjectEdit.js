import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function SubjectEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const res = await api.get(`/subjects/${id}`);
        setName(res.data?.name || '');
      } catch (e) {
        setError('Не удалось загрузить предмет для редактирования');
      }
    };

    load();
  }, [id]);

  const save = async () => {
    if (!name.trim()) {
      alert('Введите название предмета');
      return;
    }

    await api.put(`/subjects/${id}`, { name: name.trim() });
    navigate(`/subjects/${id}`);
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0"><i className="fas fa-book-open me-1"></i>Редактирование предмета</h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to={`/subjects/${id}`}>Отмена</Link>
          <button className="btn btn-primary" onClick={save}>Сохранить</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          <label className="form-label">Название *</label>
          <input
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Математика"
          />
        </div>
      </div>
    </div>
  );
}

export default SubjectEdit;
