import Task from '../models/Task.js';
import Grade from '../models/Grade.js';
import Teacher from '../models/Teacher.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

async function ensureTeacherAssignmentAccess(req, classId, subjectId) {
  const role = req.user?.role;
  if (role === 'ADMIN' || role === 'DEPUTY_ADMIN') return true;
  if (role !== 'TEACHER') return false;

  const user = await User.findById(req.user.id).select('teacher').lean();
  let teacherId = user?.teacher || null;

  if (!teacherId) {
    const teacher = await Teacher.findOne({ user: req.user.id }).select('_id').lean();
    teacherId = teacher?._id || null;
  }

  if (!teacherId) return false;

  const allowed = await Assignment.exists({
    teacher: teacherId,
    class: classId,
    subject: subjectId,
  });
  return Boolean(allowed);
}

// GET /api/tasks?classId&subjectId&period&from&to
export const getTasks = async (req, res) => {
  const { classId, subjectId, period, from, to } = req.query;

  if (!classId || !subjectId) {
    return res.status(400).json({ message: 'classId and subjectId are required' });
  }

  const canAccess = await ensureTeacherAssignmentAccess(req, classId, subjectId);
  if (!canAccess) {
    return res.status(403).json({ message: 'Access denied for this journal' });
  }

  const q = { class: classId, subject: subjectId };
  if (period) q.period = period;

  if (from && to) {
    q.dateIso = { $gte: from, $lte: to };
  }

  const tasks = await Task.find(q).sort({ dateIso: 1, createdAt: 1 });
  res.json(tasks);
};

// POST /api/tasks
export const createTask = async (req, res) => {
  const { class: classId, subject, period, semester, name, description = '', dateIso } = req.body;

  if (!classId || !subject || !period || !semester || !name || !dateIso) {
    return res.status(400).json({ message: 'class, subject, period, semester, name, dateIso are required' });
  }

  const sem = Number(semester);
  if (![1, 2].includes(sem)) {
    return res.status(400).json({ message: 'semester must be 1 or 2' });
  }

  const canAccess = await ensureTeacherAssignmentAccess(req, classId, subject);
  if (!canAccess) {
    return res.status(403).json({ message: 'Access denied for this journal' });
  }

  const doc = await Task.create({
    class: classId,
    subject,
    period,
    semester: sem,
    name: String(name).trim(),
    description: String(description || ''),
    dateIso
  });

  res.status(201).json(doc);
};

// вњ… PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const { semester, name, description, dateIso } = req.body;
  const existing = await Task.findById(id).select('class subject');
  if (!existing) return res.status(404).json({ message: 'Task not found' });

  const canAccess = await ensureTeacherAssignmentAccess(req, existing.class, existing.subject);
  if (!canAccess) {
    return res.status(403).json({ message: 'Access denied for this journal' });
  }

  const patch = {};

  if (semester !== undefined) {
    const sem = Number(semester);
    if (![1, 2].includes(sem)) {
      return res.status(400).json({ message: 'semester must be 1 or 2' });
    }
    patch.semester = sem;
  }

  if (name !== undefined) {
    const n = String(name).trim();
    if (!n) return res.status(400).json({ message: 'name is required' });
    patch.name = n;
  }

  if (description !== undefined) patch.description = String(description || '');

  if (dateIso !== undefined) {
    const d = String(dateIso).trim();
    if (!d) return res.status(400).json({ message: 'dateIso is required' });
    patch.dateIso = d;
  }

  const doc = await Task.findByIdAndUpdate(id, patch, { new: true });

  res.json(doc);
};

// вњ… DELETE /api/tasks/:id (РєР°СЃРєР°РґРЅРѕ СѓРґР°Р»СЏРµРј task-РѕС†РµРЅРєРё)
export const deleteTask = async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const canAccess = await ensureTeacherAssignmentAccess(req, task.class, task.subject);
  if (!canAccess) {
    return res.status(403).json({ message: 'Access denied for this journal' });
  }

  await Grade.deleteMany({ kind: 'task', task: id }); // вњ… РєР°СЃРєР°Рґ
  await Task.findByIdAndDelete(id);

  res.json({ message: 'Deleted' });
};

