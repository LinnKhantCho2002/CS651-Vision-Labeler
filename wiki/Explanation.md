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

## App Engine deployment

The application runs in the existing course project `cs651-n33-lcho-20261014`, whose App Engine application is in `us-west1`. A separate `vision-labeler` service keeps this exercise independent from the project's earlier `default`, `translate`, and `friendlyeats` services.

1. Authenticate the Google Cloud CLI as the authorized student account and select the course project. Confirm the education billing account and available credits before running paid services.
2. Enable the Cloud Vision API. App Engine Admin, Cloud Build, and Artifact Registry APIs support the deployment/build workflow.
3. Use the dedicated `vision-labeler-runtime` service account with the Service Usage Consumer role. App Engine provides Application Default Credentials to the runtime, so the repository contains no downloaded service-account keys. The official Vision client library uses these credentials automatically.
4. Install the locked dependencies with `npm ci` under Node.js 24 and run `npm run check`. The final browser-origin fix is covered by a regression test.
5. Deploy `app.yaml` to the course project with `gcloud app deploy app.yaml --project=cs651-n33-lcho-20261014 --version=VERSION`. The configuration specifies Node.js 24, service `vision-labeler`, `npm start`, an F1 instance, a maximum of one instance, and `DEMO_MODE=false`. The runtime service-account flag selects the dedicated identity. Do not replace the service name with `default`.
6. Check Cloud Build/deployment completion and service traffic, then open the HTTPS application and `/health`. The health endpoint checks process mode only; a real image analysis is necessary to verify Vision authentication and API access.
7. Verify a successful image upload and its labels in a browser. Record the live version, date, screenshots, and limitations in the Demonstration and State of the System pages. Review costs and remove unused coursework resources only when the group and owner agree after grading.

The detailed commands, permissions, billing cautions, and historical verification record are in [Deployment guide](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/main/docs/DEPLOYMENT.md) and [Deployed system](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/main/docs/DEPLOYED.md).

### Browser-origin correction

The initial HTTP checks did not reveal a browser form-navigation issue: Helmet's default `Referrer-Policy: no-referrer` can produce `Origin: null` on a POST, which the server correctly refuses to parse as a valid origin. The policy is explicitly `same-origin` so same-site form submissions preserve their origin. The server still rejects null, malformed, and cross-origin requests. This does not add authentication or eliminate public-upload abuse risk.

## AI assistance acknowledgment

OpenAI's dot assistant assisted with implementation, documentation, automated testing, deployment and debugging for this exercise. The team should review and understand the code and verify the final submission. AI-generated explanations and tests do not replace the recorded execution evidence or establish individual team-member contributions.
