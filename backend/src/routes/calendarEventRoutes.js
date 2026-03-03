import express from 'express';
import CalendarEvent from '../models/CalendarEvent.js';
import { requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// GET /api/calendar-events (any authenticated user)
router.get('/', asyncHandler(async (req, res) => {
  const events = await CalendarEvent.find().sort({ createdAt: -1 });
  res.json(events);
}));

// POST /api/calendar-events (ADMIN, DEPUTY_ADMIN)
router.post('/', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(async (req, res) => {
  const { title, startIso, endIso } = req.body;

  if (!title?.trim() || !startIso || !endIso) {
    return res.status(400).json({ message: 'title, startIso, endIso are required' });
  }

  // Normalize range if end is before start.
  const s = startIso;
  const e = endIso;
  const normalized = s <= e ? { startIso: s, endIso: e } : { startIso: e, endIso: s };

  const created = await CalendarEvent.create({
    title: title.trim(),
    ...normalized,
  });

  res.status(201).json(created);
}));

// DELETE /api/calendar-events/:id (ADMIN, DEPUTY_ADMIN)
router.delete('/:id', requireRole('ADMIN', 'DEPUTY_ADMIN'), asyncHandler(async (req, res) => {
  const deleted = await CalendarEvent.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Calendar event not found' });
  res.status(204).send();
}));

export default router;
