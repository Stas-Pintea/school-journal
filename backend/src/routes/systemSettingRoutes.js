import express from 'express';
import { requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { getAcademicYearSetting, upsertAcademicYearSetting } from '../controllers/systemSettingController.js';

const router = express.Router();

router.get('/academic-year', asyncHandler(getAcademicYearSetting));
router.put('/academic-year', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(upsertAcademicYearSetting));

export default router;

