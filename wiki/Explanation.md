# Explanation

## Request flow

Browser → Express upload endpoint → size/type/decode checks → sharp re-encoding → Google Cloud Vision label detection → escaped HTML result → browser.

The browser submits a multipart form containing the image and the required `consent=yes` field. The backend enforces the upload limit and checks the actual image rather than relying on the extension. Decoding and re-encoding rejects malformed data and avoids forwarding arbitrary uploaded bytes unchanged. Still JPEG/PNG/WebP files must fit both the 5 MiB input limit and 25-megapixel decoded-image limit. The normalization step strips metadata, auto-orients, resizes within 2400 × 2400 without enlargement, flattens transparency onto white, and produces JPEG at quality 85. Image data is processed in memory. The application calls the official `@google-cloud/vision` library using Application Default Credentials (ADC), using `annotateImage` with `LABEL_DETECTION`, at most 10 results, a 15-second deadline and automatic retries disabled. It then displays sanitized label descriptions and confidence scores, sorted descending. API-level and per-image failures become generic errors without logging raw image data or upstream messages. See [Google label detection](https://docs.cloud.google.com/vision/docs/labels).

## Design choices

- Node.js 24 and Express keep request handling small and understandable.
- App Engine standard manages the web runtime and scaling; the application uses the separate vision-labeler service to preserve earlier coursework.
- ADC separates credentials from source code. Local development uses local ADC; cloud execution uses the attached runtime service account. See [Vision authentication](https://docs.cloud.google.com/vision/docs/authentication).
- No persistent upload store is needed for one-request analysis. This does not eliminate cloud provider processing or infrastructure logs.
- HTML escaping treats API descriptions as data instead of executable markup.
- Offline demo mode makes the interface inspectable without cloud credentials. Its synthetic labels are explicitly marked and cannot validate the real API.

## Boundaries

Image labels can be incomplete or wrong and do not establish identity or other sensitive conclusions. The 5 MiB input limit, 25-megapixel decode limit and single-analysis allowance reduce memory/CPU pressure, but do not guarantee every accepted image will fit the F1 memory budget. Cloud deployment must also be checked under realistic resource limits.

A process-wide guard admits at most 20 upload attempts in a 10-minute window by default, including subsequently invalid requests. It allows one active analysis; App Engine separately permits up to 10 concurrent HTTP requests. The guard resets on restart and is not shared across versions. Origin checking and security headers provide additional browser safeguards, but do not authenticate callers. The small instance allowance reduces capacity but does not enforce a spending ceiling. Public access needs abuse controls before extended use. See the repository's deployment guide for permissions, cost warnings and cloud verification.
