import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing — database operations will fail.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

/**
 * Upload a file buffer to the emergency-media storage bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadMedia(buffer, filename, mimetype) {
  const { data, error } = await supabase.storage
    .from('emergency-media')
    .upload(filename, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('emergency-media')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Insert a new emergency record.
 */
export async function createEmergency(data) {
  const { data: record, error } = await supabase
    .from('emergencies')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Create emergency failed: ${error.message}`);
  return record;
}

/**
 * Update an existing emergency by id.
 */
export async function updateEmergency(id, data) {
  const { data: record, error } = await supabase
    .from('emergencies')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Update emergency failed: ${error.message}`);
  return record;
}

/**
 * Fetch emergencies, optionally filtered by status.
 */
export async function getEmergencies(status) {
  let query = supabase
    .from('emergencies')
    .select('*, dispatched_units(id, unit_type, status, eta_minutes, created_at)')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  // #region agent log
  try {
    const totalUnits = Array.isArray(data)
      ? data.reduce((n, e) => n + (Array.isArray(e.dispatched_units) ? e.dispatched_units.length : 0), 0)
      : 0;
    const hasUnitsField = Array.isArray(data) && data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'dispatched_units');
    fetch('http://127.0.0.1:7257/ingest/dafa2daa-a3c8-4b7b-8a30-6700e4bf18fe', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '610997' }, body: JSON.stringify({ sessionId: '610997', hypothesisId: 'HU1', location: 'server/services/supabase.js:getEmergencies', message: 'getEmergencies result', data: { error: error?.message ?? null, emergencyCount: Array.isArray(data) ? data.length : null, hasUnitsField, totalUnits, sampleUnits: Array.isArray(data) && data[0] ? data[0].dispatched_units : null }, timestamp: Date.now() }) }).catch(() => {});
  } catch { /* noop */ }
  // #endregion
  if (error) throw new Error(`Fetch emergencies failed: ${error.message}`);
  return data;
}

/**
 * Fetch missing persons, optionally filtered by status.
 */
export async function getMissingPersons(status) {
  let query = supabase
    .from('missing_persons')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Fetch missing persons failed: ${error.message}`);
  return data;
}

/**
 * Update a missing person record by id (e.g. status change).
 */
export async function updateMissingPerson(id, data) {
  const { data: record, error } = await supabase
    .from('missing_persons')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Update missing person failed: ${error.message}`);
  return record;
}

/**
 * Insert a new missing person record.
 */
export async function createMissingPerson(data) {
  const { data: record, error } = await supabase
    .from('missing_persons')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Create missing person failed: ${error.message}`);
  return record;
}

/**
 * Insert a new dispatched unit record.
 */
export async function createDispatchedUnit(data) {
  const { data: record, error } = await supabase
    .from('dispatched_units')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Create dispatched unit failed: ${error.message}`);
  return record;
}

/**
 * Insert a dispatch log entry.
 */
export async function createDispatchLog(data) {
  const { data: record, error } = await supabase
    .from('dispatch_log')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Create dispatch log failed: ${error.message}`);
  return record;
}

/**
 * Fetch recent dispatch log entries (most recent first).
 * Embeds basic emergency context (category, severity) for display.
 */
export async function getDispatchLog(limit = 50) {
  const { data, error } = await supabase
    .from('dispatch_log')
    .select('id, created_at, emergency_id, action, details, performed_by, emergencies(category, severity)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Fetch dispatch log failed: ${error.message}`);
  return data;
}

