import Assignment from '../models/Assignment.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

export const getAssignments = async (req, res) => {
  const assignments = await Assignment.find()
    .populate('teacher')
    .populate('class')
    .populate('subject');
  res.json(assignments);
};

export const createAssignment = async (req, res) => {
  const { teacher, class: classId, subject, hours } = req.body;
  const parsedHours = Number(hours);

  if (!teacher || !classId || !subject) {
    return res.status(400).json({ message: 'teacher, class, subject are required' });
  }
  if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
    return res.status(400).json({ message: 'hours must be a positive number' });
  }

  const [teacherExists, classExists, subjectExists] = await Promise.all([
    Teacher.exists({ _id: teacher }),
    Class.exists({ _id: classId }),
    Subject.exists({ _id: subject }),
  ]);

  if (!teacherExists || !classExists || !subjectExists) {
    return res.status(400).json({ message: 'teacher, class or subject not found' });
  }

  const assignment = await Assignment.create({ teacher, class: classId, subject, hours: parsedHours });
  res.status(201).json(assignment);
};

export const updateAssignment = async (req, res) => {
  const patch = {};
  if (req.body.teacher !== undefined) patch.teacher = req.body.teacher;
  if (req.body.class !== undefined) patch.class = req.body.class;
  if (req.body.subject !== undefined) patch.subject = req.body.subject;
  if (req.body.hours !== undefined) {
    const parsedHours = Number(req.body.hours);
    if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
      return res.status(400).json({ message: 'hours must be a positive number' });
    }
    patch.hours = parsedHours;
  }

  const assignment = await Assignment.findByIdAndUpdate(
    req.params.id,
    patch,
    { new: true }
  );
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  res.json(assignment);
};

export const deleteAssignment = async (req, res) => {
  const deleted = await Assignment.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Assignment not found' });
  res.json({ message: 'Assignment deleted' });
};
