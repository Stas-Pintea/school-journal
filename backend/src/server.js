import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import validateEnv from './config/validateEnv.js';

import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import calendarEventRoutes from './routes/calendarEventRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import systemSettingRoutes from './routes/systemSettingRoutes.js';

import { authRequired } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

validateEnv();
connectDB();

const allowedOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON' });
  }
  next(err);
});

app.use(cookieParser());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api/auth', authRoutes);

app.use('/api/classes', authRequired, classRoutes);
app.use('/api/students', authRequired, studentRoutes);
app.use('/api/teachers', authRequired, teacherRoutes);
app.use('/api/subjects', authRequired, subjectRoutes);
app.use('/api/assignments', authRequired, assignmentRoutes);
app.use('/api/grades', authRequired, gradeRoutes);
app.use('/api/calendar-events', authRequired, calendarEventRoutes);
app.use('/api/tasks', authRequired, taskRoutes);
app.use('/api/system-settings', authRequired, systemSettingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`API running on http://${HOST}:${PORT}`);
});
