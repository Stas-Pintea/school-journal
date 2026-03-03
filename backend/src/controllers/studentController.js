import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Grade from '../models/Grade.js';
import Task from '../models/Task.js';
import Assignment from '../models/Assignment.js';
import fs from 'fs/promises';
import path from 'path';

async function safeUnlink(fileUrlPath) {
  // fileUrlPath хранится как "/uploads/xxxx.jpg"
  if (!fileUrlPath) return;

  const fileDiskPath = path.resolve(process.cwd(), fileUrlPath.replace(/^\//, ''));

  try {
    await fs.unlink(fileDiskPath);
  } catch (err) {
    // Если файла нет — не падаем
    if (err.code !== 'ENOENT') {
      console.error('❌ Failed to delete file:', fileDiskPath, err);
    }
  }
}

function parseParents(body) {
  // parents приходит JSON-строкой из FormData
  if (!body || body.parents == null) return [];

  if (Array.isArray(body.parents)) {
    // на всякий случай, если кто-то когда-то отправит массивом
    return body.parents;
  }

  if (typeof body.parents === 'string') {
    try {
      const parsed = JSON.parse(body.parents);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  return [];
}

/**
 * GET /api/students
 */
export const getStudents = async (req, res) => {
  const students = await Student.find().populate('class');
  res.json(students);
};

/**
 * POST /api/students
 * multipart/form-data
 */
export const createStudent = async (req, res) => {
  const body = req.body || {};
  const fullName = String(body.fullName || '').trim();
  if (!fullName) return res.status(400).json({ message: 'fullName is required' });
  if (!body.class) return res.status(400).json({ message: 'class is required' });

  const classExists = await Class.exists({ _id: body.class });
  if (!classExists) return res.status(400).json({ message: 'class not found' });

  const parents = parseParents(body);

  const student = await Student.create({
    ...body,
    fullName,
    parents,
    photo: req.file ? `/uploads/${req.file.filename}` : ''
  });

  res.status(201).json(student);
};

/**
 * PUT /api/students/:id
 * multipart/form-data
 */
export const updateStudent = async (req, res) => {
  const body = req.body || {};

  const studentBefore = await Student.findById(req.params.id);
  if (!studentBefore) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const updateData = {
    ...body
  };

  if (body.fullName !== undefined) {
    const fullName = String(body.fullName || '').trim();
    if (!fullName) return res.status(400).json({ message: 'fullName cannot be empty' });
    updateData.fullName = fullName;
  }

  if (body.class !== undefined && body.class) {
    const classExists = await Class.exists({ _id: body.class });
    if (!classExists) return res.status(400).json({ message: 'class not found' });
  }

  // parents если пришёл строкой — парсим
  if (body.parents != null) {
    updateData.parents = parseParents(body);
  }

  // если загружаем новое фото — удаляем старое
  if (req.file) {
    await safeUnlink(studentBefore.photo);
    updateData.photo = `/uploads/${req.file.filename}`;
  }

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  res.json(student);
};

/**
 * DELETE /api/students/:id
 */
export const deleteStudent = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  await Grade.deleteMany({ student: student._id });
  await safeUnlink(student.photo);
  await Student.findByIdAndDelete(req.params.id);

  res.json({ message: 'Student deleted' });
};

export const getStudentById = async (req, res) => {
  const student = await Student.findById(req.params.id).populate('class');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
};

export const getStudentPerformance = async (req, res) => {
  const { id } = req.params;
  const queryPeriod = String(req.query.period || '').trim();

  const student = await Student.findById(id).select('class').lean();
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (!student.class) return res.json({ period: queryPeriod || null, rows: [] });

  const cls = await Class.findById(student.class).populate('subjects', 'name').lean();
  if (!cls) return res.json({ period: queryPeriod || null, rows: [] });

  let period = queryPeriod;
  if (!period) {
    const latest = await Grade.findOne({
      student: id,
      class: student.class,
      kind: { $in: ['exam', 'semester1', 'semester2', 'year'] },
      period: { $type: 'string' },
    }).sort({ period: -1 }).select('period').lean();
    period = latest?.period || null;
  }

  const subjects = Array.isArray(cls.subjects) ? cls.subjects : [];
  const classSubjectIds = new Set(subjects.map((s) => String(s._id)));

  const assignments = await Assignment.find({ class: student.class }).select('subject').lean();
  const assignedSubjectIds = new Set(
    assignments
      .map((a) => (a?.subject ? String(a.subject) : null))
      .filter(Boolean)
  );

  const allowedSubjectIds = [...classSubjectIds].filter((sid) => assignedSubjectIds.has(sid));

  const grades = period
    ? await Grade.find({
        student: id,
        class: student.class,
        subject: { $in: allowedSubjectIds },
        $or: [
          { kind: 'task' },
          { kind: { $in: ['exam', 'semester1', 'semester2', 'year'] }, period },
        ],
      }).select('subject kind value task').lean()
    : [];

  const tasks = period
    ? await Task.find({
        class: student.class,
        subject: { $in: allowedSubjectIds },
        period,
      }).select('_id subject semester').lean()
    : [];

  const bySubject = new Map();
  const taskInfoById = new Map();
  for (const t of tasks) {
    taskInfoById.set(String(t._id), {
      subject: String(t.subject),
      semester: Number(t.semester),
    });
  }

  const taskGradesBySubject = new Map(); // { sid: { s1:[...], s2:[...] } }
  for (const g of grades) {
    const sid = String(g.subject);
    if (!bySubject.has(sid)) bySubject.set(sid, {});
    bySubject.get(sid)[g.kind] = g.value;

    if (g.kind === 'task' && g.task) {
      const taskMeta = taskInfoById.get(String(g.task));
      if (!taskMeta) continue;
      if (!taskGradesBySubject.has(sid)) taskGradesBySubject.set(sid, { s1: [], s2: [] });
      const bucket = taskMeta.semester === 1 ? taskGradesBySubject.get(sid).s1 : taskGradesBySubject.get(sid).s2;
      const n = Number(g.value);
      bucket.push(Number.isFinite(n) && n >= 1 && n <= 10 ? n : 0);
    }
  }

  const avg = (sum, count) => (count >= 3 ? Math.round((sum / count) * 100) / 100 : null);

  const rows = subjects
    .filter((s) => allowedSubjectIds.includes(String(s._id)))
    .map((s) => {
    const sid = String(s._id);
    const vals = bySubject.get(sid) || {};
    const taskVals = taskGradesBySubject.get(sid) || { s1: [], s2: [] };
    const computedSem1 = avg(taskVals.s1.reduce((a, b) => a + b, 0), taskVals.s1.length);
    const computedSem2 = avg(taskVals.s2.reduce((a, b) => a + b, 0), taskVals.s2.length);

    const semester1 = computedSem1;
    const semester2 = computedSem2;
    const exam = vals.exam ?? null;
    const examNum = Number(exam);
    const sem1Num = Number(semester1);
    const sem2Num = Number(semester2);
    const computedYear =
      Number.isFinite(examNum) && Number.isFinite(sem1Num) && Number.isFinite(sem2Num)
        ? Math.round(((examNum + sem1Num + sem2Num) / 3) * 100) / 100
        : null;

    return {
      subjectId: sid,
      subjectName: s.name || '-',
      exam,
      semester1,
      semester2,
      year: computedYear,
    };
    });

  res.json({ period, rows });
};
