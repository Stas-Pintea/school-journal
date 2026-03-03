import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import Subject from '../models/Subject.js';

async function safeUnlink(fileUrlPath) {
  if (!fileUrlPath) return;
  const fileDiskPath = path.resolve(process.cwd(), fileUrlPath.replace(/^\//, ''));
  try {
    await fs.unlink(fileDiskPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Failed to delete file:', fileDiskPath, err);
    }
  }
}

function parseSubjects(body) {
  if (!body || body.subjects == null) return undefined;
  if (Array.isArray(body.subjects)) return body.subjects;
  if (typeof body.subjects === 'string') {
    try {
      const parsed = JSON.parse(body.subjects);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function canEditTeacher(req, teacherDoc) {
  if (req.user?.role === 'ADMIN' || req.user?.role === 'DEPUTY_ADMIN') return true;
  if (req.user?.role !== 'TEACHER') return false;
  return String(teacherDoc.user || '') === String(req.user.id);
}

export const getTeachers = async (req, res) => {
  const teachers = await Teacher.find()
    .populate('subjects')
    .populate('user', 'email');
  res.json(teachers);
};

export const getTeacherById = async (req, res) => {
  const teacher = await Teacher.findById(req.params.id)
    .populate('subjects')
    .populate('user', 'email');
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  res.json(teacher);
};

export const createTeacher = async (req, res) => {
  const body = req.body || {};
  const fullName = String(body.fullName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!fullName) return res.status(400).json({ message: 'fullName is required' });
  if (!email) return res.status(400).json({ message: 'email is required' });
  if (password.length < 6) return res.status(400).json({ message: 'password must be at least 6 characters' });

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(409).json({ message: 'User with this email already exists' });

  const subjects = parseSubjects(body);
  const teacher = await Teacher.create({
    ...body,
    fullName,
    email,
    ...(subjects !== undefined ? { subjects } : {}),
    photo: req.file ? `/uploads/${req.file.filename}` : ''
  });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: email,
      email,
      passwordHash,
      role: 'TEACHER',
      teacher: teacher._id,
      isActive: true,
    });

    teacher.user = user._id;
    await teacher.save();

    const populated = await Teacher.findById(teacher._id)
      .populate('subjects')
      .populate('user', 'email');
    res.status(201).json(populated);
  } catch (err) {
    await safeUnlink(teacher.photo);
    await Teacher.findByIdAndDelete(teacher._id);
    throw err;
  }
};

export const updateTeacher = async (req, res) => {
  const body = req.body || {};
  const teacherBefore = await Teacher.findById(req.params.id);
  if (!teacherBefore) return res.status(404).json({ message: 'Teacher not found' });

  if (!canEditTeacher(req, teacherBefore)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updateData = {};

  if (body.fullName !== undefined) {
    const fullName = String(body.fullName || '').trim();
    if (!fullName) return res.status(400).json({ message: 'fullName cannot be empty' });
    updateData.fullName = fullName;
  }
  if (body.phone !== undefined) updateData.phone = String(body.phone || '').trim();
  if (body.address !== undefined) updateData.address = String(body.address || '').trim();
  if (body.birthDate !== undefined) updateData.birthDate = body.birthDate || null;
  if (body.status !== undefined) {
    const canChangeStatus = req.user?.role === 'ADMIN' || req.user?.role === 'DEPUTY_ADMIN';
    if (!canChangeStatus) {
      return res.status(403).json({ message: 'Only ADMIN can change status' });
    }
    updateData.status = String(body.status || '').trim();
  }

  const subjects = parseSubjects(body);
  if (subjects !== undefined) updateData.subjects = subjects;

  if (req.file) {
    await safeUnlink(teacherBefore.photo);
    updateData.photo = `/uploads/${req.file.filename}`;
  }

  const nextEmail = body.email !== undefined ? String(body.email || '').trim().toLowerCase() : null;
  const nextPassword = body.password !== undefined ? String(body.password || '') : null;

  if (nextEmail !== null) {
    if (!nextEmail) return res.status(400).json({ message: 'email cannot be empty' });
    const dup = await User.findOne({
      email: nextEmail,
      _id: { $ne: teacherBefore.user || null },
    });
    if (dup) return res.status(409).json({ message: 'User with this email already exists' });
    updateData.email = nextEmail;
  }

  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  ).populate('subjects');

  if (teacher?.user) {
    const userPatch = {};
    if (nextEmail !== null) {
      userPatch.email = nextEmail;
      userPatch.username = nextEmail;
    }
    if (nextPassword !== null) {
      if (nextPassword.length < 6) {
        return res.status(400).json({ message: 'password must be at least 6 characters' });
      }
      userPatch.passwordHash = await bcrypt.hash(nextPassword, 10);
    }
    if (Object.keys(userPatch).length) {
      await User.findByIdAndUpdate(teacher.user, userPatch);
    }
  }

  const populated = await Teacher.findById(teacher._id)
    .populate('subjects')
    .populate('user', 'email');
  res.json(populated);
};

export const deleteTeacher = async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

  await Promise.all([
    Assignment.deleteMany({ teacher: teacher._id }),
    Subject.updateMany({ teachers: teacher._id }, { $pull: { teachers: teacher._id } }),
    teacher.user ? User.findByIdAndDelete(teacher.user) : Promise.resolve(),
  ]);

  await safeUnlink(teacher.photo);
  await Teacher.findByIdAndDelete(req.params.id);
  res.json({ message: 'Teacher deleted' });
};


