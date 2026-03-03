// frontend/src/pages/Journal.js
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { journalLocalI18n, pickLocalI18n, useI18n } from '../i18n/I18nContext';

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

// absence: only 'a' or 'm'
function clampAbsence(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (!v) return '';
  if (v === 'a' || v === 'm') return v;
  return null;
}

// task grade: 1..10 or 'm'
function clampTaskGrade(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (!v) return '';
  if (v === 'm') return 'm';
  if (!/^\d{1,2}$/.test(v)) return null;
  const n = Number(v);
  if (n >= 1 && n <= 10) return String(n);
  return null;
}

// exam: strictly 1..10
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
  const { user } = useAuth();
  const { language } = useI18n();
  const tr = pickLocalI18n(journalLocalI18n, language);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';
  const canManageTasks = isAdmin || user?.role === 'TEACHER';

  const [cls, setCls] = useState(null);
  const [subject, setSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [tasks, setTasks] = useState([]); // all tasks for selected period
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [lessonSlotsPerDay, setLessonSlotsPerDay] = useState(1);
  const [error, setError] = useState('');

  // period: current academic year interval
  const now = new Date();
  const currentDate = useMemo(() => new Date(), []);
  const defaultFirstYear = currentDate.getMonth() >= 8 ? currentDate.getFullYear() : currentDate.getFullYear() - 1;
  const [firstSemesterYear, setFirstSemesterYear] = useState(defaultFirstYear);
  const [secondSemesterYear, setSecondSemesterYear] = useState(defaultFirstYear + 1);
  const studyMonths = useMemo(() => [8, 9, 10, 11, 0, 1, 2, 3, 4], []);
  const normalizeStudyMonth = (m) => (studyMonths.includes(m) ? m : 8);
  const [month, setMonth] = useState(normalizeStudyMonth(currentDate.getMonth())); // 0..11
  const viewYear = month >= 8 ? firstSemesterYear : secondSemesterYear;
  const period = useMemo(() => `${firstSemesterYear}-${secondSemesterYear}`, [firstSemesterYear, secondSemesterYear]);
  const finalPeriod = period;
  const monthButtons = useMemo(
    () =>
      studyMonths.map((m) => ({
        value: m,
        label: new Date(2000, m, 1).toLocaleString(language === 'ro' ? 'ro-RO' : 'ru-RU', { month: 'short' }),
        year: m >= 8 ? firstSemesterYear : secondSemesterYear,
      })),
    [studyMonths, language, firstSemesterYear, secondSemesterYear]
  );

  const { from, to } = useMemo(() => monthRange(viewYear, month), [viewYear, month]);
  const days = useMemo(() => daysInRange(from, to), [from, to]);

  // вњ… pending scroll to a task column after switching month/load/render
  const [pendingScrollTaskId, setPendingScrollTaskId] = useState(null);
  const idOf = (v) => String(v?._id || v || '');

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

      const [cRes, sRes, stRes, gRes, calRes, tRes, ayRes, aRes] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get(`/subjects/${subjectId}`),
        api.get('/students'),
        api.get('/grades', {
          params: { classId, subjectId, from: ymd(from), to: ymd(to), period: finalPeriod }
        }),
        api.get('/calendar-events'),
        // load all tasks for the selected period
        api.get('/tasks', {
          params: { classId, subjectId, period }
        }),
        api.get('/system-settings/academic-year').catch(() => ({ data: null })),
        api.get('/assignments'),
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
      const assn = (aRes.data || []).find(
        (a) => idOf(a.class) === String(classId) && idOf(a.subject) === String(subjectId)
      );
      const hours = Number(assn?.hours);
      setLessonSlotsPerDay(Number.isFinite(hours) ? Math.max(1, Math.floor(hours)) : 1);
      setFirstSemesterYear(Number(ayRes?.data?.firstSemesterYear || defaultFirstYear));
      setSecondSemesterYear(Number(ayRes?.data?.secondSemesterYear || defaultFirstYear + 1));

      const tList = (tRes.data || []).slice();
      tList.sort((a, b) => String(a.dateIso || '').localeCompare(String(b.dateIso || '')));
      setTasks(tList);
    } catch (e) {
      const apiMessage = e?.response?.data?.message;
      setError(apiMessage || tr.loadFailed);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, subjectId, month, finalPeriod, period, from, to, defaultFirstYear]);

  /* ===== grade map ===== */

  const gradeMap = useMemo(() => {
    const m = new Map();
    for (const g of grades) {
      const sid = g.student?._id || g.student;

      if (g.kind === 'absence' && g.date) {
        const lessonNo = Number.isFinite(Number(g.lessonNo)) && Number(g.lessonNo) >= 1
          ? Math.floor(Number(g.lessonNo))
          : 1;
        m.set(`${sid}|absence|${g.date}|${lessonNo}`, g.value);
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
      hidden: isSunday || isHoliday
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
      const isSunday = d.getDay() === 0;
      const hasHolidayEvent = calendarEvents.some((ev) => iso >= ev.startIso && iso <= ev.endIso);
      if (!isSunday && !hasHolidayEvent) {
        for (let lessonNo = 1; lessonNo <= lessonSlotsPerDay; lessonNo += 1) {
          cols.push({ type: 'day', iso, dateObj: d, lessonNo });
        }
      }

      const tlist = byDate.get(iso) || [];
      for (const t of tlist) cols.push({ type: 'task', task: t });
    }
    return cols;
  }, [days, tasks, calendarEvents, lessonSlotsPerDay]);

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
    let sum = 0;
    let count = 0;

    for (const t of semTasks) {
      const v = getVal(studentId, 'task', t._id);
      if (v === '' || v === null || v === undefined) continue;
      const n = Number(v);
      sum += Number.isFinite(n) && n >= 1 && n <= 10 ? n : 0; // 'm' counts as 0
      count += 1;
    }

    if (count < 3) return '';
    return sum / count;
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

  const onChangeAbsence = async (studentId, dateIso, lessonNo, raw) => {
    const normalized = clampAbsence(raw);
    if (normalized === null) return;

    if (normalized === '') {
      await deleteGrade({
        student: studentId,
        class: classId,
        subject: subjectId,
        kind: 'absence',
        date: dateIso,
        lessonNo
      });
      return;
    }

    await saveGrade({
      student: studentId,
      class: classId,
      subject: subjectId,
      kind: 'absence',
      date: dateIso,
      lessonNo,
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
        period: finalPeriod
      });
      return;
    }

    await saveGrade({
      student: studentId,
      class: classId,
      subject: subjectId,
      kind: 'exam',
      period: finalPeriod,
      value: normalized
    });
  };

  /* ===== tasks CRUD (modal) ===== */

  const submitTaskModal = async () => {
    if (!canManageTasks) return;
    const name = taskName.trim();
    const description = taskDesc.trim();
    const dateIso = String(taskDate || '').trim();
    const semester = Number(taskSemester);

    if (!name) return alert(tr.taskNameReq);
    if (!dateIso) return alert(tr.dateReq);
    if (![1, 2].includes(semester)) return alert(tr.semesterReq);

    try {
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
    } catch (e) {
      const msg = e?.response?.data?.message || tr.loadFailed;
      setError(msg);
      return;
    }

    hideModalById('taskModal');
    await load();
  };

  const deleteTaskById = async (taskId) => {
    if (!canManageTasks) return;
    if (!window.confirm(tr.deleteTaskConfirm)) return;
    await api.delete(`/tasks/${taskId}`);
    await load();
  };

  /* ===== go to task: switch month if needed, then scroll ===== */

  const goToTask = (t) => {
    const targetDate = new Date(t.dateIso);
    const targetMonth = targetDate.getMonth();

    setPendingScrollTaskId(t._id);

    if (month === targetMonth) {
      requestAnimationFrame(() => {
        document
          .getElementById(`task-col-${t._id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      return;
    }

    setMonth(normalizeStudyMonth(targetMonth));
  };

  /* ================= render ================= */

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!cls || !subject) return <div className="text-muted">{tr.loading}</div>;

  return (
    <div className="container-fluid py-3 journal-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-1">
            <i className="fas fa-book-open me-2"></i>
            {tr.journal}: {cls.name} - {subject.name}
          </h1>
          <div className="text-muted">
            <Link className="text-decoration-none" to={`/classes/${classId}`}>
              <i className="fa-solid fa-chevron-left me-1"></i>{tr.backToClass}
            </Link>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          {monthButtons.map((m) => {
            const active = month === m.value;
            return (
              <button
                key={m.value}
                type="button"
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setMonth(normalizeStudyMonth(m.value))}
                title={`${m.label} ${m.year}`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle journal-table">
          <thead>
            <tr>
              <th className="text-center sticky-col sticky-col-1" style={{ width: 60, minWidth: 60, whiteSpace: 'nowrap' }}>
                #
              </th>

              <th className="sticky-col sticky-col-2" style={{ width: 1, whiteSpace: 'nowrap' }}>
                <i className="fas fa-user-graduate me-1"></i>{tr.student}
              </th>

              {columns.map((c) => {
                if (c.type === 'day') {
                  const info = dayInfo(c.dateObj);
                  const tip = info.isHoliday
                    ? `${info.iso}\n${info.titles.join('\n')}`
                    : info.isSunday
                      ? `${info.iso}\n${tr.sunday}`
                      : info.iso;
                  const lessonTip = lessonSlotsPerDay > 1 ? `${tip}\n#${c.lessonNo || 1}` : tip;

                  return (
                    <th key={`d-${info.iso}-${c.lessonNo || 1}`} className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }} title={lessonTip}>
                      {lessonSlotsPerDay > 1 ? `${c.dateObj.getDate()}/${c.lessonNo}` : c.dateObj.getDate()}
                    </th>
                  );
                }

                const t = c.task;
                const title = `${t.dateIso}\n${t.name}${t.description ? `\n${t.description}` : ''}\n${tr.semester}: ${t.semester}`;

                return (
                  <th key={`t-${t._id}`} id={`task-col-${t._id}`} className="text-center table-warning" style={{ width: 1, whiteSpace: 'nowrap' }} title={title}>
                    {t.name}
                  </th>
                );
              })}

              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{tr.exam}</th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{tr.sem1}</th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{tr.sem2}</th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{tr.year}</th>
            </tr>
          </thead>

          <tbody>
            {students.map((st, index) => {
              const sem1Avg = computeSemesterAvg(st._id, tasksSem1);
              const sem2Avg = computeSemesterAvg(st._id, tasksSem2);
              const examVal = getVal(st._id, 'exam', finalPeriod);
              const yearAvg = computeYearAvg(examVal, sem1Avg, sem2Avg);

              return (
                <tr key={st._id}>
                  <td className="text-center sticky-col sticky-col-1" style={{ width: 60, minWidth: 60, whiteSpace: 'nowrap' }}>
                    {index + 1}
                  </td>

                  <td className="sticky-col sticky-col-2" style={{ whiteSpace: 'nowrap' }}>
                    {st.photo ? (
                      <img src={getFileUrl(st.photo)} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: '10%', marginRight: 8, verticalAlign: 'middle' }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: '10%', background: '#eee', color: '#bbb', marginRight: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle', fontSize: 13 }}>
                        <i className="fas fa-user-graduate"></i>
                      </div>
                    )}
                    <Link to={`/students/${st._id}`} className="text-decoration-none">
                      {st.fullName}
                    </Link>
                  </td>

                  {columns.map((c) => {
                    if (c.type === 'day') {
                      const dateIso = c.iso;
                      const lessonNo = c.lessonNo || 1;
                      const info = dayInfo(c.dateObj);
                      const tip = info.isHoliday
                        ? `${info.iso}\n${info.titles.join('\n')}`
                        : info.isSunday
                          ? `${info.iso}\n${tr.sunday}`
                          : info.iso;
                      const lessonTip = lessonSlotsPerDay > 1 ? `${tip}\n#${lessonNo}` : tip;

                      const val = getVal(st._id, 'absence', `${dateIso}|${lessonNo}`);

                      return (
                        <td key={`cell-d-${st._id}-${dateIso}-${lessonNo}`} className="text-center p-1" title={lessonTip}>
                          <input
                            className="form-control border-0 form-control-sm text-center"
                            style={{ minWidth: 44 }}
                            value={val}
                            onChange={(e) => onChangeAbsence(st._id, dateIso, lessonNo, e.target.value)}
                            placeholder=""
                          />
                        </td>
                      );
                    }

                    const t = c.task;
                    const val = getVal(st._id, 'task', t._id);

                    return (
                      <td key={`cell-t-${st._id}-${t._id}`} className="text-center p-1 table-warning" title={`${t.dateIso}\n${t.name}${t.description ? `\n${t.description}` : ''}`}>
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

                  <td className="text-center p-1">
                    <input className="form-control border-0 form-control-sm text-center" style={{ minWidth: 52 }} value={examVal} onChange={(e) => onChangeExam(st._id, e.target.value)} placeholder="" />
                  </td>

                  <td className="text-center p-1">
                    <input className="form-control border-0 form-control-sm text-center" style={{ minWidth: 52 }} value={formatAvg(sem1Avg)} readOnly placeholder="" />
                  </td>

                  <td className="text-center p-1">
                    <input className="form-control border-0 form-control-sm text-center" style={{ minWidth: 52 }} value={formatAvg(sem2Avg)} readOnly placeholder="" />
                  </td>

                  <td className="text-center p-1">
                    <input className="form-control border-0 form-control-sm text-center" style={{ minWidth: 52 }} value={formatAvg(yearAvg)} readOnly placeholder="" />
                  </td>
                </tr>
              );
            })}

            {students.length === 0 && (
              <tr>
                <td colSpan={2 + columns.length + 4} className="text-center text-muted">
                  {tr.noStudents}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-muted mt-2" style={{ fontSize: 14 }}>
        {tr.hint}
      </div>

      <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
        <div>
          <h4 className="mb-0">
            <i className="fa-solid fa-list-check me-2"></i>{tr.tasksTitle}
          </h4>
          <div className="text-muted" style={{ fontSize: 14 }}>
            {tr.total.replace('{count}', String(tasks.length))}
          </div>
        </div>

        <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#taskModal" onClick={openCreateTaskModal} disabled={!canManageTasks} title={!canManageTasks ? tr.adminOnly : ''}>
          {tr.add}
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle">
          <thead>
            <tr>
              <th style={{ width: 120 }}>{tr.date}</th>
              <th style={{ width: 90 }} className="text-center">{tr.semester}</th>
              <th>{tr.task}</th>
              <th>{tr.description}</th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{tr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t._id}>
                <td className="text-nowrap">{t.dateIso}</td>
                <td className="text-center">{t.semester}</td>
                <td>
                  <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={() => goToTask(t)} title={tr.jumpToColumn}>
                    <strong>{t.name}</strong>
                  </button>
                </td>
                <td className="text-muted">{t.description || '-'}</td>
                <td className="text-end">
                  <div className="btn-group text-nowrap" role="group">
                    <button className="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#taskModal" onClick={() => openEditTaskModal(t)} title={tr.edit} disabled={!canManageTasks}>
                      <i className="fa-solid fa-pen"></i>
                      <span className="d-none d-md-inline ms-1 text-nowrap">{tr.edit}</span>
                    </button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => deleteTaskById(t._id)} title={tr.deleteWithGrades} disabled={!canManageTasks}>
                      <i className="fa-solid fa-xmark"></i>
                      <span className="d-none d-md-inline ms-1 text-nowrap">{tr.deleteWithGrades}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  {tr.noTasks}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="modal fade" id="taskModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{taskModalMode === 'create' ? tr.addTask : tr.editTask}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label className="form-label">{tr.semester}</label>
                  <select className="form-select" value={taskSemester} onChange={(e) => setTaskSemester(e.target.value)}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label">{tr.date}</label>
                  <input type="date" className="form-control" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">{tr.taskName}</label>
                  <input className="form-control" value={taskName} onChange={(e) => setTaskName(e.target.value)} />
                </div>

                <div className="col-12">
                  <label className="form-label">{tr.description}</label>
                  <input className="form-control" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
                </div>

                <div className="col-12">
                  <div className="text-muted" style={{ fontSize: 14 }}>
                    {tr.saveHint}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">{tr.cancel}</button>
              <button type="button" className="btn btn-primary" onClick={submitTaskModal} disabled={!canManageTasks}>{tr.save}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Journal;

