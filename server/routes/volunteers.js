import { Router } from 'express';
import { getVolunteers, updateVolunteer } from '../services/supabase.js';

const router = Router();

/**
 * GET /api/volunteers
 * List all volunteer profiles (dispatcher tooling).
 */
router.get('/', async (_req, res, next) => {
  try {
    const data = await getVolunteers();
    res.json(data);
  } catch (err) {
    console.error('[volunteers] list error:', err.message);
    next(err);
  }
});

/**
 * PATCH /api/volunteers/:id
 * Update a volunteer's status ('active'|'suspended') or role.
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await updateVolunteer(id, req.body || {});
    res.json(record);
  } catch (err) {
    console.error('[volunteers] update error:', err.message);
    next(err);
  }
});

export default router;
