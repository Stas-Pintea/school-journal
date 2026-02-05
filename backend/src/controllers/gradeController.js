import Grade from '../models/Grade.js';

// GET /grades?classId=...&subjectId=...&from=YYYY-MM-DD&to=YYYY-MM-DD&period=2025-2026
export const getGrades = async (req, res) => {
  const { classId, subjectId, from, to, period } = req.query;

  if (!classId || !subjectId) {
    return res.status(400).json({ message: 'classId and subjectId are required' });
  }

  const q = { class: classId, subject: subjectId };
  const or = [];

  // Дневные: пропуски (и regular оставим для совместимости)
  if (from && to) {
    or.push({ kind: { $in: ['regular', 'absence'] }, date: { $gte: from, $lte: to } });
  } else {
    or.push({ kind: { $in: ['regular', 'absence'] } });
  }

  // Задачи: оценки по задачам (фильтруем по class/subject; этого достаточно)
  // Можно позже ужесточить через join по Task.dateIso, но это уже сложнее.
  or.push({ kind: 'task' });

  // Итоговые по period
  if (period) {
    or.push({ kind: { $in: ['exam', 'semester1', 'semester2', 'year'] }, period });
  }

  q.$or = or;

  const grades = await Grade.find(q)
    .populate('student', 'fullName')
    .populate('class', 'name')
    .populate('subject', 'name')
    .populate('task', 'name dateIso semester');

  res.json(grades);
};

// PUT /grades  (upsert)
// body:
//  absence: { student, class, subject, kind:'absence', date, value:'a'|'m' }
//  task:    { student, class, subject, kind:'task', task, value: 1..10|'m' }
//  exam:    { student, class, subject, kind:'exam', period, value: 1..10 }
export const upsertGrade = async (req, res) => {
  const {
    student,
    class: classId,
    subject,
    kind,
    date = null,
    period = null,
    task = null,
    value = null
  } = req.body;

  if (!student || !classId || !subject || !kind) {
    return res.status(400).json({ message: 'student, class, subject, kind are required' });
  }

  const isDateKind = kind === 'regular' || kind === 'absence';
  const isPeriodKind = kind === 'exam' || kind === 'semester1' || kind === 'semester2' || kind === 'year';
  const isTaskKind = kind === 'task';

  if (isDateKind && !date) {
    return res.status(400).json({ message: 'date is required for regular/absence' });
  }
  if (isPeriodKind && !period) {
    return res.status(400).json({ message: 'period is required for exam/semester/year' });
  }
  if (isTaskKind && !task) {
    return res.status(400).json({ message: 'task is required for task kind' });
  }

  // ✅ Валидации значений по твоим правилам:
  // absence: только 'a' или 'm' (или пусто/ null)
  if (kind === 'absence') {
    if (value === '' || value === null || value === undefined) {
      // ok: пусто — клиент обычно делает DELETE, но пусть не падает
    } else {
      const v = String(value).trim().toLowerCase();
      if (v !== 'a' && v !== 'm') {
        return res.status(400).json({ message: "Absence value must be 'a' or 'm'" });
      }
    }
  }

  // task: 1..10 или 'm'
  if (kind === 'task') {
    if (value === '' || value === null || value === undefined) {
      // ok
    } else {
      const v = String(value).trim().toLowerCase();
      if (v === 'm') {
        // ok
      } else {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 1 || n > 10) {
          return res.status(400).json({ message: "Task grade must be 1..10 or 'm'" });
        }
      }
    }
  }

  // exam/semester/year/regular: строго 1..10
  if (kind !== 'absence' && kind !== 'task') {
    if (value === '' || value === null || value === undefined) {
      // ok
    } else {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 1 || n > 10) {
        return res.status(400).json({ message: 'Grade value must be 1..10' });
      }
    }
  }

  // ✅ filter для upsert
  const filter = isDateKind
    ? { student, class: classId, subject, kind, date }
    : isTaskKind
      ? { student, class: classId, subject, kind, task }
      : { student, class: classId, subject, kind, period };

  // ✅ нормализация value под хранение
  let storedValue = null;

  if (value === '' || value === null || value === undefined) {
    storedValue = null;
  } else if (kind === 'absence') {
    storedValue = String(value).trim().toLowerCase(); // a|m
  } else if (kind === 'task') {
    const v = String(value).trim().toLowerCase();
    storedValue = v === 'm' ? 'm' : Number(v);
  } else {
    storedValue = Number(value);
  }

  const update = {
    student,
    class: classId,
    subject,
    kind,
    date: isDateKind ? date : null,
    period: isPeriodKind ? period : null,
    task: isTaskKind ? task : null,
    value: storedValue
  };

  const doc = await Grade.findOneAndUpdate(
    filter,
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
    .populate('student', 'fullName')
    .populate('task', 'name dateIso semester');

  res.json(doc);
};

// DELETE /grades  (удаление по ключу)
// body:
//  absence: { student, class, subject, kind:'absence', date }
//  task:    { student, class, subject, kind:'task', task }
//  exam:    { student, class, subject, kind:'exam', period }
export const deleteGradeByKey = async (req, res) => {
  const { student, class: classId, subject, kind, date = null, period = null, task = null } = req.body;

  if (!student || !classId || !subject || !kind) {
    return res.status(400).json({ message: 'student, class, subject, kind are required' });
  }

  const isDateKind = kind === 'regular' || kind === 'absence';
  const isTaskKind = kind === 'task';

  const filter = isDateKind
    ? { student, class: classId, subject, kind, date }
    : isTaskKind
      ? { student, class: classId, subject, kind, task }
      : { student, class: classId, subject, kind, period };

  await Grade.findOneAndDelete(filter);
  res.json({ message: 'Deleted' });
};
