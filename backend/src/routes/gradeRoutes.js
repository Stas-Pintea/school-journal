import express from 'express';
import { getGrades, upsertGrade, deleteGradeByKey } from '../controllers/gradeController.js';

const router = express.Router();

router.get('/', getGrades);
router.put('/', upsertGrade);
router.delete('/', deleteGradeByKey);

export default router;
