import Class from '../models/Class.js';

export const getClasses = async (req, res) => {
  const classes = await Class.find().populate('subjects');
  res.json(classes);
};

export const getClassById = async (req, res) => {
  const cls = await Class.findById(req.params.id).populate('subjects');
  if (!cls) return res.status(404).json({ message: 'Class not found' });
  res.json(cls);
};

export const createClass = async (req, res) => {
  const { name, subjects } = req.body;

  const newClass = await Class.create({
    name,
    subjects: Array.isArray(subjects) ? subjects : []
  });

  const populated = await Class.findById(newClass._id).populate('subjects');
  res.status(201).json(populated);
};

export const updateClass = async (req, res) => {
  const { name, subjects } = req.body;

  const updated = await Class.findByIdAndUpdate(
    req.params.id,
    {
      ...(name !== undefined ? { name } : {}),
      ...(subjects !== undefined
        ? { subjects: Array.isArray(subjects) ? subjects : [] }
        : {})
    },
    { new: true }
  ).populate('subjects');

  if (!updated) return res.status(404).json({ message: 'Class not found' });
  res.json(updated);
};

export const deleteClass = async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.json({ message: 'Class deleted' });
};
