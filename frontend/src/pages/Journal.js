// frontend/src/pages/Journal.js
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

/* ================= utils ================= */

function ymd(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function monthRange(year, monthIndex) {
  const from = new Date(year, monthIndex, 1);
  const to = new Date(year, monthIndex + 1, 0);
  return { from, to };
}

function daysInRange(from, to) {
  const out = [];
  const cur = new Date(from);
  while (cur <= to) {
    out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

// absence: только 'a' или 'm'
function clampAbsence(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (!v) return '';
  if (v === 'a' || v === 'm') return v;
  return null;
}

// task grade: 1..10 или 'm'
function clampTaskGrade(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (!v) return '';
  if (v === 'm') return 'm';
  if (!/^\d{1,2}$/.test(v)) return null;
  const n = Number(v);
  if (n >= 1 && n <= 10) return String(n);
  return null;
}

// exam: строго 1..10
function clampExam(raw) {
  const v = String(raw ?? '').trim();
  if (!v) return '';
  if (!/^\d{1,2}$/.test(v)) return null;
  const n = Number(v);
  if (n >= 1 && n <= 10) return String(n);
  return null;
}

function formatAvg(x) {
  if (x === '' || x === null || x === undefined) return '';
  const n = Number(x);
  if (!Number.isFinite(n)) return '';
  const s = (Math.round(n * 100) / 100).toFixed(2);
  return s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

// Bootstrap modal helper (requires bootstrap bundle on page)
function hideModalById(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // eslint-disable-next-line no-undef
  const modal = window.bootstrap?.Modal.getOrCreateInstance(el);
  modal?.hide();
}

/* ================= component ================= */

function Journal() {
  const { classId, subjectId } = useParams();

  const [cls, setCls] = useState(null);
  const [subject, setSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [tasks, setTasks] = useState([]); // ✅ все задачи периода
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [error, setError] = useState('');

  // период: текущий месяц
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0..11
  const period = useMemo(() => `${year}-${year + 1}`, [year]);

  const { from, to } = useMemo(() => monthRange(year, month), [year, month]);
  const days = useMemo(() => daysInRange(from, to), [from, to]);

  // ✅ pending scroll to a task column after switching month/load/render
  const [pendingScrollTaskId, setPendingScrollTaskId] = useState(null);

  /* ===== tasks modal state ===== */
  const [taskModalMode, setTaskModalMode] = useState('create'); // 'create' | 'edit'
  const [taskEditId, setTaskEditId] = useState(null);

  const [taskSemester, setTaskSemester] = useState('1');
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDate, setTaskDate] = useState(ymd(now));

  const resetTaskForm = () => {
    setTaskEditId(null);
    setTaskModalMode('create');
    setTaskSemester('1');
    setTaskName('');
    setTaskDesc('');
    setTaskDate(ymd(new Date()));
  };

  const openCreateTaskModal = () => {
    resetTaskForm();
    setTaskModalMode('create');
  };

  const openEditTaskModal = (t) => {
    setTaskModalMode('edit');
    setTaskEditId(t._id);
    setTaskSemester(String(t.semester));
    setTaskName(t.name || '');
    setTaskDesc(t.description || '');
    setTaskDate(t.dateIso || ymd(new Date()));
  };

  /* ===== load ===== */

  const load = async () => {
    try {
      setError('');

      const [cRes, sRes, stRes, gRes, calRes, tRes] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get(`/subjects/${subjectId}`),
        api.get('/students'),
        api.get('/grades', {
          params: { classId, subjectId, from: ymd(from), to: ymd(to), period }
        }),
        api.get('/calendar-events'),
        // ✅ задачи грузим ВСЕ по period (не зависят от выбранного месяца)
        api.get('/tasks', {
          params: { classId, subjectId, period }
        })
      ]);

      setCls(cRes.data);
      setSubject(sRes.data);

      const list = (stRes.data || []).filter((s) => s.class?._id === classId);
      list.sort((a, b) =>
        (a.fullName || '').localeCompare(b.fullName || '', 'ru', { sensitivity: 'base' })
      );
      setStudents(list);

      setGrades(gRes.data || []);
      setCalendarEvents(calRes.data || []);

      const tList = (tRes.data || []).slice();
      tList.sort((a, b) => String(a.dateIso || '').localeCompare(String(b.dateIso || '')));
      setTasks(tList);
    } catch (e) {
      setError('Не удалось загрузить журнал');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, subjectId, year, month]);

  /* ===== grade map ===== */

  const gradeMap = useMemo(() => {
    const m = new Map();
    for (const g of grades) {
      const sid = g.student?._id || g.student;

      if (g.kind === 'absence' && g.date) {
        m.set(`${sid}|absence|${g.date}`, g.value);
        continue;
      }

      if (g.kind === 'task' && (g.task?._id || g.task)) {
        const tid = g.task?._id || g.task;
        m.set(`${sid}|task|${tid}`, g.value);
        continue;
      }

      if (g.period) {
        m.set(`${sid}|${g.kind}|${g.period}`, g.value);
      }
    }
    return m;
  }, [grades]);

  const getVal = (studentId, kind, key3) => gradeMap.get(`${studentId}|${kind}|${key3}`) ?? '';

  /* ===== calendar helpers ===== */

  const getEventTitlesForDay = (iso) => {
    const titles = [];
    for (const ev of calendarEvents) {
      if (iso >= ev.startIso && iso <= ev.endIso) titles.push(ev.title);
    }
    return titles;
  };

  const dayInfo = (dateObj) => {
    const iso = ymd(dateObj);
    const isSunday = dateObj.getDay() === 0;
    const titles = getEventTitlesForDay(iso);
    const isHoliday = titles.length > 0;
    return {
      iso,
      isSunday,
      isHoliday,
      titles,
      blocked: isSunday || isHoliday
    };
  };

  /* ===== columns: day + tasks after that day ===== */

  const columns = useMemo(() => {
    const byDate = new Map();
    for (const t of tasks) {
      const di = String(t.dateIso || '');
      if (!di) continue;
      if (!byDate.has(di)) byDate.set(di, []);
      byDate.get(di).push(t);
    }

    const cols = [];
    for (const d of days) {
      const iso = ymd(d);
      cols.push({ type: 'day', iso, dateObj: d });
      const tlist = byDate.get(iso) || [];
      for (const t of tlist) cols.push({ type: 'task', task: t });
    }
    return cols;
  }, [days, tasks]);

  /* ===== after render/load: scroll to pending task column ===== */

  useEffect(() => {
    if (!pendingScrollTaskId) return;

    const id = pendingScrollTaskId;

    const tick = () => {
      const el = document.getElementById(`task-col-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        setPendingScrollTaskId(null);
        return;
      }
      setTimeout(tick, 50);
    };

    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, pendingScrollTaskId]);

  /* ===== averages ===== */

  const tasksSem1 = useMemo(() => tasks.filter((t) => String(t.semester) === '1'), [tasks]);
  const tasksSem2 = useMemo(() => tasks.filter((t) => String(t.semester) === '2'), [tasks]);

  const computeSemesterAvg = (studentId, semTasks) => {
    if (!semTasks.length) return '';
    let sum = 0;

    for (const t of semTasks) {
      const v = getVal(studentId, 'task', t._id);
      const n = Number(v);
      if (Number.isFinite(n) && n >= 1 && n <= 10) sum += n;
      // 'm' и пусто считаем как 0
    }

    return sum / semTasks.length;
  };

  const computeYearAvg = (examVal, sem1Avg, sem2Avg) => {
    const ex = Number(examVal);
    const s1 = Number(sem1Avg);
    const s2 = Number(sem2Avg);
    if (!Number.isFinite(ex) || !Number.isFinite(s1) || !Number.isFinite(s2)) return '';
    return (ex + s1 + s2) / 3;
  };

  /* ===== save/delete helpers ===== */

  const saveGrade = async (payload) => {
    await api.put('/grades', payload);
    await load();
  };

  const deleteGrade = async (payload) => {
    await api.delete('/grades', { data: payload });
    await load();
  };

  /* ===== cells handlers ===== */

  const onChangeAbsence = async (studentId, dateIso, raw) => {
    const normalized = clampAbsence(raw);
    if (normalized === null) return;

    if (normalized === '') {
      await deleteGrade({
        student: studentId,
        class: classId,
        subject: subjectId,
        kind: 'absence',
        date: dateIso
      });
      return;
    }

    await saveGrade({
      student: studentId,
      class: classId,
      subject: subjectId,
      kind: 'absence',
      date: dateIso,
      value: normalized
    });
  };

  const onChangeTaskGrade = async (studentId, taskId, raw) => {
    const normalized = clampTaskGrade(raw);
    if (normalized === null) return;

    if (normalized === '') {
      await deleteGrade({
        student: studentId,
        class: classId,
        subject: subjectId,
        kind: 'task',
        task: taskId
      });
      return;
    }

    await saveGrade({
      student: studentId,
      class: classId,
      subject: subjectId,
      kind: 'task',
      task: taskId,
      value: normalized
    });
  };

  const onChangeExam = async (studentId, raw) => {
    const normalized = clampExam(raw);
    if (normalized === null) return;

    if (normalized === '') {
      await deleteGrade({
        student: studentId,
        class: classId,
        subject: subjectId,
        kind: 'exam',
        period
      });
      return;
    }

    await saveGrade({
      student: studentId,
      class: classId,
      subject: subjectId,
      kind: 'exam',
      period,
      value: normalized
    });
  };

  /* ===== tasks CRUD (modal) ===== */

  const submitTaskModal = async () => {
    const name = taskName.trim();
    const description = taskDesc.trim();
    const dateIso = String(taskDate || '').trim();
    const semester = Number(taskSemester);

    if (!name) return alert('Введите имя задачи');
    if (!dateIso) return alert('Выберите дату');
    if (![1, 2].includes(semester)) return alert('Семестр должен быть 1 или 2');

    if (taskModalMode === 'create') {
      await api.post('/tasks', {
        class: classId,
        subject: subjectId,
        period,
        semester,
        name,
        description,
        dateIso
      });
    } else {
      await api.put(`/tasks/${taskEditId}`, {
        semester,
        name,
        description,
        dateIso
      });
    }

    hideModalById('taskModal');
    await load();
  };

  const deleteTaskById = async (taskId) => {
    if (!window.confirm('Удалить задачу? Все оценки по этой задаче тоже удалятся.')) return;
    await api.delete(`/tasks/${taskId}`);
    await load();
  };

  /* ===== go to task: switch month if needed, then scroll ===== */

  const goToTask = (t) => {
    const targetDate = new Date(t.dateIso);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    setPendingScrollTaskId(t._id);

    if (year === targetYear && month === targetMonth) {
      requestAnimationFrame(() => {
        document
          .getElementById(`task-col-${t._id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      return;
    }

    setYear(targetYear);
    setMonth(targetMonth);
  };

  /* ================= render ================= */

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!cls || !subject) return <div className="text-muted">Загрузка...</div>;

  return (
    <div className="container-fluid py-3 journal-page">
      {/* ===== page header ===== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-1">
            <i className="fas fa-book-open me-2"></i>
            Журнал: {cls.name} — {subject.name}
          </h1>
          <div className="text-muted">
            <Link className="text-decoration-none" to={`/classes/${classId}`}>
              <i className="fa-solid fa-chevron-left me-1"></i>Назад к классу
            </Link>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <select
            className="form-select"
            style={{ width: 110 }}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {new Date(2000, i, 1).toLocaleString('ru', { month: 'short' })}
              </option>
            ))}
          </select>

          <input
            className="form-control"
            style={{ width: 110 }}
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
      </div>

      {/* ===== journal table ===== */}
      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover journal-table">
          <thead>
            <tr>
              {/* ✅ sticky № */}
              <th
                className="text-center sticky-col sticky-col-1"
                style={{ width: 60, minWidth: 60, whiteSpace: 'nowrap' }}
              >
                №
              </th>

              {/* ✅ sticky Ученик */}
              <th className="sticky-col sticky-col-2" style={{ width: 1, whiteSpace: 'nowrap' }}>
                <i className="fas fa-user-graduate me-1"></i>Ученик
              </th>

              {columns.map((c) => {
                if (c.type === 'day') {
                  const info = dayInfo(c.dateObj);

                  const tip = info.isHoliday
                    ? `${info.iso}\n${info.titles.join('\n')}`
                    : info.isSunday
                      ? `${info.iso}\nВоскресенье`
                      : info.iso;

                  return (
                    <th
                      key={`d-${info.iso}`}
                      className={info.blocked ? 'text-center bg-body-tertiary' : 'text-center'}
                      style={{ width: 1, whiteSpace: 'nowrap' }}
                      title={tip}
                    >
                      {c.dateObj.getDate()}
                    </th>
                  );
                }

                const t = c.task;
                const title = `${t.dateIso}\n${t.name}${t.description ? `\n${t.description}` : ''}\nСеместр: ${t.semester}`;

                return (
                  <th
                    key={`t-${t._id}`}
                    id={`task-col-${t._id}`}
                    className="text-center table-warning"
                    style={{ width: 1, whiteSpace: 'nowrap' }}
                    title={title}
                  >
                    {t.name}
                  </th>
                );
              })}

              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                Экз
              </th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                Сем1
              </th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                Сем2
              </th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                Год
              </th>
            </tr>
          </thead>

          <tbody>
            {students.map((st, index) => {
              const sem1Avg = computeSemesterAvg(st._id, tasksSem1);
              const sem2Avg = computeSemesterAvg(st._id, tasksSem2);
              const examVal = getVal(st._id, 'exam', period);
              const yearAvg = computeYearAvg(examVal, sem1Avg, sem2Avg);

              return (
                <tr key={st._id}>
                  {/* ✅ sticky № */}
                  <td
                    className="text-center sticky-col sticky-col-1"
                    style={{ width: 60, minWidth: 60, whiteSpace: 'nowrap' }}
                  >
                    {index + 1}
                  </td>

                  {/* ✅ sticky Ученик */}
                  <td className="sticky-col sticky-col-2" style={{ whiteSpace: 'nowrap' }}>
                    <Link to={`/students/${st._id}`} className="text-decoration-none">
                      {st.fullName}
                    </Link>
                  </td>

                  {columns.map((c) => {
                    if (c.type === 'day') {
                      const dateIso = c.iso;
                      const info = dayInfo(c.dateObj);

                      const tip = info.isHoliday
                        ? `${info.iso}\n${info.titles.join('\n')}`
                        : info.isSunday
                          ? `${info.iso}\nВоскресенье`
                          : info.iso;

                      const val = getVal(st._id, 'absence', dateIso);

                      return (
                        <td
                          key={`cell-d-${st._id}-${dateIso}`}
                          className={`text-center p-1 ${info.blocked ? 'bg-body-tertiary journal-blocked' : ''}`}
                          title={tip}
                        >
                          <input
                            className="form-control border-0 form-control-sm text-center"
                            style={{ minWidth: 44 }}
                            value={val}
                            readOnly={info.blocked}
                            onChange={(e) => {
                              if (info.blocked) return;
                              onChangeAbsence(st._id, dateIso, e.target.value);
                            }}
                            placeholder=""
                          />
                        </td>
                      );
                    }

                    // task cell
                    const t = c.task;
                    const val = getVal(st._id, 'task', t._id);

                    return (
                      <td
                        key={`cell-t-${st._id}-${t._id}`}
                        className="text-center p-1 table-warning"
                        title={`${t.dateIso}\n${t.name}${t.description ? `\n${t.description}` : ''}`}
                      >
                        <input
                          className="form-control border-0 form-control-sm text-center"
                          style={{ minWidth: 56 }}
                          value={val}
                          onChange={(e) => onChangeTaskGrade(st._id, t._id, e.target.value)}
                          placeholder=""
                        />
                      </td>
                    );
                  })}

                  {/* exam */}
                  <td className="text-center p-1">
                    <input
                      className="form-control border-0 form-control-sm text-center"
                      style={{ minWidth: 52 }}
                      value={examVal}
                      onChange={(e) => onChangeExam(st._id, e.target.value)}
                      placeholder=""
                    />
                  </td>

                  {/* semester avgs */}
                  <td className="text-center p-1">
                    <input
                      className="form-control border-0 form-control-sm text-center"
                      style={{ minWidth: 52 }}
                      value={formatAvg(sem1Avg)}
                      readOnly
                      placeholder=""
                    />
                  </td>

                  <td className="text-center p-1">
                    <input
                      className="form-control border-0 form-control-sm text-center"
                      style={{ minWidth: 52 }}
                      value={formatAvg(sem2Avg)}
                      readOnly
                      placeholder=""
                    />
                  </td>

                  <td className="text-center p-1">
                    <input
                      className="form-control border-0 form-control-sm text-center"
                      style={{ minWidth: 52 }}
                      value={formatAvg(yearAvg)}
                      readOnly
                      placeholder=""
                    />
                  </td>
                </tr>
              );
            })}

            {students.length === 0 && (
              <tr>
                <td colSpan={2 + columns.length + 4} className="text-center text-muted">
                  В классе нет учеников
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-muted mt-2" style={{ fontSize: 14 }}>
        Пропуски (дни): допускается только <b>a</b> или <b>m</b>. Задачи: допускается только <b>1–10</b> или <b>m</b>.
        Очистка ячейки удаляет запись.
      </div>

      {/* ===== Tasks block header ===== */}
      <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
        <div>
          <h4 className="mb-0">
            <i className="fa-solid fa-list-check me-2"></i>Добавленные задачи
          </h4>
          <div className="text-muted" style={{ fontSize: 14 }}>
            Общее количество: {tasks.length}
          </div>
        </div>

        <button
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#taskModal"
          onClick={openCreateTaskModal}
        >
          + Добавить
        </button>
      </div>

      {/* ===== Tasks table (all tasks) ===== */}
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle">
          <thead>
            <tr>
              <th style={{ width: 120 }}>Дата</th>
              <th style={{ width: 90 }} className="text-center">
                Семестр
              </th>
              <th>Задача</th>
              <th>Описание</th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t._id}>
                <td className="text-nowrap">{t.dateIso}</td>
                <td className="text-center">{t.semester}</td>

                <td>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={() => goToTask(t)} // ✅ откроет месяц и проскроллит
                    title="Открыть месяц и перейти к колонке"
                  >
                    <strong>{t.name}</strong>
                  </button>
                </td>

                <td className="text-muted">{t.description || '—'}</td>

                <td className="text-end">
                  <div className="btn-group text-nowrap" role="group">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      data-bs-toggle="modal"
                      data-bs-target="#taskModal"
                      onClick={() => openEditTaskModal(t)}
                      title="Редактировать"
                    >
                      <i className="fa-solid fa-pen"></i>
                      <span className="d-none d-md-inline ms-1 text-nowrap">Редактировать</span>
                    </button>

                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => deleteTaskById(t._id)}
                      title="Удалить (с оценками)"
                    >
                      <i className="fa-solid fa-xmark"></i>
                      <span className="d-none d-md-inline ms-1 text-nowrap">Удалить</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  Задач пока нет — нажми “+ Добавить”
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Task Modal (create/edit) ===== */}
      <div className="modal fade" id="taskModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {taskModalMode === 'create' ? 'Добавить задачу' : 'Редактировать задачу'}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label className="form-label">Семестр</label>
                  <select
                    className="form-select"
                    value={taskSemester}
                    onChange={(e) => setTaskSemester(e.target.value)}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label">Дата</label>
                  <input
                    type="date"
                    className="form-control"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Имя задачи</label>
                  <input
                    className="form-control"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Описание</label>
                  <input
                    className="form-control"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <div className="text-muted" style={{ fontSize: 14 }}>
                    После сохранения появится колонка <b>сразу после выбранной даты</b>.
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                Отмена
              </button>
              <button type="button" className="btn btn-primary" onClick={submitTaskModal}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Journal;
