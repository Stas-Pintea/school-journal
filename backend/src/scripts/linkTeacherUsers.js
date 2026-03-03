import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import Teacher from '../models/Teacher.js';
import User from '../models/User.js';

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

async function pickEmail(teacher) {
  const preferred = normalizeEmail(teacher.email);
  if (preferred) {
    const existing = await User.findOne({ email: preferred }).lean();
    if (!existing) return preferred;
    if (String(existing.teacher || '') === String(teacher._id)) return preferred;
    if (!existing.teacher && existing.role === 'TEACHER') return preferred;
  }

  const base = `teacher.${String(teacher._id).slice(-8)}@school.local`;
  let email = base;
  let i = 1;
  while (await User.exists({ email })) {
    email = `teacher.${String(teacher._id).slice(-8)}.${i}@school.local`;
    i += 1;
  }
  return email;
}

const defaultPassword = process.env.TEACHER_DEFAULT_PASSWORD;
if (!defaultPassword || defaultPassword.length < 6) {
  console.error('Set TEACHER_DEFAULT_PASSWORD in backend/.env (min 6 chars)');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);

  const teachers = await Teacher.find({
    $or: [{ user: null }, { user: { $exists: false } }],
  });

  if (!teachers.length) {
    console.log('No teachers without linked user');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const report = [];

  for (const teacher of teachers) {
    const email = await pickEmail(teacher);

    let user = await User.findOne({ email });
    if (user) {
      if (!user.teacher) {
        user.teacher = teacher._id;
        user.role = 'TEACHER';
        user.isActive = true;
        await user.save();
      }
    } else {
      user = await User.create({
        username: email,
        email,
        passwordHash,
        role: 'TEACHER',
        teacher: teacher._id,
        isActive: true,
      });
    }

    teacher.user = user._id;
    if (!teacher.email) teacher.email = email;
    await teacher.save();

    report.push({
      teacherId: String(teacher._id),
      teacherName: teacher.fullName,
      userId: String(user._id),
      email,
    });
  }

  console.log(`Linked ${report.length} teacher account(s):`);
  for (const row of report) {
    console.log(JSON.stringify(row));
  }

  process.exit(0);
} catch (err) {
  console.error('Failed to link teacher users:', err.message);
  process.exit(1);
}

