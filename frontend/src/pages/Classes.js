import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

function Classes() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // сортировка
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'students'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  // поля модалки
  const [name, setName] = useState('');
  const [subjectIds, setSubjectIds] = useState([]);

  const total = useMemo(() => classes.length, [classes]);

  // подсчет учеников по классу
  const studentsCountByClass = useMemo(() => {
    const map = {};
    for (const s of students) {
      const cid = s.class?._id;
      if (!cid) continue;
      map[cid] = (map[cid] || 0) + 1;
    }
    return map;
  }, [students]);

  // обработчик сортировки по клику на заголовок
  const onSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sortedClasses = useMemo(() => {
    const arr = [...classes];

    arr.sort((a, b) => {
      let cmp = 0;

      if (sortBy === 'name') {
        const an = (a.name ?? '').toString();
        const bn = (b.name ?? '').toString();
        cmp = an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' });
      }

      if (sortBy === 'students') {
        const ac = studentsCountByClass[a._id] || 0;
        const bc = studentsCountByClass[b._id] || 0;
        cmp = ac - bc;
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [classes, sortBy, sortDir, studentsCountByClass]);

  const loadData = async () => {
    const [classesRes, studentsRes, subjectsRes] = await Promise.all([
      api.get('/classes'),
      api.get('/students'),
      api.get('/subjects'),
    ]);

    setClasses(classesRes.data);
    setStudents(studentsRes.data);
    setSubjects(subjectsRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setName('');
    setSubjectIds([]);
  };

  const onSubjectsChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSubjectIds(selected);
  };

  const createClass = async () => {
    if (!name.trim()) {
      alert('Введите название класса');
      return;
    }

    await api.post('/classes', {
      name: name.trim(),
      subjects: subjectIds,
    });

    resetForm();
    loadData();
  };

  const deleteClass = async (id) => {
    if (!window.confirm('Удалить класс?')) return;
    await api.delete(`/classes/${id}`);
    loadData();
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0">
            <i className="fas fa-book me-1"></i>Журналы (Классы)
          </h1>
          <div className="text-muted">Общее количество: {total}</div>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#addClassModal"
          >
            + Добавить класс
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover">
          <thead>
            <tr>
              <th
                role="button"
                className="user-select-none"
                onClick={() => onSort('name')}
                title="Сортировать по названию"
              >
                Название класса
                {sortBy === 'name' && (
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
                onClick={() => onSort('students')}
                title="Сортировать по количеству учеников"
              >
                Ученики
                {sortBy === 'students' && (
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
            {sortedClasses.map((cls) => (
              <tr key={cls._id}>
                <td>
                  <i className="fas fa-book me-1 text-muted"></i>
                  {cls.name}
                </td>

                <td className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                  {studentsCountByClass[cls._id] || 0}
                </td>

                <td className="text-end">
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                    <Link
                      to={`/classes/${cls._id}`}
                      className="btn btn-outline-secondary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="fa-solid fa-eye me-1"></i>
                      Открыть
                    </Link>

                    <Link
                      to={`/classes/${cls._id}/edit`}
                      className="btn btn-outline-primary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="fa-solid fa-pen me-1"></i>
                      Редактировать
                    </Link>

                    <button
                      className="btn btn-danger btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => deleteClass(cls._id)}
                    >
                      <i className="fa-solid fa-xmark me-1"></i>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {classes.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center text-muted">
                  Пока нет классов
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* МОДАЛЬНОЕ ОКНО — ТОЛЬКО ДЛЯ КЛАССОВ */}
      <div className="modal fade" id="addClassModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Добавить класс</h5>
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
                placeholder="Например: 10-А"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="mt-3">
                <label className="form-label">Предметы (опционально)</label>
                <select
                  className="form-select"
                  multiple
                  value={subjectIds}
                  onChange={onSubjectsChange}
                  style={{ minHeight: 160 }}
                >
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="text-muted mt-1" style={{ fontSize: 14 }}>
                  Можно выбрать несколько (Ctrl/Command + клик).
                </div>
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
                onClick={createClass}
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

export default Classes;
