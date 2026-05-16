// env.js must be imported first — it calls dotenv.config() as a side-effect
// so that process.env is populated before any other module reads it.
import './config/env.js';

import express from 'express';
import cors from 'cors';

import emergencyRouter from './routes/emergency.js';
import emergenciesRouter from './routes/emergencies.js';
import missingPersonRouter from './routes/missingPerson.js';
import dispatchRouter from './routes/dispatch.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/emergency', emergencyRouter);
app.use('/api/emergencies', emergenciesRouter);
app.use('/api/missing-person', missingPersonRouter);
app.use('/api/dispatch', dispatchRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Crisis Copilot server running on http://localhost:${PORT}`);
});
