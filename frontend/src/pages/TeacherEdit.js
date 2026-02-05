import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function TeacherEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState('');

  // поля
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [status, setStatus] = useState('Активный');

  // фото
  const [photo, setPhoto] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');

        const tRes = await api.get(`/teachers/${id}`);
        const t = tRes.data;

        setFullName(t.fullName || '');
        setPhone(t.phone || '');
        setEmail(t.email || '');
        setAddress(t.address || '');
        setBirthDate(t.birthDate ? String(t.birthDate).slice(0, 10) : '');
        setStatus(t.status || 'Активный');
      } catch (e) {
        setError('Не удалось загрузить данные для редактирования');
      }
    };

    load();
  }, [id]);

  const save = async () => {
    if (!fullName.trim()) {
      alert('Введите ФИО');
      return;
    }

    const formData = new FormData();
    formData.append('fullName', fullName.trim());
    formData.append('phone', phone.trim());
    formData.append('email', email.trim());
    formData.append('address', address.trim());
    formData.append('birthDate', birthDate || '');
    formData.append('status', status);

    if (photo) {
      formData.append('photo', photo);
    }

    await api.put(`/teachers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // очистим input файла
    setPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = '';

    navigate(`/teachers/${id}`);
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0"><i className="fas fa-chalkboard-teacher me-1"></i>Редактирование учителя</h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to={`/teachers/${id}`}>
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
              <label className="form-label">ФИО *</label>
              <input
                className="form-control"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Фото (замена)</label>
              <input
                ref={photoInputRef}
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label"><i className="fa-regular fa-calendar-days me-1"></i>Дата рождения</label>
              <input
                type="date"
                className="form-control"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label"><i className="fa-solid fa-phone me-1"></i>Телефон</label>
              <input
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label"><i className="fa-solid fa-envelope me-1"></i>Email</label>
              <input
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label"><i className="fa-solid fa-map-location me-1"></i>Адрес</label>
              <input
                className="form-control"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Статус</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Активный">Активный</option>
                <option value="Не активный">Не активный</option>
                <option value="Академический отпуск">Академический отпуск</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherEdit;
