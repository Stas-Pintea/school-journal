import express from 'express';
import {
  getGrades,
  upsertGrade,
  deleteGradeByKey
} from '../controllers/gradeController.js';

import { requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// рџ“– РїСЂРѕСЃРјРѕС‚СЂ РѕС†РµРЅРѕРє вЂ” ADMIN Рё TEACHER
router.get('/', asyncHandler(getGrades));

// вњЏпёЏ СЃРѕР·РґР°РЅРёРµ / РѕР±РЅРѕРІР»РµРЅРёРµ РѕС†РµРЅРєРё вЂ” ADMIN Рё TEACHER
router.put('/', requireRole('ADMIN', 'DEPUTY_ADMIN', 'TEACHER'), asyncHandler(upsertGrade));

// рџ—‘пёЏ СѓРґР°Р»РµРЅРёРµ РѕС†РµРЅРєРё вЂ” РўРћР›Р¬РљРћ ADMIN
router.delete('/', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(deleteGradeByKey));

export default router;

