import { v4 as uuidv4 } from 'uuid';
import { createDispatchedUnit, createDispatchLog } from './supabase.js';

/**
 * Map emergency category to required unit types.
 */
function getUnitsForCategory(category) {
  switch (category) {
    case 'fire':
      return ['fire', 'ambulance'];
    case 'medical':
      return ['ambulance'];
    case 'crime':
      return ['police', 'ambulance'];
    case 'natural_disaster':
      return ['search_rescue', 'ambulance', 'fire'];
    default:
      return ['police'];
  }
}

/**
 * Generate a random ETA between 5 and 15 minutes (demo purposes).
 */
function randomEta() {
  return Math.floor(Math.random() * 11) + 5;
}

/**
 * Auto-dispatch units for high-severity emergencies.
 * Only triggers when severity >= 4.
 * Returns an array of dispatched unit records.
 */
export async function autoDispatch(emergency) {
  if (emergency.severity < 4) return [];

  const unitTypes = getUnitsForCategory(emergency.category);
  const dispatched = [];

  for (const unitType of unitTypes) {
    const eta = randomEta();

    const unit = await createDispatchedUnit({
      id: uuidv4(),
      emergency_id: emergency.id,
      unit_type: unitType,
      status: 'dispatched',
      eta_minutes: eta,
    });

    await createDispatchLog({
      id: uuidv4(),
      emergency_id: emergency.id,
      action: `Auto-dispatched ${unitType}`,
      performed_by: 'ai',
      details: { unit_type: unitType, eta_minutes: eta },
    });

    dispatched.push(unit);
  }

  return dispatched;
}
