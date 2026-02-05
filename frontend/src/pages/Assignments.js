import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // сортировка (для основной таблицы назначений)
  const [sortBy, setSortBy] = useState('teacher'); // 'teacher' | 'class' | 'subject' | 'hours'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  // поля модалки
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [hours, setHours] = useState('');

  const total = useMemo(() => assignments.length, [assignments]);

  const loadData = async () => {
    const [a, t, c, s] = await Promise.all([
      api.get('/assignments'),
      api.get('/teachers'),
      api.get('/classes'),
      api.get('/subjects'),
    ]);

    setAssignments(a.data);
    setTeachers(t.data);
    setClasses(c.data);
    setSubjects(s.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setTeacherId('');
    setClassId('');
    setSubjectId('');
    setHours('');
  };

  const createAssignment = async () => {
    if (!teacherId || !classId || !subjectId) {
      alert('Выберите учителя, класс и предмет');
      return;
    }

    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0) {
      alert('Введите корректное количество часов');
      return;
    }

    await api.post('/assignments', {
      teacher: teacherId,
      class: classId,
      subject: subjectId,
      hours: h,
    });

    resetForm();
    loadData();
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm('Удалить назначение?')) return;
    await api.delete(`/assignments/${id}`);
    loadData();
  };

  // ====== ВТОРАЯ ТАБЛИЦА: "класс имеет предмет, но нет назначения учителя" ======

  const missingAssignments = useMemo(() => {
    // Индекс существующих назначений по ключу "classId|subjectId"
    const existing = new Set(
      (assignments || [])
        .filter((a) => a?.class?._id && a?.subject?._id)
        .map((a) => `${a.class._id}|${a.subject._id}`)
    );

    const out = [];

    for (const c of classes || []) {
      const classSubjects = Array.isArray(c.subjects) ? c.subjects : [];
      for (const subj of classSubjects) {
        const sid = typeof subj === 'string' ? subj : subj?._id;
        const sname =
          typeof subj === 'string'
            ? subjects.find((x) => x._id === subj)?.name || '-'
            : subj?.name || '-';

        if (!c?._id || !sid) continue;

        const key = `${c._id}|${sid}`;
        if (existing.has(key)) continue;

        out.push({
          key,
          classId: c._id,
          className: c.name || '-',
          subjectId: sid,
          subjectName: sname,
        });
      }
    }

    // сортируем для красоты: сначала класс, потом предмет
    out.sort((a, b) => {
      const c = (a.className || '').localeCompare(b.className || '', 'ru', {
        numeric: true,
        sensitivity: 'base',
      });
      if (c !== 0) return c;
      return (a.subjectName || '').localeCompare(b.subjectName || '', 'ru', {
        sensitivity: 'base',
      });
    });

    return out;
  }, [assignments, classes, subjects]);

  const prefillAndOpenModal = (cid, sid) => {
    setClassId(cid);
    setSubjectId(sid);
    setTeacherId('');
    setHours('');
  };

  // ====== сортировка основной таблицы ======

  const onSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sortedAssignments = useMemo(() => {
    const arr = [...assignments];

    arr.sort((a, b) => {
      let cmp = 0;

      if (sortBy === 'teacher') {
        const an = (a.teacher?.fullName ?? '').toString();
        const bn = (b.teacher?.fullName ?? '').toString();
        cmp = an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' });
      }

      if (sortBy === 'class') {
        const an = (a.class?.name ?? '').toString();
        const bn = (b.class?.name ?? '').toString();
        cmp = an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' });
      }

      if (sortBy === 'subject') {
        const an = (a.subject?.name ?? '').toString();
        const bn = (b.subject?.name ?? '').toString();
        cmp = an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' });
      }

      if (sortBy === 'hours') {
        const ah = Number(a.hours) || 0;
        const bh = Number(b.hours) || 0;
        cmp = ah - bh;
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [assignments, sortBy, sortDir]);

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0">
            <i className="fas fa-tasks me-1"></i>Назначения
          </h1>
          <div className="text-muted">Общее количество: {total}</div>
        </div>

        <button
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#addAssignmentModal"
          onClick={resetForm}
        >
          + Назначить
        </button>
      </div>

      {/* ====== Таблица "Требуют назначения" ====== */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fa-solid fa-triangle-exclamation me-2 text-warning"></i>
              Требуют назначения
            </h5>
            <div className="text-muted">{missingAssignments.length}</div>
          </div>

          <div className="text-muted mt-1" style={{ fontSize: 14 }}>
            Здесь показаны предметы, назначенные классу, но без преподавателя (нет записи в “Назначениях”).
          </div>

          {missingAssignments.length ? (
            <div className="table-responsive mt-3">
              <table className="table table-bordered align-middle table-hover">
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>
                      <i className="fas fa-book me-1"></i>Класс
                    </th>
                    <th style={{ whiteSpace: 'nowrap' }}>
                      <i className="fas fa-book-open me-1"></i>Предмет
                    </th>
                    <th className="text-end" style={{ width: 1, whiteSpace: 'nowrap' }}>
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {missingAssignments.map((m) => (
                    <tr key={m.key}>
                      <td>
                        <Link to={`/classes/${m.classId}`} className="text-decoration-none">
                          {m.className}
                        </Link>
                      </td>
                      <td>
                        <Link to={`/subjects/${m.subjectId}`} className="text-decoration-none">
                          {m.subjectName}
                        </Link>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ whiteSpace: 'nowrap' }}
                          data-bs-toggle="modal"
                          data-bs-target="#addAssignmentModal"
                          onClick={() => prefillAndOpenModal(m.classId, m.subjectId)}
                        >
                          <i className="fa-solid fa-plus me-1"></i>
                          Назначить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted mt-3">Все предметы классов имеют назначенных преподавателей ✅</div>
          )}
        </div>
      </div>

      {/* ====== Основная таблица назначений ====== */}
      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover">
          <thead>
            <tr>
              <th
                role="button"
                className="user-select-none"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => onSort('teacher')}
                title="Сортировать по учителю"
              >
                <i className="fas fa-chalkboard-teacher me-1"></i>Учитель
                {sortBy === 'teacher' && (
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
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => onSort('class')}
                title="Сортировать по классу"
              >
                <i className="fas fa-book me-1"></i>Класс
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
                className="text-center user-select-none"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => onSort('subject')}
                title="Сортировать по предмету"
              >
                <i className="fas fa-book-open me-1"></i>Предмет
                {sortBy === 'subject' && (
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
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => onSort('hours')}
                title="Сортировать по часам"
              >
                <i className="fa-regular fa-clock me-1"></i>Часы
                {sortBy === 'hours' && (
                  <i
                    className={`fa-solid ms-2 ${
                      sortDir === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'
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
            {sortedAssignments.map((a) => (
              <tr key={a._id}>
                <td>
                  {a.teacher ? (
                    <Link to={`/teachers/${a.teacher._id}`} className="text-decoration-none">
                      {a.teacher.fullName}
                    </Link>
                  ) : (
                    '-'
                  )}
                </td>

                <td className="text-center">
                  {a.class ? (
                    <Link to={`/classes/${a.class._id}`} className="text-decoration-none">
                      {a.class.name}
                    </Link>
                  ) : (
                    '-'
                  )}
                </td>

                <td className="text-center">
                  {a.subject ? (
                    <Link to={`/subjects/${a.subject._id}`} className="text-decoration-none">
                      {a.subject.name}
                    </Link>
                  ) : (
                    '-'
                  )}
                </td>

                <td className="text-center">{a.hours}</td>

                <td className="text-center">
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                    <Link
                      to={`/assignments/${a._id}`}
                      className="btn btn-outline-secondary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="fa-solid fa-eye me-2"></i>
                      Открыть
                    </Link>

                    <Link
                      to={`/assignments/${a._id}/edit`}
                      className="btn btn-outline-primary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="fa-solid fa-pen me-2"></i>
                      Редактировать
                    </Link>

                    <button
                      className="btn btn-danger btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => deleteAssignment(a._id)}
                    >
                      <i className="fa-solid fa-trash me-2"></i>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {assignments.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  Пока нет назначений
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* МОДАЛЬНОЕ ОКНО — ТОЛЬКО ДЛЯ НАЗНАЧЕНИЙ */}
      <div className="modal fade" id="addAssignmentModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Назначение</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={resetForm}
              ></button>
            </div>

            <div className="modal-body">
              <div className="mb-2">
                <label className="form-label">Учитель *</label>
                <select className="form-select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                  <option value="">Выберите учителя</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label">Класс *</label>
                <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value="">Выберите класс</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label">Предмет *</label>
                <select className="form-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="">Выберите предмет</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label">Часы *</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Например: 6"
                />
              </div>

              <div className="text-muted" style={{ fontSize: 14 }}>
                Назначение связывает учителя, класс и предмет и задаёт количество часов.
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={resetForm}>
                Отмена
              </button>
              <button type="button" className="btn btn-primary" onClick={createAssignment} data-bs-dismiss="modal">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Assignments;
