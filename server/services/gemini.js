import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('⚠ GEMINI_API_KEY is missing — AI triage will return defaults.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || 'missing');

/**
 * Models ordered by current availability. Put working models first.
 * When a model returns 429 it is marked dead for 60s so subsequent
 * requests skip it instantly instead of wasting time.
 */
const MODEL_CASCADE = [
  'gemini-3.1-flash-lite',   // Currently has quota
  'gemini-2.5-flash-lite',   // Separate quota bucket
  'gemini-2.5-flash',        // Best quality
  'gemini-2.0-flash-lite',   // Legacy fallback
];

/** Track which models are 429'd so we skip them instantly. */
const deadModels = new Map(); // modelName → timestamp when it was marked dead

function isModelDead(name) {
  const deadAt = deadModels.get(name);
  if (!deadAt) return false;
  // Revive after 60 seconds
  if (Date.now() - deadAt > 60_000) {
    deadModels.delete(name);
    return false;
  }
  return true;
}

/**
 * Strip markdown code fences from a string and parse as JSON.
 */
function parseJsonResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return JSON.parse(cleaned);
}

/**
 * Wrap a promise with a timeout. Catches dangling rejections to prevent
 * unhandled rejection crashes.
 */
function withTimeout(promise, ms, label = 'operation') {
  let settled = false;

  const timer = new Promise((_, reject) =>
    setTimeout(() => {
      if (!settled) reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms),
  );

  const safePromise = promise.then(
    (v) => { settled = true; return v; },
    (e) => { settled = true; throw e; },
  );

  return Promise.race([safePromise, timer]);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Try to generate content, falling through the model cascade.
 * 429'd models are skipped instantly for 60s after first failure.
 * timeoutMs can be increased for requests with large audio payloads.
 */
async function generateWithRetry(contents, systemInstruction, timeoutMs = 25_000) {
  for (const modelName of MODEL_CASCADE) {
    // Skip models we already know are 429'd
    if (isModelDead(modelName)) {
      continue;
    }

    const model = genAI.getGenerativeModel({ model: modelName });

    try {
      console.log(`[gemini] Trying ${modelName}…`);

      const result = await withTimeout(
        model.generateContent({ contents, systemInstruction }),
        timeoutMs,
        `${modelName}`,
      );

      console.log(`[gemini] ✓ ${modelName} responded`);
      return result;
    } catch (err) {
      const msg = err.message || '';
      const is429 = msg.includes('429') || msg.includes('quota');

      if (is429) {
        // Mark dead for 60s so we don't waste time on it again
        deadModels.set(modelName, Date.now());
        console.warn(`[gemini] ${modelName} quota exhausted — skipping for 60s`);
        continue;
      }

      // Any other error (timeout, network, 503) — try next model
      console.error(`[gemini] ${modelName} failed: ${msg.slice(0, 100)}`);
      continue;
    }
  }

  throw new Error('All Gemini models exhausted or unavailable');
}

// ─── Defaults ────────────────────────────────────────────────

const TRIAGE_DEFAULTS = {
  severity: 3,
  category: 'other',
  threats_detected: [],
  translated_text: '',
  detected_language: 'en',
  recommended_actions: ['Dispatch first responders to assess the situation'],
  first_aid_instructions: 'Stay calm and wait for emergency services.',
};

const PERSON_TAGS_DEFAULTS = {
  estimated_age: 'unknown',
  gender: 'unknown',
  hair_color: 'unknown',
  clothing: [],
  distinguishing_features: [],
  build: 'medium',
};

// ─── Triage ──────────────────────────────────────────────────

/**
 * Analyze emergency data and return structured triage information.
 * Gemini processes image + audio natively — no separate STT needed.
 * Always returns a valid triage result — never throws.
 */
export async function triageEmergency(imageBuffer, audioBuffer, audioMimeType, description, location) {
  if (!GEMINI_API_KEY) {
    console.warn('[gemini] No API key — returning default triage');
    return {
      ...TRIAGE_DEFAULTS,
      recommended_actions: ['AI unavailable — dispatch first responders to assess manually'],
    };
  }

  try {
    const systemInstruction = `You are an expert emergency response AI triage system used by crisis copilots and first responders. Your job is to analyze emergency reports — which may include photos, audio recordings, and text descriptions — and produce an accurate, actionable triage assessment.

CRITICAL RULES:
- Analyze the IMAGE carefully for injuries, fires, structural damage, weapons, crowds, environmental hazards.
- LISTEN to the AUDIO recording carefully: transcribe what the person is saying, detect their language, assess their level of distress, and note any background sounds (sirens, screaming, crashing, fire, explosions, gunshots, etc.).
- If audio or description text is in a non-English language, translate it to English in the translated_text field.
- Provide SPECIFIC, ACTIONABLE first aid instructions tailored to what you see/hear/read (not generic advice).
- Severity 1 = minor inconvenience, 5 = life-threatening / mass-casualty.
- Respond ONLY with the JSON object, no markdown, no explanation.`;

    const promptParts = [
      `Analyze the following emergency report and respond with a JSON object in this exact schema:
{
  "severity": <integer 1-5, where 5 is most critical / life-threatening>,
  "category": "<fire|medical|crime|natural_disaster|other>",
  "threats_detected": ["specific threats visible or described, e.g. 'active fire on 2nd floor', 'bleeding wound on left arm'"],
  "translated_text": "<English translation of any non-English input, otherwise empty string>",
  "detected_language": "<ISO 639-1 code of the input language, e.g. 'en', 'si', 'ta'>",
  "recommended_actions": ["specific actions for dispatchers / first responders, at least 2-3 items"],
  "first_aid_instructions": "<detailed, step-by-step first aid the victim or bystander should perform RIGHT NOW while waiting for help — be specific to the situation>"
}`,
    ];

    if (description) {
      promptParts.push(`\n--- Reporter's typed description ---\n"${description}"`);
    }
    if (audioBuffer) {
      promptParts.push('\n--- Audio recording attached (listen carefully for speech, language, distress, and environmental sounds) ---');
    }
    if (location) {
      promptParts.push(`\n--- GPS coordinates ---\nLatitude: ${location.lat}, Longitude: ${location.lng}`);
    }
    if (!imageBuffer && !audioBuffer && !description) {
      promptParts.push('\n(No image, audio, or description provided — assess as a general emergency alert from this location.)');
    }

    const parts = [];

    // Attach image as inline data
    if (imageBuffer) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      });
    }

    // Attach raw audio recording as inline data — Gemini analyzes it natively
    if (audioBuffer) {
      // Fix MIME: Multer sometimes reports 'text/plain' for webm blobs
      let cleanMime = (audioMimeType || 'audio/webm').split(';')[0].trim();
      if (cleanMime === 'text/plain' || cleanMime === 'application/octet-stream') {
        cleanMime = 'audio/webm';
      }
      parts.push({
        inlineData: {
          mimeType: cleanMime,
          data: audioBuffer.toString('base64'),
        },
      });
    }

    // Text prompt last so Gemini sees media first
    parts.push({ text: promptParts.join('\n') });

    // Determine timeout: larger payloads (audio) need more time
    const hasMedia = !!(imageBuffer || audioBuffer);
    const timeout = hasMedia ? 45_000 : 20_000;

    console.log('[gemini] Sending triage request…', {
      hasImage: !!imageBuffer,
      hasAudio: !!audioBuffer,
      audioMime: audioMimeType || '(none)',
      audioSizeKB: audioBuffer ? Math.round(audioBuffer.length / 1024) : 0,
      hasDescription: !!description,
      hasLocation: !!location,
      timeoutMs: timeout,
    });

    const result = await generateWithRetry(
      [{ role: 'user', parts }],
      systemInstruction,
      timeout,
    );

    const response = result.response;
    const text = response.text();
    console.log('[gemini] Raw response length:', text.length);

    const parsed = parseJsonResponse(text);

    // Validate & fill defaults
    return {
      severity: typeof parsed.severity === 'number' ? parsed.severity : TRIAGE_DEFAULTS.severity,
      category: parsed.category || TRIAGE_DEFAULTS.category,
      threats_detected: Array.isArray(parsed.threats_detected) ? parsed.threats_detected : TRIAGE_DEFAULTS.threats_detected,
      translated_text: parsed.translated_text ?? '',
      detected_language: parsed.detected_language || 'en',
      recommended_actions: Array.isArray(parsed.recommended_actions) ? parsed.recommended_actions : TRIAGE_DEFAULTS.recommended_actions,
      first_aid_instructions: parsed.first_aid_instructions || TRIAGE_DEFAULTS.first_aid_instructions,
    };
  } catch (err) {
    console.error('[gemini] triageEmergency error:', err.message);
    return {
      ...TRIAGE_DEFAULTS,
      recommended_actions: [
        'AI triage temporarily unavailable — dispatch first responders to assess manually',
      ],
    };
  }
}

// ─── Missing Person Tags ─────────────────────────────────────

/**
 * Extract identifying features from a missing person photo.
 */
export async function extractPersonTags(imageBuffer, description) {
  if (!GEMINI_API_KEY) {
    return { ...PERSON_TAGS_DEFAULTS };
  }

  try {
    const systemInstruction =
      'You are an AI system for analyzing missing person photos. Extract structured identifying features.';

    const promptParts = [
      `Analyze this person's photo and respond ONLY with a JSON object in this exact format:
{
  "estimated_age": "<age range, e.g. 25-35>",
  "gender": "<male|female|unknown>",
  "hair_color": "<color>",
  "clothing": [{"type": "<item>", "color": "<color>"}],
  "distinguishing_features": ["list of distinguishing features"],
  "build": "<slim|medium|large>"
}`,
    ];

    if (description) {
      promptParts.push(`\nAdditional context: "${description}"`);
    }

    const parts = [];

    if (imageBuffer) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      });
    }

    parts.push({ text: promptParts.join('\n') });

    const result = await generateWithRetry(
      [{ role: 'user', parts }],
      systemInstruction,
      20_000,
    );

    const response = result.response;
    const text = response.text();
    return parseJsonResponse(text);
  } catch (err) {
    console.error('[gemini] extractPersonTags error:', err.message);
    return { ...PERSON_TAGS_DEFAULTS };
  }
}
