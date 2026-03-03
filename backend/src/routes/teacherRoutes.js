import express from 'express';
import upload from '../config/upload.js';
import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
} from '../controllers/teacherController.js';

import { requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// рџ“– С‡С‚РµРЅРёРµ вЂ” РІСЃРµРј Р·Р°Р»РѕРіРёРЅРµРЅРЅС‹Рј
router.get('/', asyncHandler(getTeachers));
router.get('/:id', asyncHandler(getTeacherById));

// рџ”’ РёР·РјРµРЅРµРЅРёСЏ вЂ” С‚РѕР»СЊРєРѕ ADMIN
router.post('/', requireRole('ADMIN', 'DEPUTY_ADMIN'), upload.single('photo'), asyncHandler(createTeacher));
router.put('/:id', requireRole('ADMIN', 'DEPUTY_ADMIN', 'TEACHER'), upload.single('photo'), asyncHandler(updateTeacher));
router.delete('/:id', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(deleteTeacher));

export default router;

