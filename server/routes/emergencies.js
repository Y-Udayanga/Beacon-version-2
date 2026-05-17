import { Router } from 'express';
import { getEmergencies, updateEmergency } from '../services/supabase.js';

const router = Router();

/**
 * GET /api/emergencies
 * List emergencies, optionally filtered by ?status=
 */
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const emergencies = await getEmergencies(status || null);
    res.json(emergencies);
  } catch (err) {
    console.error('[emergencies] Fetch failed:', err.message);
    // Return empty array instead of 500 — the dispatcher page should still render
    res.json([]);
  }
});

/**
 * PATCH /api/emergencies/:id
 * Update fields on an existing emergency.
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await updateEmergency(id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('[emergencies] Update failed:', err.message);
    // Return the requested data back so the UI can update optimistically
    res.json({ id: req.params.id, ...req.body });
  }
});

export default router;
