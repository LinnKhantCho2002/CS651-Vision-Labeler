# Demonstration

## Evidence status

Real App Engine and Google Cloud Vision HTTP checks completed on **2026-11-10 at 18:54 UTC**, using deployed version `vision-20261110b`. [Open the live app](https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com). Two synthetic, non-sensitive images produced distinct real labels. These results were verified through HTTP requests, not the offline fixture detector.

- Landscape: Slope (79.3%), Graphics (64.4%) and Summit (56.7%).
- Apple: Fruit (98.8%), Produce (98.3%), Natural foods (97.9%), Red (97.8%) and Apple (96.8%), among ten labels.
- Missing image or consent returned 400, animated input returned 400, incorrect MIME or corruption returned 415, oversize input returned 413, and cross-origin submission returned 403.
- `/health` returned 200 and reported real Vision mode. This endpoint alone is not evidence that API calls succeed; the two successful image analyses supply that evidence.

## Reproducible source evidence

These links are pinned to the published source commit containing the original deployment evidence:

- [Full deployment record](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/4dc38a9e03bc92f1ff56a9f2689d675b75bb2218/docs/DEPLOYED.md)
- [Machine-readable live HTTP check log](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/4dc38a9e03bc92f1ff56a9f2689d675b75bb2218/docs/evidence/live/live-checks.json)
- [Landscape response HTML](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/4dc38a9e03bc92f1ff56a9f2689d675b75bb2218/docs/evidence/live/sample-landscape-result.html)
- [Apple response HTML](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/4dc38a9e03bc92f1ff56a9f2689d675b75bb2218/docs/evidence/live/test-apple-result.html)
- [Synthetic landscape input](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/4dc38a9e03bc92f1ff56a9f2689d675b75bb2218/docs/evidence/sample-landscape.png)
- [Synthetic apple input](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/4dc38a9e03bc92f1ff56a9f2689d675b75bb2218/docs/evidence/live/test-apple.png)
- [Repeatable HTTP test script](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/4dc38a9e03bc92f1ff56a9f2689d675b75bb2218/scripts/live-smoke.py), which makes real API requests and consumes quota.

### Test inputs, not screenshots

![Synthetic landscape used for the live HTTP test](https://raw.githubusercontent.com/LinnKhantCho2002/CS651-Vision-Labeler/4dc38a9e03bc92f1ff56a9f2689d675b75bb2218/docs/evidence/sample-landscape.png)

![Synthetic apple used for the live HTTP test](https://raw.githubusercontent.com/LinnKhantCho2002/CS651-Vision-Labeler/4dc38a9e03bc92f1ff56a9f2689d675b75bb2218/docs/evidence/live/test-apple.png)

These are the synthetic input images, not screenshots of the deployed application or proof by themselves of API success.

## Live demonstration script

1. Open the deployed HTTPS address and explain the image-labeling goal.
2. Explain that submitting a real-mode image sends it to Google Cloud Vision.
3. Select a permitted, non-sensitive still JPEG, PNG or WebP under 5 MiB and at most 25 megapixels, then check the processing consent box.
4. Submit and explain the returned labels and confidence scores. Scores are predictions, not guarantees.
5. Repeat with a visually different permitted image and discuss plausible differences or mistakes.
6. Show rejection of an unsupported/corrupt or oversized input, then explain server-side validation.
7. Show this repository, the wiki, and deployment evidence without exposing credentials or billing details.

## Browser evidence and remaining work

The deployed form displayed in Chrome on the Mac. The native file picker left Open disabled for a PNG; the selection was canceled and the browser upload is not counted as passed. A later attempt on 2026-11-10 reproduced this limitation. No deployed result screenshots, mobile-browser verification, or load/memory stress tests are claimed.

Still needed: genuine deployed home/result screenshots, a second browser result and a validation-error screenshot. Capture them from the real service, label their date and source image, and do not substitute offline output for real Vision evidence.

For an offline walkthrough, run `npm run demo`. Its fixture labels do not depend on image contents. Any screenshots from that mode must be labeled “offline demo, fixture labels.” See the [optional browser test instructions](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/main/docs/VERIFICATION.md).
