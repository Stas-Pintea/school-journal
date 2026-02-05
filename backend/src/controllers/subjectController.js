import Subject from '../models/Subject.js';

export const getSubjects = async (req, res) => {
  const subjects = await Subject.find()
    .populate('classes')
    .populate('teachers');
  res.json(subjects);
};

export const createSubject = async (req, res) => {
  const subject = await Subject.create(req.body);
  res.status(201).json(subject);
};

export const updateSubject = async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(subject);
};

export const deleteSubject = async (req, res) => {
  await Subject.findByIdAndDelete(req.params.id);
  res.json({ message: 'Subject deleted' });
};

export const getSubjectById = async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.json(subject);
};
