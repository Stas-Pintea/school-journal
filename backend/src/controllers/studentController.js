import Student from '../models/Student.js';
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
  const parents = parseParents(body);

  const student = await Student.create({
    ...body,
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

  await safeUnlink(student.photo);
  await Student.findByIdAndDelete(req.params.id);

  res.json({ message: 'Student deleted' });
};

export const getStudentById = async (req, res) => {
  const student = await Student.findById(req.params.id).populate('class');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
};