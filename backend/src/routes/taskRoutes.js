import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} from '../controllers/taskController.js';

import { requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// рџ“– РїСЂРѕСЃРјРѕС‚СЂ Р·Р°РґР°С‡ вЂ” РІСЃРµРј Р·Р°Р»РѕРіРёРЅРµРЅРЅС‹Рј
router.get('/', asyncHandler(getTasks));

// вћ• СЃРѕР·РґР°РЅРёРµ Р·Р°РґР°С‡Рё вЂ” С‚РѕР»СЊРєРѕ ADMIN
router.post('/', asyncHandler(createTask));

// вњЏпёЏ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ вЂ” С‚РѕР»СЊРєРѕ ADMIN
router.put('/:id', asyncHandler(updateTask));

// рџ—‘пёЏ СѓРґР°Р»РµРЅРёРµ вЂ” С‚РѕР»СЊРєРѕ ADMIN
router.delete('/:id', asyncHandler(deleteTask));

export default router;

