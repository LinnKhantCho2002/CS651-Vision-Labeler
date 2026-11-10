# CS651 Vision Labeler

A small Node.js/Express web application for uploading an image and displaying Google Cloud Vision labels with confidence scores. Deployment target: Google App Engine **standard** environment, Node.js 24.

**Status:** deployed and verified with real Google Cloud Vision on 2026-11-10. [Open the live application](https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com) and read the [deployment record](docs/DEPLOYED.md). Source is published in a private [GitHub repository](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler). Actual wiki publication, group/reviewer access, group details, screenshots and Canvas submission remain unfinished. Offline demo mode still uses clearly marked fixtures.

## Run locally

Install Node.js 24, then from this directory:

```sh
npm ci
npm test
npm run demo
```

Open the local address printed by the server (normally http://localhost:8080). Demo mode needs no Google credentials and must remain visibly marked. To use real inference, stop the demo, follow [deployment/authentication setup](docs/DEPLOYMENT.md), and run `npm start`.

## What it does

- `GET /`: upload form.
- `POST /analyze`: receives one multipart image, validates and decodes it with sharp, re-encodes it, and requests Vision label detection.
- `GET /health`: basic process health, not proof that Vision credentials or billing work.
- Accepts still JPEG, PNG and WebP up to 5 MiB and 25 megapixels. File names and browser MIME types alone are not trusted. Images are decoded, auto-oriented, resized within 2400 × 2400 without enlargement, flattened onto white and re-encoded as JPEG at quality 85, stripping metadata.
- Requires the image-processing consent checkbox. Requests at most 10 labels with a 15-second API deadline and no automatic retries.
- Defaults to 20 admitted upload attempts per 10 minutes per process and one concurrent analysis. These shared, restartable safeguards are not user authentication or hard billing limits.
- Escapes text displayed in HTML, including returned labels. Confidence represents model output, not a guarantee of correctness.
- Keeps image processing in memory rather than saving uploads. In real mode, image bytes are sent to Google Cloud Vision. Do not upload confidential images or images you lack permission to process.

## Project guide

- [Verification report](docs/VERIFICATION.md): 37 automated checks passed; real cloud checks passed. Browser upload/screenshots remain incomplete.
- [Deploy and verify](docs/DEPLOYMENT.md)
- [Submission checklist](docs/SUBMISSION-CHECKLIST.md)
- [Wiki home](wiki/Home.md), [Application](wiki/Application.md), [Demonstration](wiki/Demonstration.md), [Explanation](wiki/Explanation.md), [State of the System](wiki/State-of-the-System.md)

## Group submission details

- Group name/number: **TODO: supply**
- Members and contributions: **TODO: supply**
- Shared GitHub repository: [https://github.com/LinnKhantCho2002/CS651-Vision-Labeler](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler) (private)
- Shared GitHub wiki: Pending first-page initialization and publication; reviewed page sources are in `wiki/`.
- Deployed application: [Vision Labeler](https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com)

All members should work from the same GitHub repository and wiki. Submit the repository URL **once per group in Canvas**. Files under `wiki/` are page drafts; putting them in the main repository does not automatically publish a GitHub wiki.

## Cost and security warning

Cloud deployment requires an approved Google Cloud project and billing setup. App Engine, Vision, builds, artifact storage and network use may incur charges. One instance is not a spending cap. An unauthenticated public upload endpoint can be abused to trigger paid requests. Review the deployment guide before exposing it; this exercise is not production-hardened.
