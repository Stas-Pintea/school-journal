import Assignment from '../models/Assignment.js';

export const getAssignments = async (req, res) => {
  const assignments = await Assignment.find()
    .populate('teacher')
    .populate('class')
    .populate('subject');
  res.json(assignments);
};

export const createAssignment = async (req, res) => {
  const assignment = await Assignment.create(req.body);
  res.status(201).json(assignment);
};

export const updateAssignment = async (req, res) => {
  const assignment = await Assignment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(assignment);
};

export const deleteAssignment = async (req, res) => {
  await Assignment.findByIdAndDelete(req.params.id);
  res.json({ message: 'Assignment deleted' });
};
