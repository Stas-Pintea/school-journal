import Class from '../models/Class.js';
import Assignment from '../models/Assignment.js';
import Task from '../models/Task.js';
import Grade from '../models/Grade.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import AcademicYearSetting from '../models/AcademicYearSetting.js';

export const getClasses = async (req, res) => {
  const classes = await Class.find().populate('subjects');
  res.json(classes);
};

const computeSemesterAverage = (taskIds, gradeByTaskId) => {
  let sum = 0;
  let count = 0;
  for (const taskId of taskIds) {
    const raw = gradeByTaskId.get(taskId);
    if (raw === null || raw === undefined || raw === '') continue;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 1 && value <= 10) {
      sum += value;
      count += 1;
    } else {
      count += 1;
    }
  }
  if (count < 3) return null;
  return Math.round((sum / count) * 100) / 100;
};

export const getClassMetrics = async (req, res) => {
  const queryPeriod = String(req.query.period || '').trim();

  const classes = await Class.find().select('_id subjects').lean();
  const classIds = classes.map((c) => String(c._id));
  const classIdSet = new Set(classIds);
  const classSubjectSetByClass = new Map(
    classes.map((c) => [
      String(c._id),
      new Set((Array.isArray(c.subjects) ? c.subjects : []).map((s) => String(s))),
    ])
  );

  let period = queryPeriod;
  if (!period) {
    const setting = await AcademicYearSetting.findOne({ key: 'academicYear' })
      .select('firstSemesterYear secondSemesterYear')
      .lean();
    const firstYear = Number(setting?.firstSemesterYear);
    const secondYear = Number(setting?.secondSemesterYear);
    if (Number.isInteger(firstYear) && Number.isInteger(secondYear)) {
      period = `${firstYear}-${secondYear}`;
    }
  }

  const students = await Student.find({ class: { $in: classes.map((c) => c._id) } })
    .select('_id class')
    .lean();

  const studentsByClass = new Map();
  for (const classId of classIds) studentsByClass.set(classId, []);
  for (const st of students) {
    const classId = String(st.class || '');
    if (!classIdSet.has(classId)) continue;
    if (!studentsByClass.has(classId)) studentsByClass.set(classId, []);
    studentsByClass.get(classId).push(String(st._id));
  }

  const assignments = await Assignment.find({ class: { $in: classes.map((c) => c._id) } })
    .select('class subject')
    .lean();

  const allowedSubjectSetByClass = new Map();
  for (const cls of classes) {
    const classId = String(cls._id);
    const classSubjects = new Set(
      (Array.isArray(cls.subjects) ? cls.subjects : []).map((s) => String(s))
    );
    const assigned = new Set(
      assignments
        .filter((a) => String(a.class || '') === classId)
        .map((a) => String(a.subject || ''))
        .filter((sid) => classSubjects.has(sid))
    );
    allowedSubjectSetByClass.set(classId, assigned);
  }

  const tasks = period
    ? await Task.find({
        class: { $in: classes.map((c) => c._id) },
        period,
      })
        .select('_id class subject semester')
        .lean()
    : [];

  const taskMetaById = new Map();
  for (const t of tasks) {
    const taskId = String(t._id);
    const classId = String(t.class || '');
    const subjectId = String(t.subject || '');
    if (!classIdSet.has(classId)) continue;
    if (!allowedSubjectSetByClass.get(classId)?.has(subjectId)) continue;
    taskMetaById.set(taskId, {
      classId,
      subjectId,
      semester: Number(t.semester) === 1 ? 1 : 2,
    });
  }

  const taskIds = [...taskMetaById.keys()];
  const classObjectIds = classes.map((c) => c._id);

  const [examGrades, taskGrades, absenceGrades] = await Promise.all([
    period
      ? Grade.find({
          class: { $in: classObjectIds },
          kind: 'exam',
          period,
        })
          .select('student class subject value')
          .lean()
      : [],
    taskIds.length
      ? Grade.find({
          class: { $in: classObjectIds },
          kind: 'task',
          task: { $in: taskIds },
        })
          .select('student class task value')
          .lean()
      : [],
    Grade.find({
      class: { $in: classObjectIds },
      kind: 'absence',
      value: { $in: ['a', 'm'] },
    })
      .select('class subject')
      .lean(),
  ]);

  const examByStudentClassSubject = new Map();
  for (const g of examGrades) {
    const classId = String(g.class || '');
    const subjectId = String(g.subject || '');
    if (!allowedSubjectSetByClass.get(classId)?.has(subjectId)) continue;
    const key = `${String(g.student)}|${classId}|${subjectId}`;
    examByStudentClassSubject.set(key, g.value);
  }

  const taskGradesByStudentClassSubject = new Map();
  for (const g of taskGrades) {
    const taskMeta = taskMetaById.get(String(g.task || ''));
    if (!taskMeta) continue;
    const studentId = String(g.student || '');
    const key = `${studentId}|${taskMeta.classId}|${taskMeta.subjectId}`;
    if (!taskGradesByStudentClassSubject.has(key)) {
      taskGradesByStudentClassSubject.set(key, { sem1: new Map(), sem2: new Map() });
    }
    const bucket =
      taskMeta.semester === 1
        ? taskGradesByStudentClassSubject.get(key).sem1
        : taskGradesByStudentClassSubject.get(key).sem2;
    bucket.set(String(g.task), g.value);
  }

  const taskIdsByClassSubjectSemester = new Map();
  for (const [taskId, meta] of taskMetaById.entries()) {
    const key = `${meta.classId}|${meta.subjectId}|${meta.semester}`;
    if (!taskIdsByClassSubjectSemester.has(key)) taskIdsByClassSubjectSemester.set(key, []);
    taskIdsByClassSubjectSemester.get(key).push(taskId);
  }

  const studentAvgByClass = new Map();
  const studentSem1AvgByClass = new Map();
  const studentSem2AvgByClass = new Map();
  for (const classId of classIds) {
    const subjectIds = [...(allowedSubjectSetByClass.get(classId) || new Set())];
    const studentIds = studentsByClass.get(classId) || [];
    const perStudentAverages = [];
    const perStudentSem1Averages = [];
    const perStudentSem2Averages = [];

    for (const studentId of studentIds) {
      const yearValues = [];
      const sem1Values = [];
      const sem2Values = [];
      for (const subjectId of subjectIds) {
        const studentSubjectKey = `${studentId}|${classId}|${subjectId}`;
        const taskMap = taskGradesByStudentClassSubject.get(studentSubjectKey) || {
          sem1: new Map(),
          sem2: new Map(),
        };
        const sem1TaskIds = taskIdsByClassSubjectSemester.get(`${classId}|${subjectId}|1`) || [];
        const sem2TaskIds = taskIdsByClassSubjectSemester.get(`${classId}|${subjectId}|2`) || [];
        const sem1 = computeSemesterAverage(sem1TaskIds, taskMap.sem1);
        const sem2 = computeSemesterAverage(sem2TaskIds, taskMap.sem2);
        if (Number.isFinite(sem1)) sem1Values.push(sem1);
        if (Number.isFinite(sem2)) sem2Values.push(sem2);
        const examRaw = examByStudentClassSubject.get(studentSubjectKey);
        const exam = Number(examRaw);

        if (!Number.isFinite(exam) || !Number.isFinite(sem1) || !Number.isFinite(sem2)) continue;
        const year = Math.round((((exam + sem1 + sem2) / 3) * 100)) / 100;
        yearValues.push(year);
      }

      if (yearValues.length) {
        const avg =
          yearValues.reduce((sum, value) => sum + value, 0) / yearValues.length;
        perStudentAverages.push(avg);
      }
      if (sem1Values.length) {
        const avgSem1 = sem1Values.reduce((sum, value) => sum + value, 0) / sem1Values.length;
        perStudentSem1Averages.push(avgSem1);
      }
      if (sem2Values.length) {
        const avgSem2 = sem2Values.reduce((sum, value) => sum + value, 0) / sem2Values.length;
        perStudentSem2Averages.push(avgSem2);
      }
    }

    const overallPerformance = perStudentAverages.length
      ? perStudentAverages.reduce((sum, value) => sum + value, 0) / perStudentAverages.length
      : null;
    const overallSemester1 = perStudentSem1Averages.length
      ? perStudentSem1Averages.reduce((sum, value) => sum + value, 0) / perStudentSem1Averages.length
      : null;
    const overallSemester2 = perStudentSem2Averages.length
      ? perStudentSem2Averages.reduce((sum, value) => sum + value, 0) / perStudentSem2Averages.length
      : null;
    studentAvgByClass.set(classId, overallPerformance);
    studentSem1AvgByClass.set(classId, overallSemester1);
    studentSem2AvgByClass.set(classId, overallSemester2);
  }

  const absencesByClass = new Map();
  for (const g of absenceGrades) {
    const classId = String(g.class || '');
    const subjectId = String(g.subject || '');
    if (!classIdSet.has(classId)) continue;
    if (!classSubjectSetByClass.get(classId)?.has(subjectId)) continue;
    absencesByClass.set(classId, (absencesByClass.get(classId) || 0) + 1);
  }

  const metrics = {};
  for (const classId of classIds) {
    metrics[classId] = {
      overallPerformance: studentAvgByClass.get(classId) ?? null,
      overallSemester1: studentSem1AvgByClass.get(classId) ?? null,
      overallSemester2: studentSem2AvgByClass.get(classId) ?? null,
      totalAbsences: absencesByClass.get(classId) || 0,
    };
  }

  res.json({ period: period || null, metrics });
};

export const getPerformanceTrend = async (req, res) => {
  const queryPeriod = String(req.query.period || '').trim();

  const classes = await Class.find().select('_id subjects').lean();
  const classObjectIds = classes.map((c) => c._id);

  let period = queryPeriod;

  if (!period) {
    const setting = await AcademicYearSetting.findOne({ key: 'academicYear' })
      .select('firstSemesterYear secondSemesterYear')
      .lean();
    const firstYear = Number(setting?.firstSemesterYear);
    const secondYear = Number(setting?.secondSemesterYear);
    if (Number.isInteger(firstYear) && Number.isInteger(secondYear)) {
      period = `${firstYear}-${secondYear}`;
    }
  }

  const assignments = await Assignment.find({ class: { $in: classObjectIds } })
    .select('class subject')
    .lean();

  const classSubjectsByClass = new Map(
    classes.map((c) => [
      String(c._id),
      new Set((Array.isArray(c.subjects) ? c.subjects : []).map((s) => String(s))),
    ])
  );

  const allowedPair = new Set();
  for (const a of assignments) {
    const classId = String(a.class || '');
    const subjectId = String(a.subject || '');
    if (!classId || !subjectId) continue;
    if (!classSubjectsByClass.get(classId)?.has(subjectId)) continue;
    allowedPair.add(`${classId}|${subjectId}`);
  }

  const tasks = period
    ? await Task.find({
        class: { $in: classObjectIds },
        period,
      })
        .select('_id class subject dateIso semester')
        .lean()
    : [];

  const taskMetaById = new Map();
  const dateSetBySemester = new Map([
    [1, new Set()],
    [2, new Set()],
  ]);

  for (const t of tasks) {
    const classId = String(t.class || '');
    const subjectId = String(t.subject || '');
    if (!allowedPair.has(`${classId}|${subjectId}`)) continue;
    const dateIso = String(t.dateIso || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) continue;
    const semester = Number(t.semester) === 1 ? 1 : 2;
    taskMetaById.set(String(t._id), { dateIso, semester });
    dateSetBySemester.get(semester).add(dateIso);
  }

  const taskIds = [...taskMetaById.keys()];
  const grades = taskIds.length
    ? await Grade.find({
        class: { $in: classObjectIds },
        kind: 'task',
        task: { $in: taskIds },
      })
        .select('task value')
        .lean()
    : [];

  const aggBySemesterAndDate = new Map([
    [1, new Map()],
    [2, new Map()],
  ]);

  for (const g of grades) {
    const meta = taskMetaById.get(String(g.task || ''));
    if (!meta) continue;
    const value = Number(g.value);
    if (!Number.isFinite(value) || value < 1 || value > 10) continue;
    const semMap = aggBySemesterAndDate.get(meta.semester);
    if (!semMap.has(meta.dateIso)) semMap.set(meta.dateIso, { sum: 0, count: 0 });
    const agg = semMap.get(meta.dateIso);
    agg.sum += value;
    agg.count += 1;
  }

  const buildSemesterPoints = (semester) => {
    const dates = [...(dateSetBySemester.get(semester) || new Set())].sort();
    const semAgg = aggBySemesterAndDate.get(semester) || new Map();
    return dates.map((dateIso) => {
      const agg = semAgg.get(dateIso);
      const value = agg && agg.count > 0 ? Math.round((agg.sum / agg.count) * 100) / 100 : null;
      return { date: dateIso, value };
    });
  };

  const semester1 = buildSemesterPoints(1);
  const semester2 = buildSemesterPoints(2);
  const points = [...semester1, ...semester2];

  res.json({ period: period || null, semester1, semester2, points });
};

export const getDashboardSummary = async (req, res) => {
  const queryPeriod = String(req.query.period || '').trim();

  const [classesCount, studentsCount, teachersCount, subjectsCount, assignments, setting] =
    await Promise.all([
      Class.countDocuments({}),
      Student.countDocuments({}),
      Teacher.countDocuments({}),
      Subject.countDocuments({}),
      Assignment.find().select('class subject hours').lean(),
      AcademicYearSetting.findOne({ key: 'academicYear' })
        .select('firstSemesterYear secondSemesterYear')
        .lean(),
    ]);

  let period = queryPeriod;
  const firstYear = Number(setting?.firstSemesterYear);
  const secondYear = Number(setting?.secondSemesterYear);
  if (!period && Number.isInteger(firstYear) && Number.isInteger(secondYear)) {
    period = `${firstYear}-${secondYear}`;
  }

  const totalHours = (assignments || []).reduce((sum, a) => sum + (Number(a.hours) || 0), 0);

  const classes = await Class.find().select('_id subjects').lean();
  const classObjectIds = classes.map((c) => c._id);
  const classSubjectsByClass = new Map(
    classes.map((c) => [
      String(c._id),
      new Set((Array.isArray(c.subjects) ? c.subjects : []).map((s) => String(s))),
    ])
  );

  const allowedPair = new Set();
  for (const a of assignments) {
    const classId = String(a.class || '');
    const subjectId = String(a.subject || '');
    if (!classId || !subjectId) continue;
    if (!classSubjectsByClass.get(classId)?.has(subjectId)) continue;
    allowedPair.add(`${classId}|${subjectId}`);
  }

  const tasks = period
    ? await Task.find({
        class: { $in: classObjectIds },
        period,
      })
        .select('_id class subject dateIso semester')
        .lean()
    : [];

  const taskMetaById = new Map();
  const perfDateSetBySemester = new Map([
    [1, new Set()],
    [2, new Set()],
  ]);
  for (const t of tasks) {
    const classId = String(t.class || '');
    const subjectId = String(t.subject || '');
    if (!allowedPair.has(`${classId}|${subjectId}`)) continue;
    const dateIso = String(t.dateIso || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) continue;
    const semester = Number(t.semester) === 1 ? 1 : 2;
    taskMetaById.set(String(t._id), { dateIso, semester });
    perfDateSetBySemester.get(semester).add(dateIso);
  }

  const taskIds = [...taskMetaById.keys()];
  const taskGrades = taskIds.length
    ? await Grade.find({
        class: { $in: classObjectIds },
        kind: 'task',
        task: { $in: taskIds },
      })
        .select('task value')
        .lean()
    : [];

  const perfAggBySemesterAndDate = new Map([
    [1, new Map()],
    [2, new Map()],
  ]);
  for (const g of taskGrades) {
    const meta = taskMetaById.get(String(g.task || ''));
    if (!meta) continue;
    const value = Number(g.value);
    if (!Number.isFinite(value) || value < 1 || value > 10) continue;
    const semMap = perfAggBySemesterAndDate.get(meta.semester);
    if (!semMap.has(meta.dateIso)) semMap.set(meta.dateIso, { sum: 0, count: 0 });
    const agg = semMap.get(meta.dateIso);
    agg.sum += value;
    agg.count += 1;
  }

  const buildPerf = (semester) => {
    const dates = [...(perfDateSetBySemester.get(semester) || new Set())].sort();
    const semAgg = perfAggBySemesterAndDate.get(semester) || new Map();
    return dates.map((dateIso) => {
      const agg = semAgg.get(dateIso);
      const value = agg && agg.count > 0 ? Math.round((agg.sum / agg.count) * 100) / 100 : null;
      return { date: dateIso, value };
    });
  };

  const absenceGrades = await Grade.find({
    class: { $in: classObjectIds },
    kind: 'absence',
    value: { $in: ['a', 'm'] },
    date: { $type: 'string' },
  })
    .select('class subject date')
    .lean();

  const periodMatch = /^(\d{4})-(\d{4})$/.exec(period || '');
  const pFirstYear = periodMatch ? Number(periodMatch[1]) : null;
  const pSecondYear = periodMatch ? Number(periodMatch[2]) : null;
  const inferSemesterByDate = (dateIso) => {
    const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(String(dateIso || ''));
    if (!m) return null;
    const y = Number(m[1]);
    const mm = Number(m[2]);
    if (Number.isInteger(pFirstYear) && Number.isInteger(pSecondYear)) {
      if (y === pFirstYear && mm >= 9 && mm <= 12) return 1;
      if (y === pSecondYear && mm >= 1 && mm <= 5) return 2;
      return null;
    }
    return mm >= 9 ? 1 : 2;
  };

  const absAggBySemesterAndDate = new Map([
    [1, new Map()],
    [2, new Map()],
  ]);
  for (const g of absenceGrades) {
    const classId = String(g.class || '');
    const subjectId = String(g.subject || '');
    if (!allowedPair.has(`${classId}|${subjectId}`)) continue;
    const dateIso = String(g.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) continue;
    const sem = inferSemesterByDate(dateIso);
    if (![1, 2].includes(sem)) continue;
    const semMap = absAggBySemesterAndDate.get(sem);
    semMap.set(dateIso, (semMap.get(dateIso) || 0) + 1);
  }

  const buildAbs = (semester) => {
    const semMap = absAggBySemesterAndDate.get(semester) || new Map();
    return [...semMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({ date, value }));
  };

  const performanceSemester1 = buildPerf(1);
  const performanceSemester2 = buildPerf(2);
  const absencesSemester1 = buildAbs(1);
  const absencesSemester2 = buildAbs(2);

  res.json({
    period: period || null,
    stats: {
      classes: classesCount,
      students: studentsCount,
      teachers: teachersCount,
      subjects: subjectsCount,
      assignments: assignments.length,
      totalHours,
    },
    performance: {
      semester1: performanceSemester1,
      semester2: performanceSemester2,
    },
    absences: {
      semester1: absencesSemester1,
      semester2: absencesSemester2,
    },
  });
};

export const getClassById = async (req, res) => {
  const cls = await Class.findById(req.params.id).populate('subjects');
  if (!cls) return res.status(404).json({ message: 'Class not found' });
  res.json(cls);
};

export const createClass = async (req, res) => {
  const { name, subjects } = req.body;
  const trimmedName = String(name || '').trim();

  if (!trimmedName) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newClass = await Class.create({
    name: trimmedName,
    subjects: Array.isArray(subjects) ? subjects : []
  });

  const populated = await Class.findById(newClass._id).populate('subjects');
  res.status(201).json(populated);
};

export const updateClass = async (req, res) => {
  const { name, subjects } = req.body;
  const patch = {};

  if (name !== undefined) {
    const trimmedName = String(name || '').trim();
    if (!trimmedName) return res.status(400).json({ message: 'name cannot be empty' });
    patch.name = trimmedName;
  }

  if (subjects !== undefined) {
    patch.subjects = Array.isArray(subjects) ? subjects : [];
  }

  const updated = await Class.findByIdAndUpdate(
    req.params.id,
    patch,
    { new: true }
  ).populate('subjects');

  if (!updated) return res.status(404).json({ message: 'Class not found' });
  res.json(updated);
};

export const deleteClass = async (req, res) => {
  const classId = req.params.id;

  const cls = await Class.findById(classId);
  if (!cls) return res.status(404).json({ message: 'Class not found' });

  await Promise.all([
    Assignment.deleteMany({ class: classId }),
    Task.deleteMany({ class: classId }),
    Grade.deleteMany({ class: classId }),
    Subject.updateMany({ classes: classId }, { $pull: { classes: classId } }),
    Student.updateMany({ class: classId }, { $unset: { class: '' } }),
  ]);

  await Class.findByIdAndDelete(classId);
  res.json({ message: 'Class deleted' });
};
