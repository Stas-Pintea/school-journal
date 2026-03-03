import express from 'express';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
} from '../controllers/assignmentController.js';
import { requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getAssignments));
router.post('/', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(createAssignment));
router.put('/:id', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(updateAssignment));
router.delete('/:id', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(deleteAssignment));

export default router;

