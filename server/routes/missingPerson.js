import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { upload } from '../middleware/upload.js';
import { extractPersonTags } from '../services/gemini.js';
import { uploadMedia, createMissingPerson } from '../services/supabase.js';

const router = Router();

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

      // Upload image to storage
      let imageUrl = null;
      if (imageFile) {
        const filename = `missing-persons/${uuidv4()}-${imageFile.originalname}`;
        imageUrl = await uploadMedia(imageFile.buffer, filename, imageFile.mimetype);
      }

      // Extract identifying tags from the image via AI
      const extractedTags = await extractPersonTags(
        imageFile?.buffer || null,
        description || clothing_description || '',
      );

      // Save to database
      const record = await createMissingPerson({
        id: uuidv4(),
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

      res.json({
        id: record.id,
        extracted_tags: extractedTags,
        ...record,
      });
    } catch (err) {
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
