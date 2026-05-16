import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Strip markdown code fences from a string and parse as JSON.
 */
function parseJsonResponse(text) {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return JSON.parse(cleaned);
}

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

/**
 * Analyze emergency data and return structured triage information.
 */
export async function triageEmergency(imageBuffer, audioText, description, location) {
  try {
    const systemInstruction =
      'You are an emergency response AI triage system. Analyze the provided emergency data and respond with a JSON object. Be accurate and prioritize safety.';

    const promptParts = [
      `Analyze this emergency and respond ONLY with a JSON object in this exact format:
{
  "severity": <1-5 integer, 5 being most critical>,
  "category": "<fire|medical|crime|natural_disaster|other>",
  "threats_detected": ["list of threats"],
  "translated_text": "<english translation if non-english input, otherwise empty string>",
  "detected_language": "<ISO 639-1 language code>",
  "recommended_actions": ["list of actions for dispatchers"],
  "first_aid_instructions": "<immediate instructions for the victim>"
}`,
    ];

    if (description) {
      promptParts.push(`\nDescription from reporter: "${description}"`);
    }
    if (audioText) {
      promptParts.push(`\nTranscribed audio from reporter: "${audioText}"`);
    }
    if (location) {
      promptParts.push(`\nLocation: lat ${location.lat}, lng ${location.lng}`);
    }

    const parts = [];

    // Add image as inline data if provided
    if (imageBuffer) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      });
    }

    parts.push({ text: promptParts.join('\n') });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      systemInstruction,
    });

    const response = result.response;
    const text = response.text();
    return parseJsonResponse(text);
  } catch (err) {
    console.error('Gemini triageEmergency error:', err.message);
    return {
      ...TRIAGE_DEFAULTS,
      recommended_actions: [
        'AI triage failed — dispatch first responders to assess manually',
      ],
    };
  }
}

/**
 * Extract identifying features from a missing person photo.
 */
export async function extractPersonTags(imageBuffer, description) {
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

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      systemInstruction,
    });

    const response = result.response;
    const text = response.text();
    return parseJsonResponse(text);
  } catch (err) {
    console.error('Gemini extractPersonTags error:', err.message);
    return { ...PERSON_TAGS_DEFAULTS };
  }
}
