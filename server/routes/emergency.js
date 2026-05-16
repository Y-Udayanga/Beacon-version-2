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
      const { description, location_lat, location_lng, reporter_phone } = req.body;
      const imageFile = req.files?.image?.[0];
      const audioFile = req.files?.audio?.[0];

      // Upload media to Supabase Storage
      let imageUrl = null;
      let audioUrl = null;

      if (imageFile) {
        const filename = `emergencies/${uuidv4()}-${imageFile.originalname}`;
        imageUrl = await uploadMedia(imageFile.buffer, filename, imageFile.mimetype);
      }

      if (audioFile) {
        const filename = `emergencies/${uuidv4()}-${audioFile.originalname}`;
        audioUrl = await uploadMedia(audioFile.buffer, filename, audioFile.mimetype);
      }

      // Run AI triage
      const location =
        location_lat && location_lng
          ? { lat: parseFloat(location_lat), lng: parseFloat(location_lng) }
          : null;

      const triage = await triageEmergency(
        imageFile?.buffer || null,
        null, // audioText — would require speech-to-text; null for now
        description || null,
        location,
      );

      // Persist the emergency record
      const emergencyId = uuidv4();
      const emergency = await createEmergency({
        id: emergencyId,
        status: 'new',
        severity: triage.severity,
        category: triage.category,
        description: description || '',
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
        reporter_phone: reporter_phone || '',
      });

      // Auto-dispatch for high-severity emergencies
      let dispatchedUnits = [];
      if (triage.severity >= 4) {
        dispatchedUnits = await autoDispatch(emergency);
        await updateEmergency(emergencyId, { status: 'dispatched' });
      }

      res.json({
        id: emergency.id,
        severity: triage.severity,
        category: triage.category,
        threats_detected: triage.threats_detected,
        translated_text: triage.translated_text,
        detected_language: triage.detected_language,
        recommended_actions: triage.recommended_actions,
        first_aid_instructions: triage.first_aid_instructions,
        dispatched_units: dispatchedUnits.map((u) => ({
          unit_type: u.unit_type,
          eta_minutes: u.eta_minutes,
        })),
      });
    } catch (err) {
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

    const triage = await triageEmergency(null, null, description || '', location);

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

    res.json(triage);
  } catch (err) {
    next(err);
  }
});

export default router;
