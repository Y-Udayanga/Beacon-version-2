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
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Fetch emergencies failed: ${error.message}`);
  return data;
}

/**
 * Fetch missing persons.
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
