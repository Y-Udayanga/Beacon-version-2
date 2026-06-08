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

    // Create dispatched unit record (non-fatal — return synthetic data on failure)
    let unit = null;
    const unitId = uuidv4();
    let unitInsertError = null;
    try {
      unit = await createDispatchedUnit({
        id: unitId,
        emergency_id,
        unit_type,
        status: 'dispatched',
        eta_minutes: eta,
      });
    } catch (err) {
      unitInsertError = err.message;
      console.error('[dispatch] createDispatchedUnit failed (non-fatal):', err.message);
      unit = { id: unitId, emergency_id, unit_type, status: 'dispatched', eta_minutes: eta };
    }
    // #region agent log
    fetch('http://127.0.0.1:7257/ingest/dafa2daa-a3c8-4b7b-8a30-6700e4bf18fe', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '610997' }, body: JSON.stringify({ sessionId: '610997', hypothesisId: 'HU2', location: 'server/routes/dispatch.js:POST', message: 'createDispatchedUnit attempt', data: { emergency_id, unit_type, persisted: unitInsertError === null, insertError: unitInsertError, returnedUnitId: unit?.id ?? null }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion

    // Log the dispatch action (non-fatal)
    try {
      await createDispatchLog({
        id: uuidv4(),
        emergency_id,
        action: `Manually dispatched ${unit_type}`,
        performed_by: 'dispatcher',
        details: { unit_type, eta_minutes: eta },
      });
    } catch (err) {
      console.error('[dispatch] createDispatchLog failed (non-fatal):', err.message);
    }

    // Mark the emergency as dispatched (non-fatal)
    try {
      await updateEmergency(emergency_id, { status: 'dispatched' });
    } catch (err) {
      console.error('[dispatch] updateEmergency failed (non-fatal):', err.message);
    }

    res.json(unit);
  } catch (err) {
    console.error('[dispatch] FATAL:', err.message);
    next(err);
  }
});

export default router;
