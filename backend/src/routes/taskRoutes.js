import express from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController.js';

const router = express.Router();

router.get('/', getTasks);
router.post('/', createTask);

// ✅ edit / delete
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
