import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const emptyParent = () => ({ fullName: '', phone: '', type: 'Мама', workplace: '' });

function StudentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  // поля
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('Активный');

  const [photo, setPhoto] = useState(null);
  const photoInputRef = useRef(null);

  const [parents, setParents] = useState([emptyParent()]);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [studentRes, classesRes] = await Promise.all([
          api.get(`/students/${id}`),
          api.get('/classes')
        ]);

        const s = studentRes.data;
        setClasses(classesRes.data);

        setFullName(s.fullName || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setAddress(s.address || '');
        setBirthDate(s.birthDate ? String(s.birthDate).slice(0, 10) : '');
        setClassId(s.class?._id || '');
        setStatus(s.status || 'Активный');
        setParents(s.parents?.length ? s.parents : [emptyParent()]);
      } catch (e) {
        setError('Не удалось загрузить данные для редактирования');
      }
    };

    load();
  }, [id]);

  const addParent = () => setParents(prev => [...prev, emptyParent()]);
  const removeParent = (index) => {
    setParents(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [emptyParent()];
    });
  };
  const updateParent = (index, field, value) => {
    setParents(prev => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const save = async () => {
    if (!fullName.trim()) return alert('Введите ФИО');
    if (!classId) return alert('Выберите класс');

    const parentsPayload = parents
      .map(p => ({
        fullName: (p.fullName || '').trim(),
        phone: (p.phone || '').trim(),
        type: p.type || 'Другой',
        workplace: (p.workplace || '').trim()
      }))
      .filter(p => p.fullName.length > 0);

    const formData = new FormData();
    formData.append('fullName', fullName.trim());
    formData.append('phone', phone.trim());
    formData.append('email', email.trim());
    formData.append('address', address.trim());
    formData.append('birthDate', birthDate || '');
    formData.append('class', classId);
    formData.append('status', status);
    formData.append('parents', JSON.stringify(parentsPayload));
    if (photo) formData.append('photo', photo);

    await api.put(`/students/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // очистим input файла
    setPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = '';

    navigate(`/students/${id}`);
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0"><i className="fas fa-user-graduate me-1"></i>Редактирование ученика</h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to={`/students/${id}`}>Отмена</Link>
          <button className="btn btn-primary" onClick={save}>Сохранить</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">ФИО *</label>
              <input className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="col-md-6">
              <label className="form-label">Класс *</label>
              <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Выберите класс</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
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

            <div className="col-md-6">
              <label className="form-label">Статус</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Активный">Активный</option>
                <option value="Не активный">Не активный</option>
                <option value="Академический отпуск">Академический отпуск</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label"><i className="fa-regular fa-calendar-days me-1"></i>Дата рождения</label>
              <input type="date" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>

            <div className="col-md-4">
              <label className="form-label"><i className="fa-solid fa-phone me-1"></i>Телефон</label>
              <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="col-md-4">
              <label className="form-label"><i className="fa-solid fa-envelope me-1"></i>Email</label>
              <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="col-md-12">
              <label className="form-label"><i className="fa-solid fa-map-location me-1"></i>Адрес</label>
              <input className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="col-12">
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0"><i className="fa-solid fa-person-breastfeeding"></i>Родители</h6>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={addParent}>
                  + Добавить родителя
                </button>
              </div>
            </div>

            {parents.map((p, idx) => (
              <div className="col-12" key={idx}>
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Родитель #{idx + 1}</strong>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeParent(idx)}>
                        Удалить
                      </button>
                    </div>

                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label">ФИО</label>
                        <input className="form-control" value={p.fullName} onChange={(e) => updateParent(idx, 'fullName', e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Телефон</label>
                        <input className="form-control" value={p.phone} onChange={(e) => updateParent(idx, 'phone', e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Тип</label>
                        <select className="form-select" value={p.type} onChange={(e) => updateParent(idx, 'type', e.target.value)}>
                          <option value="Мама">Мама</option>
                          <option value="Папа">Папа</option>
                          <option value="Бабушка">Бабушка</option>
                          <option value="Дедушка">Дедушка</option>
                          <option value="Другой">Другой</option>
                        </select>
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Место работы</label>
                        <input className="form-control" value={p.workplace} onChange={(e) => updateParent(idx, 'workplace', e.target.value)} />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentEdit;
