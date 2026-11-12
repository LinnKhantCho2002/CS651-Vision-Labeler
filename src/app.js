import express from 'express';
import multer from 'multer';
import helmet from 'helmet';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { homePage, resultPage, errorPage } from './views.js';
import { VisionServiceError } from './vision.js';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 25_000_000;
const MIME_BY_FORMAT = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

/** Decode, check dimensions/format, strip metadata, normalize and reduce payload. */
export async function normalizeImage(file) {
  try {
    const bytes = file.buffer;
    const detected = bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? 'image/jpeg'
      : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'image/png'
        : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : null;
    if (!detected || detected !== file.mimetype) throw new InputError('The file contents must match a JPEG, PNG, or WebP image.', 415);
    const options = { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'warning' };
    const metadata = await sharp(file.buffer, options).metadata();
    if (!MIME_BY_FORMAT[metadata.format] || MIME_BY_FORMAT[metadata.format] !== file.mimetype) {
      throw new InputError('The file contents must match a JPEG, PNG, or WebP image.', 415);
    }
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
      throw new InputError('Choose an image no larger than 25 megapixels.');
    }
    if ((metadata.pages ?? 1) > 1) throw new InputError('Animated images are not supported. Choose a still image.');
    const normalized = await sharp(file.buffer, options)
      .rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }).jpeg({ quality: 85 }).toBuffer();
    if (normalized.length > MAX_UPLOAD_BYTES) throw new InputError('This image is too complex. Try a smaller image.');
    return normalized;
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError('The image could not be decoded. Use a valid JPEG, PNG, or WebP of at most 25 megapixels.');
  }
}

export function cleanLabels(labels) {
  if (!Array.isArray(labels)) return [];
  return labels.filter((label) => typeof label?.description === 'string' && label.description.trim()
    && typeof label.score === 'number' && Number.isFinite(label.score))
    .map(({ description, score }) => ({ description: description.slice(0, 200), score: Math.min(1, Math.max(0, score)) }))
    .sort((a, b) => b.score - a.score).slice(0, 10);
}

export function createApp({ detectLabels, demo = false, maxRequests = 20,
  windowMs = 600000, maxConcurrent = 1, now = Date.now, logger = console } = {}) {
  if (typeof detectLabels !== 'function') throw new TypeError('detectLabels must be a function.');
  for (const [name, value] of Object.entries({ maxRequests, windowMs, maxConcurrent })) {
    if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${name} must be a positive integer.`);
  }
  const app = express();
  app.disable('x-powered-by');
  // Keep same-origin form POSTs from becoming Origin: null under no-referrer.
  // Cross-origin requests still disclose no referrer and remain blocked by guard.
  app.use(helmet({ referrerPolicy: { policy: 'same-origin' }, contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"],
    imgSrc: ["'self'", 'blob:'], formAction: ["'self'"],
    objectSrc: ["'none'"], frameAncestors: ["'none'"],
    upgradeInsecureRequests: null,
  } } }));
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use(express.static(fileURLToPath(new URL('../public', import.meta.url)), { dotfiles: 'deny', index: false }));
  app.get('/', (_req, res) => res.type('html').send(homePage({ demo })));
  // Liveness only. This intentionally does not spend Vision quota or prove ADC is valid.
  app.get(['/health', '/healthz'], (_req, res) => res.json({ status: 'ok', mode: demo ? 'demo' : 'vision' }));

  const upload = multer({ storage: multer.memoryStorage(), limits: {
    fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 1, parts: 2, fieldSize: 16,
  }, fileFilter: (_req, file, done) => {
    if (!Object.values(MIME_BY_FORMAT).includes(file.mimetype)) {
      return done(new InputError('Choose a JPEG, PNG, or WebP image.', 415));
    }
    done(null, true);
  } }).single('image');

  // Process-wide, not IP-based: avoids trusting spoofable forwarded headers.
  // Not a hard spending cap. Resets on restart and is not shared across instances.
  let windowStart = now();
  let requestCount = 0;
  let active = 0;
  function guard(req, res, next) {
    if (req.get('origin')) {
      let origin;
      try { origin = new URL(req.get('origin')); } catch { return next(new InputError('Invalid request origin.', 403)); }
      if (origin.host !== req.get('host') || !['http:', 'https:'].includes(origin.protocol)) {
        return next(new InputError('Submit images using the form on this website.', 403));
      }
    }
    const current = now();
    if (current - windowStart >= windowMs) { windowStart = current; requestCount = 0; }
    if (requestCount >= maxRequests) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((windowMs - (current - windowStart)) / 1000))));
      return next(new InputError('The demo request limit has been reached. Please try again later.', 429));
    }
    if (active >= maxConcurrent) {
      res.set('Retry-After', '5');
      return next(new InputError('The server is busy analyzing other images. Try again in a few seconds.', 503));
    }
    requestCount += 1;
    active += 1;
    let released = false;
    res.locals.releaseAnalysis = () => { if (!released) { active -= 1; released = true; } };
    // Keep the slot while downstream processing is active even if the browser leaves.
    res.once('finish', res.locals.releaseAnalysis);
    next();
  }

  app.post('/analyze', guard, (req, res, next) => {
    if (!req.is('multipart/form-data')) return next(new InputError('Submit an image using the upload form.'));
    upload(req, res, (error) => {
      if (error) res.locals.releaseAnalysis?.();
      next(error);
    });
  }, async (req, res) => {
    try {
      if (!req.file) throw new InputError('Choose an image before submitting.');
      if (req.body?.consent !== 'yes') throw new InputError('Confirm the image processing notice before uploading.');
      const image = await normalizeImage(req.file);
      const labels = cleanLabels(await detectLabels(image));
      res.type('html').send(resultPage({ labels, filename: req.file.originalname, demo }));
    } finally {
      res.locals.releaseAnalysis?.();
    }
  });

  app.use((_req, res) => res.status(404).type('html').send(errorPage('That page does not exist.', { demo })));
  app.use((error, _req, res, _next) => {
    res.locals.releaseAnalysis?.();
    let status = 500;
    let message = 'Something went wrong. Please try again later.';
    if (error instanceof InputError) { status = error.status; message = error.message; }
    else if (error instanceof multer.MulterError) {
      status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      message = error.code === 'LIMIT_FILE_SIZE' ? 'The image is too large. Maximum size is 5 MiB.'
        : 'Upload exactly one image and the processing confirmation using this form.';
    } else if (error instanceof VisionServiceError) {
      status = error.code === 'VISION_TIMEOUT' ? 504 : 503;
      message = error.code === 'VISION_TIMEOUT' ? 'Image analysis took too long. Please try again.'
        : 'Image analysis is temporarily unavailable. Please try again later.';
      logger.error('vision_request_failed', { code: error.code });
    } else if (/Unexpected end of form|Malformed part header|Boundary not found/.test(error?.message ?? '')) {
      status = 400; message = 'The upload was incomplete or malformed. Please try again.';
    } else {
      // Do not log raw upstream messages, uploaded bytes, names or credentials.
      logger.error('request_failed', { type: 'InternalError' });
    }
    if (!res.headersSent) res.status(status).type('html').send(errorPage(message, { demo }));
  });
  return app;
}
