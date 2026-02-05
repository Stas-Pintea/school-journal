import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';

import classRoutes from './routes/classRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import path from 'path';
import gradeRoutes from './routes/gradeRoutes.js';
import calendarEventRoutes from './routes/calendarEventRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ✅ статика ДО listen
app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/calendar-events', calendarEventRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(5000, () =>
  console.log('🚀 API running on http://localhost:5000')
);
