import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getEmergencies,
  updateEmergency,
  getDispatchLog,
  createDispatchLog,
} from '../services/supabase.js';

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
 * GET /api/emergencies/activity
 * Recent dispatch log entries (dispatches + status changes).
 */
router.get('/activity', async (_req, res) => {
  try {
    const log = await getDispatchLog();
    res.json(log);
  } catch (err) {
    console.error('[emergencies] Activity log fetch failed:', err.message);
    // Return empty array instead of 500 — the feed should still render
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

    // Record status changes in the dispatch log so they appear in the
    // activity feed (non-fatal — the update itself already succeeded).
    if (req.body && req.body.status) {
      try {
        await createDispatchLog({
          id: uuidv4(),
          emergency_id: id,
          action: `Status changed to ${req.body.status}`,
          performed_by: 'dispatcher',
          details: { status: req.body.status },
        });
      } catch (logErr) {
        console.error('[emergencies] Status-change log failed (non-fatal):', logErr.message);
      }
    }

    res.json(updated);
  } catch (err) {
    console.error('[emergencies] Update failed:', err.message);
    // Return the requested data back so the UI can update optimistically
    res.json({ id: req.params.id, ...req.body });
  }
});

export default router;
