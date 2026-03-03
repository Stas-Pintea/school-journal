import express from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/subjectController.js';

import { requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// рџ“– С‡С‚РµРЅРёРµ вЂ” РІСЃРµРј Р·Р°Р»РѕРіРёРЅРµРЅРЅС‹Рј
router.get('/', asyncHandler(getSubjects));
router.get('/:id', asyncHandler(getSubjectById));

// рџ”’ РёР·РјРµРЅРµРЅРёСЏ вЂ” С‚РѕР»СЊРєРѕ ADMIN
router.post('/', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(createSubject));
router.put('/:id', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(updateSubject));
router.delete('/:id', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(deleteSubject));

export default router;

