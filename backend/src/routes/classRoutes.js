import express from 'express';
import {
  getClasses,
  getClassMetrics,
  getPerformanceTrend,
  getDashboardSummary,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} from '../controllers/classController.js';

import { requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// рџ”Ќ С‡С‚РµРЅРёРµ вЂ” РІСЃРµРј Р·Р°Р»РѕРіРёРЅРµРЅРЅС‹Рј
router.get('/', asyncHandler(getClasses));
router.get('/metrics', asyncHandler(getClassMetrics));
router.get('/performance-trend', asyncHandler(getPerformanceTrend));
router.get('/dashboard-summary', asyncHandler(getDashboardSummary));
router.get('/:id', asyncHandler(getClassById));

// рџ”’ РёР·РјРµРЅРµРЅРёСЏ вЂ” С‚РѕР»СЊРєРѕ ADMIN
router.post('/', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(createClass));
router.put('/:id', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(updateClass));
router.delete('/:id', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(deleteClass));

export default router;

