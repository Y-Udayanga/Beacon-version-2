import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { upload } from '../middleware/upload.js';
import { extractPersonTags } from '../services/gemini.js';
import {
  uploadMedia,
  createMissingPerson,
  getMissingPersons,
  updateMissingPerson,
} from '../services/supabase.js';

const router = Router();

/**
 * GET /api/missing-person
 * List missing persons, optionally filtered by ?status=.
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await getMissingPersons(req.query.status);
    res.json(data);
  } catch (err) {
    console.error('[missing-person] list error:', err.message);
    next(err);
  }
});

/**
 * PATCH /api/missing-person/:id
 * Update a missing person record (e.g. status: active|found|closed).
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await updateMissingPerson(id, req.body || {});
    res.json(record);
  } catch (err) {
    console.error('[missing-person] update error:', err.message);
    next(err);
  }
});

/**
 * POST /api/missing-person
 * Submit a missing person report with image.
 */
router.post(
  '/',
  upload.single('image'),
  async (req, res, next) => {
    try {
      const {
        name,
        estimated_age,
        gender,
        description,
        clothing_description,
        last_seen_location,
        last_seen_time,
        reporter_name,
        reporter_contact,
      } = req.body;

      const imageFile = req.file;

      // Upload image to storage (non-fatal — continue without it)
      let imageUrl = null;
      if (imageFile) {
        try {
          const filename = `missing-persons/${uuidv4()}-${imageFile.originalname}`;
          imageUrl = await uploadMedia(imageFile.buffer, filename, imageFile.mimetype);
        } catch (err) {
          console.error('[missing-person] Image upload failed (non-fatal):', err.message);
        }
      }

      // Extract identifying tags from the image via AI
      const extractedTags = await extractPersonTags(
        imageFile?.buffer || null,
        description || clothing_description || '',
      );

      // Save to database (non-fatal — return AI results regardless)
      let record = null;
      const recordId = uuidv4();
      try {
        record = await createMissingPerson({
          id: recordId,
          name: name || '',
          estimated_age: estimated_age || extractedTags.estimated_age,
          gender: gender || extractedTags.gender,
          description: description || '',
          clothing_description: clothing_description || '',
          last_seen_location: last_seen_location || '',
          last_seen_time: last_seen_time || null,
          image_url: imageUrl,
          reporter_name: reporter_name || '',
          reporter_contact: reporter_contact || '',
          extracted_tags: extractedTags,
          status: 'active',
        });
      } catch (dbErr) {
        console.error('[missing-person] DB save failed (non-fatal):', dbErr.message);
        record = { id: recordId };
      }

      res.json({
        id: record.id || recordId,
        extracted_tags: extractedTags,
        ...record,
      });
    } catch (err) {
      console.error('[missing-person] FATAL:', err.message);
      next(err);
    }
  },
);

/**
 * POST /api/missing-person/extract
 * Extract identifying tags from an image without saving to DB.
 */
router.post(
  '/extract',
  upload.single('image'),
  async (req, res, next) => {
    try {
      const imageFile = req.file;
      if (!imageFile) {
        return res.status(400).json({ message: 'Image is required' });
      }

      const tags = await extractPersonTags(imageFile.buffer, '');
      res.json(tags);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
