import Teacher from '../models/Teacher.js';
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

function parseSubjects(body) {
  if (!body || body.subjects == null) return undefined;

  if (Array.isArray(body.subjects)) {
    // если вдруг пришло массивом
    return body.subjects;
  }

  if (typeof body.subjects === 'string') {
    try {
      const parsed = JSON.parse(body.subjects);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return undefined;
    }
  }

  return undefined;
}

/**
 * GET /api/teachers
 */
export const getTeachers = async (req, res) => {
  const teachers = await Teacher.find().populate('subjects');
  res.json(teachers);
};

/**
 * GET /api/teachers/:id
 */
export const getTeacherById = async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate('subjects');
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  res.json(teacher);
};

/**
 * POST /api/teachers
 * multipart/form-data
 */
export const createTeacher = async (req, res) => {
  const body = req.body || {};

  const subjects = parseSubjects(body);

  const teacher = await Teacher.create({
    ...body,
    ...(subjects !== undefined ? { subjects } : {}),
    photo: req.file ? `/uploads/${req.file.filename}` : ''
  });

  res.status(201).json(teacher);
};

/**
 * PUT /api/teachers/:id
 * multipart/form-data
 */
export const updateTeacher = async (req, res) => {
  const body = req.body || {};

  const teacherBefore = await Teacher.findById(req.params.id);
  if (!teacherBefore) {
    return res.status(404).json({ message: 'Teacher not found' });
  }

  const updateData = { ...body };

  // subjects JSON-string -> array
  const subjects = parseSubjects(body);
  if (subjects !== undefined) {
    updateData.subjects = subjects;
  }

  // новое фото -> удаляем старое
  if (req.file) {
    await safeUnlink(teacherBefore.photo);
    updateData.photo = `/uploads/${req.file.filename}`;
  }

  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  ).populate('subjects');

  res.json(teacher);
};

/**
 * DELETE /api/teachers/:id
 */
export const deleteTeacher = async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({ message: 'Teacher not found' });
  }

  await safeUnlink(teacher.photo);
  await Teacher.findByIdAndDelete(req.params.id);

  res.json({ message: 'Teacher deleted' });
};
