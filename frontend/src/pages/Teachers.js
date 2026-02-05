import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // сортировка
  const [sortBy, setSortBy] = useState('fullName'); // 'fullName' | 'hours' | 'status'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  // поля модалки
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [status, setStatus] = useState('Активный');
  const [photo, setPhoto] = useState(null);

  // фикс повторного выбора того же файла
  const photoInputRef = useRef(null);

  const total = useMemo(() => teachers.length, [teachers]);

  const loadData = async () => {
    const [teachersRes, assignmentsRes] = await Promise.all([
      api.get('/teachers'),
      api.get('/assignments'),
    ]);

    setTeachers(teachersRes.data);
    setAssignments(assignmentsRes.data);
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
    setStatus('Активный');
    setPhoto(null);

    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // карта часов по учителю (быстро + нужно для сортировки)
  const hoursByTeacher = useMemo(() => {
    const map = {};
    for (const a of assignments) {
      const tid = a.teacher?._id;
      if (!tid) continue;
      map[tid] = (map[tid] || 0) + (Number(a.hours) || 0);
    }
    return map;
  }, [assignments]);

  // обработчик сортировки по клику
  const onSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sortedTeachers = useMemo(() => {
    const arr = [...teachers];

    arr.sort((a, b) => {
      let cmp = 0;

      if (sortBy === 'fullName') {
        const an = (a.fullName ?? '').toString();
        const bn = (b.fullName ?? '').toString();
        cmp = an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' });
      }

      if (sortBy === 'hours') {
        const ah = hoursByTeacher[a._id] || 0;
        const bh = hoursByTeacher[b._id] || 0;
        cmp = ah - bh;
      }

      if (sortBy === 'status') {
        const an = (a.status ?? '').toString();
        const bn = (b.status ?? '').toString();
        cmp = an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' });
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [teachers, sortBy, sortDir, hoursByTeacher]);

  const createTeacher = async () => {
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

    await api.post('/teachers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    resetForm();
    loadData();
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm('Удалить учителя?')) return;
    await api.delete(`/teachers/${id}`);
    loadData();
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0">
            <i className="fas fa-chalkboard-teacher me-1"></i>Учителя
          </h1>
          <div className="text-muted">Общее количество: {total}</div>
        </div>

        <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addTeacherModal">
          + Добавить учителя
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover">
          <thead>
            <tr>
              <th
                role="button"
                className="user-select-none"
                onClick={() => onSort('fullName')}
                title="Сортировать по ФИО"
              >
                ФИО
                {sortBy === 'fullName' && (
                  <i className={`fa-solid ms-2 ${sortDir === 'asc' ? 'fa-arrow-up-a-z' : 'fa-arrow-down-z-a'}`}></i>
                )}
              </th>

              <th
                role="button"
                className="text-center user-select-none"
                onClick={() => onSort('hours')}
                title="Сортировать по часам"
                style={{ width: 1, whiteSpace: 'nowrap' }}
              >
                Часы
                {sortBy === 'hours' && (
                  <i className={`fa-solid ms-2 ${sortDir === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'}`}></i>
                )}
              </th>

              <th
                role="button"
                className="text-center user-select-none"
                onClick={() => onSort('status')}
                title="Сортировать по статусу"
                style={{ width: 1, whiteSpace: 'nowrap' }}
              >
                Статус
                {sortBy === 'status' && (
                  <i className={`fa-solid ms-2 ${sortDir === 'asc' ? 'fa-arrow-up-a-z' : 'fa-arrow-down-z-a'}`}></i>
                )}
              </th>

              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                Действия
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedTeachers.map((t) => (
              <tr key={t._id}>
                <td>
                  {t.photo ? (
                    <img
                      src={`http://localhost:5000${t.photo}`}
                      alt=""
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: 'cover',
                        borderRadius: '10%',
                        marginRight: 10,
                        verticalAlign: 'middle',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10%',
                        background: '#eee',
                        color: '#bbb',
                        marginRight: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        verticalAlign: 'middle',
                        fontSize: 18,
                      }}
                    >
                      <i className="fas fa-chalkboard-teacher"></i>
                    </div>
                  )}
                  {t.fullName}
                </td>

                <td className="text-center">{hoursByTeacher[t._id] || 0}</td>
                <td className="text-center">{t.status || '-'}</td>

                <td className="text-end">
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                    <Link to={`/teachers/${t._id}`} className="btn btn-outline-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                      <i className="fa-solid fa-eye me-1"></i>
                      Открыть
                    </Link>

                    <Link to={`/teachers/${t._id}/edit`} className="btn btn-outline-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                      <i className="fa-solid fa-pen me-1"></i>
                      Редактировать
                    </Link>

                    <button
                      className="btn btn-danger btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => deleteTeacher(t._id)}
                    >
                      <i className="fa-solid fa-xmark me-1"></i>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {teachers.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center text-muted">
                  Пока нет учителей
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* МОДАЛЬНОЕ ОКНО — ТОЛЬКО ДЛЯ УЧИТЕЛЕЙ */}
      <div className="modal fade" id="addTeacherModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Добавить учителя</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetForm}></button>
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">ФИО *</label>
                  <input
                    className="form-control"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Петров Пётр Петрович"
                  />
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

                <div className="col-md-4">
                  <label className="form-label">Дата рождения</label>
                  <input type="date" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Телефон</label>
                  <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+373..." />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.com" />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Адрес</label>
                  <input className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Город, улица, дом..." />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Статус</label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Активный">Активный</option>
                    <option value="Не активный">Не активный</option>
                    <option value="Академический отпуск">Академический отпуск</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={resetForm}>
                Отмена
              </button>
              <button type="button" className="btn btn-primary" onClick={createTeacher} data-bs-dismiss="modal">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Teachers;
