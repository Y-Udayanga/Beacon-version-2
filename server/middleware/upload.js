import multer from 'multer';

// Multer configured with memory storage so buffers can be forwarded to Supabase
export const upload = multer({ storage: multer.memoryStorage() });
