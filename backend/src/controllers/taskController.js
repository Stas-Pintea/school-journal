import Task from '../models/Task.js';
import Grade from '../models/Grade.js';

// GET /api/tasks?classId&subjectId&period&from&to
export const getTasks = async (req, res) => {
  const { classId, subjectId, period, from, to } = req.query;

  if (!classId || !subjectId) {
    return res.status(400).json({ message: 'classId and subjectId are required' });
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

// ✅ PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const { semester, name, description, dateIso } = req.body;

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
  if (!doc) return res.status(404).json({ message: 'Task not found' });

  res.json(doc);
};

// ✅ DELETE /api/tasks/:id (каскадно удаляем task-оценки)
export const deleteTask = async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  await Grade.deleteMany({ kind: 'task', task: id }); // ✅ каскад
  await Task.findByIdAndDelete(id);

  res.json({ message: 'Deleted' });
};
