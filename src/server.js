import { createApp } from './app.js';
import { createVisionDetector, demoDetector } from './vision.js';

function positiveInteger(value, fallback, name) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}
const demo = process.env.DEMO_MODE === 'true';
if (demo && process.env.GAE_ENV) throw new Error('Offline demo mode must not run on App Engine. Set DEMO_MODE=false.');
const app = createApp({
  detectLabels: demo ? demoDetector : createVisionDetector(), demo,
  maxRequests: positiveInteger(process.env.MAX_REQUESTS_PER_WINDOW, 20, 'MAX_REQUESTS_PER_WINDOW'),
  windowMs: positiveInteger(process.env.RATE_WINDOW_MS, 600000, 'RATE_WINDOW_MS'),
  maxConcurrent: positiveInteger(process.env.MAX_CONCURRENT_ANALYSES, 1, 'MAX_CONCURRENT_ANALYSES'),
});
const port = positiveInteger(process.env.PORT, 8080, 'PORT');
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Vision Labeler at http://localhost:${port} (${demo ? 'OFFLINE DEMO: simulated labels' : 'Google Cloud Vision mode'})`);
});
server.requestTimeout = 30000;
server.headersTimeout = 15000;
process.on('SIGTERM', () => server.close(() => process.exit(0)));
