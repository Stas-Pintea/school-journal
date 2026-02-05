import express from 'express';
import CalendarEvent from '../models/CalendarEvent.js';

const router = express.Router();

// GET /api/calendar-events
router.get('/', async (req, res) => {
  try {
    const events = await CalendarEvent.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера', error: e.message });
  }
});

// POST /api/calendar-events
router.post('/', async (req, res) => {
  try {
    const { title, startIso, endIso } = req.body;

    if (!title?.trim() || !startIso || !endIso) {
      return res.status(400).json({ message: 'title, startIso, endIso обязательны' });
    }

    // нормализуем диапазон (если end раньше start)
    const s = startIso;
    const e = endIso;
    const normalized = s <= e ? { startIso: s, endIso: e } : { startIso: e, endIso: s };

    const created = await CalendarEvent.create({
      title: title.trim(),
      ...normalized,
    });

    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера', error: e.message });
  }
});

// DELETE /api/calendar-events/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Событие не найдено' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера', error: e.message });
  }
});

export default router;
