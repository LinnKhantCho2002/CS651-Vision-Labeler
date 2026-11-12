import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import { createApp, MAX_UPLOAD_BYTES, cleanLabels } from '../src/app.js';
import { createVisionDetector, VisionServiceError } from '../src/vision.js';
import { escapeHtml, resultPage } from '../src/views.js';

const png = await sharp({ create: { width: 80, height: 60, channels: 3, background: '#78a667' } }).png().toBuffer();
const jpeg = await sharp(png).jpeg().toBuffer();
const webp = await sharp(png).webp().toBuffer();
const logger = { error() {} };
const makeApp = (overrides = {}) => createApp({ detectLabels: async () => [{ description: 'Plant', score: .95 }], logger, ...overrides });
const upload = (app, buffer = png, contentType = 'image/png', name = 'sample.png') => request(app).post('/analyze').field('consent', 'yes').attach('image', buffer, { filename: name, contentType });

test('GET / returns an accessible HTML multipart form and privacy notice', async () => {
  const res = await request(makeApp()).get('/').expect(200).expect('Content-Type', /html/);
  assert.match(res.text, /method="post" enctype="multipart\/form-data"/);
  assert.match(res.text, /name="image"/);
  assert.match(res.text, /Google Cloud Vision/);
  assert.match(res.text, /name="consent"/);
  assert.equal(res.headers['x-powered-by'], undefined);
  assert.match(res.headers['content-security-policy'], /frame-ancestors 'none'/);
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('form referrer policy preserves a same-origin POST origin', async () => {
  const res = await request(makeApp()).get('/').expect(200);
  assert.equal(res.headers['referrer-policy'], 'same-origin');
});

test('health check identifies mode without calling Vision', async () => {
  const res = await request(makeApp({ demo: true, detectLabels: () => { throw new Error('Should not call'); } })).get('/health').expect(200);
  assert.deepEqual(res.body, { status: 'ok', mode: 'demo' });
});

test('PNG upload is normalized to JPEG and renders sorted scores', async () => {
  let received;
  const app = makeApp({ detectLabels: async (buffer) => { received = buffer; return [{ description: 'Tree', score: .7 }, { description: 'Plant', score: .95 }]; } });
  const res = await upload(app).expect(200);
  assert.equal((await sharp(received).metadata()).format, 'jpeg');
  assert.match(res.text, /95\.0%/);
  assert.ok(res.text.indexOf('scope="row">Plant') < res.text.indexOf('scope="row">Tree'));
  assert.match(res.text, /sample\.png/);
});

for (const [type, bytes] of [['image/jpeg', jpeg], ['image/webp', webp]]) {
  test(`accepts ${type}`, async () => { await upload(makeApp(), bytes, type).expect(200); });
}

test('large-dimension image is resized before the API request', async () => {
  const wide = await sharp({ create: { width: 3000, height: 50, channels: 3, background: '#fff' } }).png().toBuffer();
  const app = makeApp({ detectLabels: async (buffer) => { assert.equal((await sharp(buffer).metadata()).width, 2400); return []; } });
  await upload(app, wide).expect(200);
});

test('image metadata is stripped during re-encoding', async () => {
  const tagged = await sharp(jpeg).withMetadata({ density: 123 }).jpeg().toBuffer();
  assert.ok((await sharp(tagged).metadata()).exif);
  const app = makeApp({ detectLabels: async (buffer) => { assert.equal((await sharp(buffer).metadata()).exif, undefined); return []; } });
  await upload(app, tagged, 'image/jpeg').expect(200);
});

test('escapes labels and filenames, preventing HTML injection', async () => {
  const app = makeApp({ detectLabels: async () => [{ description: '<script>alert("x")</script>', score: .8 }] });
  const res = await upload(app, png, 'image/png', '<img onerror=alert(1)>.png').expect(200);
  assert.doesNotMatch(res.text, /<script>alert/);
  assert.doesNotMatch(res.text, /<img onerror/);
  assert.match(res.text, /&lt;script&gt;/);
  assert.match(res.text, /&lt;img onerror=alert\(1\)&gt;/);
});

test('no labels produces a useful empty state', async () => {
  const res = await upload(makeApp({ detectLabels: async () => [] })).expect(200);
  assert.match(res.text, /No labels detected/);
});

test('missing image is rejected', async () => {
  await request(makeApp()).post('/analyze').field('consent', 'yes').expect(400);
});

test('missing consent is rejected without calling Vision', async () => {
  const app = makeApp({ detectLabels: () => { throw new Error('Must not call'); } });
  await request(app).post('/analyze').attach('image', png, { filename: 'x.png', contentType: 'image/png' }).expect(400);
});

test('invalid MIME is rejected', async () => {
  await upload(makeApp(), Buffer.from('hello'), 'text/plain', 'x.txt').expect(415);
});

test('spoofed PNG MIME and corrupt data are rejected', async () => {
  await upload(makeApp(), Buffer.from('<svg><script>bad()</script></svg>')).expect(415);
  await upload(makeApp(), Buffer.from('not an image')).expect(415);
});

test('format and MIME must agree', async () => {
  await upload(makeApp(), png, 'image/jpeg').expect(415);
});

test('image over the pixel limit is rejected', async () => {
  const huge = await sharp({ create: { width: 5001, height: 5000, channels: 3, background: '#fff' } }).png().toBuffer();
  await upload(makeApp(), huge).expect(400);
});

test('file over 5 MiB is rejected before calling Vision', async () => {
  await upload(makeApp(), Buffer.alloc(MAX_UPLOAD_BYTES + 1)).expect(413);
});

test('extra upload files and unexpected fields are rejected', async () => {
  await request(makeApp()).post('/analyze').field('consent', 'yes')
    .attach('image', png, 'one.png').attach('image', png, 'two.png').expect(400);
  await request(makeApp()).post('/analyze').field('consent', 'yes').field('extra', 'yes').attach('image', png, 'one.png').expect(400);
  await request(makeApp()).post('/analyze').field('consent', 'yes').attach('other', png, 'one.png').expect(400);
});

test('non-multipart and malformed uploads are rejected', async () => {
  await request(makeApp()).post('/analyze').send({ image: 'bad' }).expect(400);
  await request(makeApp()).post('/analyze').set('Content-Type', 'multipart/form-data; boundary=example').send('--example\r\nbroken').expect(400);
});

test('cross-origin submission is rejected before parsing an upload', async () => {
  await request(makeApp()).post('/analyze').set('Origin', 'https://other.example').field('consent', 'yes').attach('image', png, 'x.png').expect(403);
});

test('same-origin submission is accepted', async () => {
  await request(makeApp()).post('/analyze').set('Host', 'labeler.example').set('Origin', 'https://labeler.example').field('consent', 'yes').attach('image', png, 'x.png').expect(200);
});

test('invalid origin is rejected', async () => {
  await request(makeApp()).post('/analyze').set('Origin', 'null').expect(403);
});

test('Vision failures are safely reported without leaking internals', async () => {
  const res = await upload(makeApp({ detectLabels: async () => { throw new VisionServiceError('secret-path-and-project'); } })).expect(503);
  assert.doesNotMatch(res.text, /secret-path-and-project/);
  assert.match(res.text, /temporarily unavailable/);
});

test('Vision deadline produces an actionable timeout page', async () => {
  const res = await upload(makeApp({ detectLabels: async () => { throw new VisionServiceError(undefined, 'VISION_TIMEOUT'); } })).expect(504);
  assert.match(res.text, /took too long/);
});

test('unexpected errors do not leak their messages', async () => {
  const res = await upload(makeApp({ detectLabels: async () => { throw new Error('private secret'); } })).expect(500);
  assert.doesNotMatch(res.text, /private secret/);
});

test('global rate limit has Retry-After and resets after the window', async () => {
  let clock = 0;
  const app = makeApp({ maxRequests: 1, windowMs: 1000, now: () => clock });
  await upload(app).expect(200);
  const limited = await upload(app).expect(429);
  assert.equal(limited.headers['retry-after'], '1');
  clock = 1000;
  await upload(app).expect(200);
});

test('concurrency limit blocks excess work and releases after completion', async () => {
  let release;
  let entered;
  const gate = new Promise((resolve) => { release = resolve; });
  const started = new Promise((resolve) => { entered = resolve; });
  const app = makeApp({ maxConcurrent: 1, detectLabels: async () => { entered(); await gate; return []; } });
  const first = upload(app).then((res) => res);
  await started;
  await upload(app).expect(503);
  release();
  assert.equal((await first).status, 200);
  await upload(app).expect(200);
});

test('validation errors release the concurrency slot', async () => {
  const app = makeApp({ maxConcurrent: 1 });
  await upload(app, Buffer.from('bad image')).expect(415);
  await upload(app).expect(200);
});

test('static assets work and unknown routes do not expose source files', async () => {
  await request(makeApp()).get('/styles.css').expect(200).expect('Content-Type', /css/);
  await request(makeApp()).get('/app.js').expect(200);
  await request(makeApp()).get('/src/app.js').expect(404);
  await request(makeApp()).get('/.env').expect(404);
});

test('demo mode is clearly labeled in both pages', async () => {
  const app = makeApp({ demo: true });
  assert.match((await request(app).get('/')).text, /Offline demo/);
  assert.match((await upload(app)).text, /SIMULATED RESULTS/);
});

test('label cleanup discards invalid scores and descriptions', () => {
  assert.deepEqual(cleanLabels([{ description: 'low', score: -.1 }, { description: 'high', score: 9 }, { description: '', score: 1 }, { description: 'bad', score: NaN }]), [{ description: 'high', score: 1 }, { description: 'low', score: 0 }]);
  assert.deepEqual(cleanLabels(null), []);
});

test('all HTML-sensitive characters are escaped', () => {
  assert.equal(escapeHtml(`<&>"'`), '&lt;&amp;&gt;&quot;&#39;');
  assert.match(resultPage({ labels: [], filename: 'safe.png' }), /0 labels/);
});

test('invalid configuration fails early', () => {
  assert.throws(() => createApp(), /detectLabels/);
  assert.throws(() => makeApp({ maxConcurrent: 0 }), /positive integer/);
});

test('Vision adapter requests exactly label detection with a deadline', async () => {
  let requestData, callOptions;
  const detect = createVisionDetector({ client: { async annotateImage(data, options) { requestData = data; callOptions = options; return [{ labelAnnotations: [{ description: 'Sky', score: .9, mid: 'ignored' }] }]; } } });
  assert.deepEqual(await detect(png), [{ description: 'Sky', score: .9 }]);
  assert.equal(requestData.image.content, png);
  assert.deepEqual(requestData.features, [{ type: 'LABEL_DETECTION', maxResults: 10 }]);
  assert.equal(callOptions.timeout, 15000);
  assert.equal(callOptions.retry, null);
});

test('Vision adapter handles per-image errors and missing labels', async () => {
  const failed = createVisionDetector({ client: { async annotateImage() { return [{ error: { code: 7, message: 'forbidden internal detail' } }]; } } });
  await assert.rejects(failed(png), VisionServiceError);
  const empty = createVisionDetector({ client: { async annotateImage() { return [{}]; } } });
  assert.deepEqual(await empty(png), []);
});

test('Vision adapter hides RPC details and distinguishes deadline errors', async () => {
  const failed = createVisionDetector({ client: { async annotateImage() { throw Object.assign(new Error('secret'), { code: 4 }); } } });
  await assert.rejects(failed(png), (error) => error.code === 'VISION_TIMEOUT' && !error.message.includes('secret'));
});

test('animated WebP is rejected', async () => {
  const { readFile } = await import('node:fs/promises');
  const animated = await readFile(new URL('./animated.webp', import.meta.url));
  const res = await upload(makeApp(), animated, 'image/webp', 'animated.webp').expect(400);
  assert.match(res.text, /Animated images are not supported/);
});

test('truncated image with a valid signature is rejected', async () => {
  await upload(makeApp(), png.subarray(0, 30)).expect(400);
});
