import Subject from '../models/Subject.js';
import Assignment from '../models/Assignment.js';
import Task from '../models/Task.js';
import Grade from '../models/Grade.js';
import Class from '../models/Class.js';
import Teacher from '../models/Teacher.js';

export const getSubjects = async (req, res) => {
  const subjects = await Subject.find()
    .populate('classes')
    .populate('teachers');
  res.json(subjects);
};

export const createSubject = async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ message: 'name is required' });

  const subject = await Subject.create({
    ...req.body,
    name,
    classes: Array.isArray(req.body?.classes) ? req.body.classes : [],
    teachers: Array.isArray(req.body?.teachers) ? req.body.teachers : []
  });
  res.status(201).json(subject);
};

export const updateSubject = async (req, res) => {
  const patch = { ...req.body };
  if (patch.name !== undefined) {
    patch.name = String(patch.name || '').trim();
    if (!patch.name) return res.status(400).json({ message: 'name cannot be empty' });
  }

  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    patch,
    { new: true }
  );
  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.json(subject);
};

export const deleteSubject = async (req, res) => {
  const subjectId = req.params.id;
  const subject = await Subject.findById(subjectId);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  await Promise.all([
    Assignment.deleteMany({ subject: subjectId }),
    Task.deleteMany({ subject: subjectId }),
    Grade.deleteMany({ subject: subjectId }),
    Class.updateMany({ subjects: subjectId }, { $pull: { subjects: subjectId } }),
    Teacher.updateMany({ subjects: subjectId }, { $pull: { subjects: subjectId } }),
  ]);

  await Subject.findByIdAndDelete(subjectId);
  res.json({ message: 'Subject deleted' });
};

export const getSubjectById = async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.json(subject);
};
