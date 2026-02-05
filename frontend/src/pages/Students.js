import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

function calcAge(birthDate) {
  if (!birthDate) return '';
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

const emptyParent = () => ({
  fullName: '',
  phone: '',
  type: 'Мама',
  workplace: ''
});

function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  // сортировка
  const [sortBy, setSortBy] = useState('fullName'); // 'class' | 'fullName' | 'age' | 'status'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  // поля ученика
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('Активный');

  // фото ученика
  const [photo, setPhoto] = useState(null);
  const photoInputRef = useRef(null); // ✅ фикс повторного выбора того же файла

  // родители
  const [parents, setParents] = useState([emptyParent()]);

  const total = useMemo(() => students.length, [students]);

  const loadData = async () => {
    const [studentsRes, classesRes] = await Promise.all([
      api.get('/students'),
      api.get('/classes')
    ]);
    setStudents(studentsRes.data);
    setClasses(classesRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setBirthDate('');
    setClassId('');
    setStatus('Активный');

    setPhoto(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }

    setParents([emptyParent()]);
  };

  const addParent = () => setParents((prev) => [...prev, emptyParent()]);

  const removeParent = (index) => {
    setParents((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [emptyParent()];
    });
  };

  const updateParent = (index, field, value) => {
    setParents((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // обработчик сортировки по клику
  const onSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sortedStudents = useMemo(() => {
    const arr = [...students];

    arr.sort((a, b) => {
      let cmp = 0;

      if (sortBy === 'class') {
        const an = (a.class?.name ?? '').toString();
        const bn = (b.class?.name ?? '').toString();
        cmp = an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' });
      }

      if (sortBy === 'fullName') {
        const an = (a.fullName ?? '').toString();
        const bn = (b.fullName ?? '').toString();
        cmp = an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' });
      }

      if (sortBy === 'age') {
        const ac = calcAge(a.birthDate);
        const bc = calcAge(b.birthDate);
        // пустые даты ('' ) отправим в конец
        const av = Number.isFinite(ac) ? ac : 9999;
        const bv = Number.isFinite(bc) ? bc : 9999;
        cmp = av - bv;
      }

      if (sortBy === 'status') {
        const an = (a.status ?? '').toString();
        const bn = (b.status ?? '').toString();
        cmp = an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' });
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [students, sortBy, sortDir]);

  const createStudent = async () => {
    if (!fullName.trim()) {
      alert('Введите ФИО');
      return;
    }
    if (!classId) {
      alert('Выберите класс');
      return;
    }

    const parentsPayload = parents
      .map((p) => ({
        fullName: (p.fullName || '').trim(),
        phone: (p.phone || '').trim(),
        type: p.type || 'Другой',
        workplace: (p.workplace || '').trim()
      }))
      .filter((p) => p.fullName.length > 0);

    const formData = new FormData();
    formData.append('fullName', fullName.trim());
    formData.append('phone', phone.trim());
    formData.append('email', email.trim());
    formData.append('address', address.trim());
    formData.append('birthDate', birthDate || '');
    formData.append('class', classId);
    formData.append('status', status);
    formData.append('parents', JSON.stringify(parentsPayload));

    if (photo) {
      formData.append('photo', photo);
    }

    await api.post('/students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    resetForm();
    loadData();
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('Удалить ученика?')) return;
    await api.delete(`/students/${id}`);
    loadData();
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0">
            <i className="fas fa-user-graduate me-1"></i>Ученики
          </h1>
          <div className="text-muted">Общее количество: {total}</div>
        </div>

        <button
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#addStudentModal"
        >
          + Добавить ученика
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover">
          <thead>
            <tr>
              <th
                role="button"
                className="text-center user-select-none"
                style={{ width: 1, whiteSpace: 'nowrap' }}
                onClick={() => onSort('class')}
                title="Сортировать по классу"
              >
                Класс
                {sortBy === 'class' && (
                  <i
                    className={`fa-solid ms-2 ${
                      sortDir === 'asc' ? 'fa-arrow-up-a-z' : 'fa-arrow-down-z-a'
                    }`}
                  ></i>
                )}
              </th>

              <th
                role="button"
                className="user-select-none"
                onClick={() => onSort('fullName')}
                title="Сортировать по ФИО"
              >
                ФИО
                {sortBy === 'fullName' && (
                  <i
                    className={`fa-solid ms-2 ${
                      sortDir === 'asc' ? 'fa-arrow-up-a-z' : 'fa-arrow-down-z-a'
                    }`}
                  ></i>
                )}
              </th>

              <th
                role="button"
                className="text-center user-select-none"
                style={{ width: 1, whiteSpace: 'nowrap' }}
                onClick={() => onSort('age')}
                title="Сортировать по возрасту"
              >
                Возраст
                {sortBy === 'age' && (
                  <i
                    className={`fa-solid ms-2 ${
                      sortDir === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'
                    }`}
                  ></i>
                )}
              </th>

              <th
                role="button"
                className="text-center user-select-none"
                style={{ width: 1, whiteSpace: 'nowrap' }}
                onClick={() => onSort('status')}
                title="Сортировать по статусу"
              >
                Статус
                {sortBy === 'status' && (
                  <i
                    className={`fa-solid ms-2 ${
                      sortDir === 'asc' ? 'fa-arrow-up-a-z' : 'fa-arrow-down-z-a'
                    }`}
                  ></i>
                )}
              </th>

              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                Действия
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedStudents.map((s) => (
              <tr key={s._id}>
                <td className="text-center">
                  {s.class ? (
                    <b>
                      <Link to={`/classes/${s.class._id}`} className="text-decoration-none">
                        {s.class.name}
                      </Link>
                    </b>
                  ) : (
                    '-'
                  )}
                </td>

                <td>
                  {s.photo ? (
                    <img
                      src={`http://localhost:5000${s.photo}`}
                      alt=""
                      style={{
                        width: 36,
                        height: 36,
                        objectFit: 'cover',
                        borderRadius: '10%',
                        marginRight: 10,
                        verticalAlign: 'middle'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10%',
                        background: '#eee',
                        color: '#bbb',
                        marginRight: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        verticalAlign: 'middle'
                      }}
                    >
                      <i className="fas fa-user-graduate"></i>
                    </div>
                  )}
                  {s.fullName}
                </td>

                <td className="text-center">{calcAge(s.birthDate) || '-'}</td>
                <td className="text-center">{s.status || '-'}</td>

                <td className="text-end">
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                    <Link
                      to={`/students/${s._id}`}
                      className="btn btn-outline-secondary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="fa-solid fa-eye me-1"></i>
                      Открыть
                    </Link>

                    <Link
                      to={`/students/${s._id}/edit`}
                      className="btn btn-outline-primary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="fa-solid fa-pen me-1"></i>
                      Редактировать
                    </Link>

                    <button
                      className="btn btn-danger btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => deleteStudent(s._id)}
                    >
                      <i className="fa-solid fa-xmark me-1"></i>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  Пока нет учеников
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* МОДАЛЬНОЕ ОКНО — ТОЛЬКО ДЛЯ УЧЕНИКОВ */}
      <div className="modal fade" id="addStudentModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Добавить ученика</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={resetForm}
              ></button>
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">ФИО *</label>
                  <input
                    className="form-control"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Класс *</label>
                  <select
                    className="form-select"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    <option value="">Выберите класс</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Фото</label>
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

                <div className="col-md-4">
                  <label className="form-label">Дата рождения</label>
                  <input
                    type="date"
                    className="form-control"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Телефон</label>
                  <input
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+373..."
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mail@example.com"
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label">Адрес</label>
                  <input
                    className="form-control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Город, улица, дом..."
                  />
                </div>

                <div className="col-12">
                  <hr />
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Родители</h6>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={addParent}
                    >
                      + Добавить родителя
                    </button>
                  </div>
                  <div className="text-muted mt-1" style={{ fontSize: 14 }}>
                    Заполни ФИО — тогда родитель сохранится. Пустые блоки не отправляются.
                  </div>
                </div>

                {parents.map((p, idx) => (
                  <div className="col-12" key={idx}>
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong>Родитель #{idx + 1}</strong>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeParent(idx)}
                          >
                            Удалить
                          </button>
                        </div>

                        <div className="row g-2">
                          <div className="col-md-6">
                            <label className="form-label">ФИО</label>
                            <input
                              className="form-control"
                              value={p.fullName}
                              onChange={(e) => updateParent(idx, 'fullName', e.target.value)}
                            />
                          </div>

                          <div className="col-md-3">
                            <label className="form-label">Телефон</label>
                            <input
                              className="form-control"
                              value={p.phone}
                              onChange={(e) => updateParent(idx, 'phone', e.target.value)}
                            />
                          </div>

                          <div className="col-md-3">
                            <label className="form-label">Тип</label>
                            <select
                              className="form-select"
                              value={p.type}
                              onChange={(e) => updateParent(idx, 'type', e.target.value)}
                            >
                              <option value="Мама">Мама</option>
                              <option value="Папа">Папа</option>
                              <option value="Бабушка">Бабушка</option>
                              <option value="Дедушка">Дедушка</option>
                              <option value="Другой">Другой</option>
                            </select>
                          </div>

                          <div className="col-md-12">
                            <label className="form-label">Место работы</label>
                            <input
                              className="form-control"
                              value={p.workplace}
                              onChange={(e) => updateParent(idx, 'workplace', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                onClick={createStudent}
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

export default Students;
