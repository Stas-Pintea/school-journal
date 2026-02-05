import express from 'express';
import upload from '../config/upload.js';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.js';

const router = express.Router();

router.get('/', getStudents);
router.get('/:id', getStudentById);

router.post('/', upload.single('photo'), createStudent);
router.put('/:id', upload.single('photo'), updateStudent);

router.delete('/:id', deleteStudent);

export default router;
