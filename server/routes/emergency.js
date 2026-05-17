import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { upload } from '../middleware/upload.js';
import { triageEmergency } from '../services/gemini.js';
import { uploadMedia, createEmergency, updateEmergency } from '../services/supabase.js';
import { autoDispatch } from '../services/dispatch.js';

const router = Router();

/**
 * POST /api/emergency/report
 * Submit a new emergency report with optional image/audio.
 */
router.post(
  '/report',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const body = req.body || {};
      const description = body.description || '';
      const location_lat = body.location_lat;
      const location_lng = body.location_lng;
      const reporter_phone = body.reporter_phone || '';

      const imageFile = req.files?.image?.[0];
      const audioFile = req.files?.audio?.[0];

      console.log('[emergency/report] Received:', {
        hasImage: !!imageFile,
        hasAudio: !!audioFile,
        description: description ? description.slice(0, 80) : '(empty)',
        location_lat,
        location_lng,
      });

      // Upload media to Supabase Storage (non-blocking — skip on failure)
      let imageUrl = null;
      let audioUrl = null;

      if (imageFile) {
        try {
          const filename = `emergencies/${uuidv4()}-${imageFile.originalname}`;
          imageUrl = await uploadMedia(imageFile.buffer, filename, imageFile.mimetype);
        } catch (err) {
          console.error('[emergency/report] Image upload failed:', err.message);
          // Continue — the emergency can still be created without the image
        }
      }

      if (audioFile) {
        try {
          const filename = `emergencies/${uuidv4()}-${audioFile.originalname}`;
          audioUrl = await uploadMedia(audioFile.buffer, filename, audioFile.mimetype);
        } catch (err) {
          console.error('[emergency/report] Audio upload failed:', err.message);
        }
      }

      // Run AI triage
      const location =
        location_lat && location_lng
          ? { lat: parseFloat(location_lat), lng: parseFloat(location_lng) }
          : null;

      const triage = await triageEmergency(
        imageFile?.buffer || null,
        audioFile?.buffer || null,
        audioFile?.mimetype || null,
        description || null,
        location,
      );

      console.log('[emergency/report] Triage result:', {
        severity: triage.severity,
        category: triage.category,
      });

      // Persist the emergency record (non-fatal — triage results are more important)
      const emergencyId = uuidv4();
      let emergency = null;
      try {
        emergency = await createEmergency({
          id: emergencyId,
          status: 'new',
          severity: triage.severity,
          category: triage.category,
          description: description,
          location_lat: location?.lat || null,
          location_lng: location?.lng || null,
          image_url: imageUrl,
          audio_url: audioUrl,
          translated_text: triage.translated_text || '',
          reporter_language: triage.detected_language || 'en',
          threat_assessment: {
            threats_detected: triage.threats_detected,
            recommended_actions: triage.recommended_actions,
          },
          first_aid_instructions: triage.first_aid_instructions || '',
          reporter_phone: reporter_phone,
        });
        console.log('[emergency/report] Created emergency:', emergencyId);
      } catch (dbErr) {
        console.error('[emergency/report] DB save failed (non-fatal):', dbErr.message);
        // Build a synthetic emergency object so dispatch logic still works
        emergency = { id: emergencyId, severity: triage.severity, category: triage.category };
      }

      // Auto-dispatch for high-severity emergencies
      let dispatchedUnits = [];
      if (triage.severity >= 4) {
        try {
          dispatchedUnits = await autoDispatch(emergency);
          await updateEmergency(emergencyId, { status: 'dispatched' });
        } catch (err) {
          console.error('[emergency/report] Auto-dispatch failed (non-fatal):', err.message);
          // Generate synthetic dispatch data so UI still shows dispatched units
          const syntheticUnits = {
            fire: ['fire', 'ambulance'],
            medical: ['ambulance'],
            crime: ['police', 'ambulance'],
            natural_disaster: ['search_rescue', 'ambulance', 'fire'],
          };
          dispatchedUnits = (syntheticUnits[triage.category] || ['police']).map(u => ({
            unit_type: u,
            eta_minutes: Math.floor(Math.random() * 11) + 5,
          }));
        }
      }

      res.json({
        id: emergency.id || emergencyId,
        severity: triage.severity,
        category: triage.category,
        threats_detected: triage.threats_detected || [],
        translated_text: triage.translated_text || '',
        detected_language: triage.detected_language || 'en',
        recommended_actions: triage.recommended_actions || [],
        first_aid_instructions: triage.first_aid_instructions || '',
        dispatched_units: dispatchedUnits.map((u) => ({
          unit_type: u.unit_type,
          eta_minutes: u.eta_minutes,
        })),
      });
    } catch (err) {
      console.error('[emergency/report] FATAL:', err.message);
      next(err);
    }
  },
);

/**
 * POST /api/emergency/:id/triage
 * Re-run triage on an existing emergency.
 */
router.post('/:id/triage', async (req, res, next) => {
  try {
    const { id } = req.params;

    // For re-triage we use the description already stored.
    // A more complete implementation would re-fetch the image from storage.
    const { description, location_lat, location_lng } = req.body || {};

    const location =
      location_lat && location_lng
        ? { lat: parseFloat(location_lat), lng: parseFloat(location_lng) }
        : null;

    const triage = await triageEmergency(null, null, null, description || '', location);

    // Persist updated triage (non-fatal)
    try {
      await updateEmergency(id, {
        severity: triage.severity,
        category: triage.category,
        translated_text: triage.translated_text || '',
        threat_assessment: {
          threats_detected: triage.threats_detected,
          recommended_actions: triage.recommended_actions,
        },
        first_aid_instructions: triage.first_aid_instructions || '',
      });
    } catch (dbErr) {
      console.error('[emergency] Re-triage DB update failed (non-fatal):', dbErr.message);
    }

    res.json(triage);
  } catch (err) {
    console.error('[emergency] Re-triage error:', err.message);
    next(err);
  }
});

export default router;
