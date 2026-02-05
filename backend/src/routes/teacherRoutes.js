import express from 'express';
import upload from '../config/upload.js';
import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
} from '../controllers/teacherController.js';

const router = express.Router();

router.get('/', getTeachers);
router.get('/:id', getTeacherById);

router.post('/', upload.single('photo'), createTeacher);
router.put('/:id', upload.single('photo'), updateTeacher);

router.delete('/:id', deleteTeacher);

export default router;
