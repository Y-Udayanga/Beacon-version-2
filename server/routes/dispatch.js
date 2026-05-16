import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createDispatchedUnit,
  createDispatchLog,
  updateEmergency,
} from '../services/supabase.js';

const router = Router();

/**
 * POST /api/dispatch
 * Manually dispatch a unit to an emergency.
 */
router.post('/', async (req, res, next) => {
  try {
    const { emergency_id, unit_type } = req.body;

    if (!emergency_id || !unit_type) {
      return res
        .status(400)
        .json({ message: 'emergency_id and unit_type are required' });
    }

    const eta = Math.floor(Math.random() * 11) + 5;

    const unit = await createDispatchedUnit({
      id: uuidv4(),
      emergency_id,
      unit_type,
      status: 'dispatched',
      eta_minutes: eta,
    });

    await createDispatchLog({
      id: uuidv4(),
      emergency_id,
      action: `Manually dispatched ${unit_type}`,
      performed_by: 'dispatcher',
      details: { unit_type, eta_minutes: eta },
    });

    // Mark the emergency as dispatched
    await updateEmergency(emergency_id, { status: 'dispatched' });

    res.json(unit);
  } catch (err) {
    next(err);
  }
});

export default router;
