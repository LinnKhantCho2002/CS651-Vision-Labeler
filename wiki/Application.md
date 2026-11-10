# Application

## Purpose

Vision Labeler lets a user upload a photo and inspect the labels Google Cloud Vision assigns to its visual content. It is a small cloud-integration exercise, not a custom-trained model or an authoritative classification system.

## Interface

Open the home page, select one still JPEG, PNG or WebP image no larger than 5 MiB or 25 megapixels, confirm the processing notice, and submit it. The result page displays labels and confidence values, or a readable error if input validation or the API call fails. Confidence is a model score, not certainty.

- `GET /` provides the form.
- `POST /analyze` validates and processes the upload.
- `GET /health` checks process availability, not end-to-end cloud readiness.

The server decodes accepted images with sharp, strips metadata, auto-orients, resizes within 2400 × 2400 without enlargement, flattens transparency onto white and re-encodes as quality-85 JPEG before analysis. Animated files are rejected. It requests up to 10 labels with a 15-second deadline and no automatic retries. Results are filtered, confidence-clamped, sorted descending and HTML-escaped. It does not save uploaded image files. Real mode transmits processed image bytes to Google Cloud Vision; use only images you are permitted to send. Do not claim that no image processing occurs outside the application.

## Resource safeguards

The default process-wide allowance is 20 admitted upload attempts per 10 minutes, with one analysis at a time. Invalid uploads admitted by the guard also use the allowance. The state resets on restart and is not shared across processes or versions. A busy server can return 503; an exhausted allowance returns 429. These limits do not authenticate users or guarantee a cost ceiling.

## Access

- Live application: [Vision Labeler](https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com)
- Group repository: [https://github.com/LinnKhantCho2002/CS651-Vision-Labeler](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler) (private; reviewer access must be arranged)
- Local use: install Node.js 24, run `npm ci`, then `npm run demo` for fixture output or configure ADC and run `npm start` for real API calls.

**Offline mode warning:** fixture labels illustrate the interface only. They are not computed from the uploaded image.
