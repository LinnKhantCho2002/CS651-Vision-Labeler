# Verified App Engine deployment

Verified on 2026-11-10 at 18:54 UTC.

- Application: https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com
- Health: https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com/health
- Project: cs651-n33-lcho-20261014
- Region: us-west1
- Service: vision-labeler
- Live version: vision-20261110b, receiving 100% of service traffic.
- Runtime: Node.js 24, App Engine standard F1, maximum one instance, demo mode false.
- Runtime identity: vision-labeler-runtime@cs651-n33-lcho-20261014.iam.gserviceaccount.com
- Runtime project role: Service Usage Consumer only. No service-account key was created or included.
- Cloud Build: 9f76b0d6-53e2-46e6-a414-e173fa06f27e, SUCCESS.
- Existing default, translate and friendlyeats services were not modified.
- Superseded test version vision-20261110a was removed after verifying a source/config redeployment backup. Only vision-20261110b remains for this service.

## Verified checks

The 37 automated tests passed under Node.js 24.22.2. npm audit reported zero known vulnerabilities.

The final live HTTP checks passed:
- Home page and /health return HTTP 200. Health reports vision mode.
- Two different synthetic PNG images return genuine Cloud Vision labels.
- The landscape returned Slope (79.3%), Graphics (64.4%) and Summit (56.7%).
- The apple returned Fruit (98.8%), Produce (98.3%), Natural foods (97.9%), Red (97.8%) and Apple (96.8%), among ten labels.
- Missing image/consent and animated inputs return 400; wrong MIME/corruption return 415; oversize returns 413.
- Cross-origin submission returns 403; a request for server source returns 404.
- Results came from real Vision calls, not the offline fixture detector.

Raw response pages and a machine-readable check log are in docs/evidence/live/. The repeatable script scripts/live-smoke.py makes real Vision calls and consumes quota.

## Deployment-only issue and fix

The first version served the application and real inference, but Google's frontend returned a generic 404 for /healthz. The corrected version adds /health, which was verified live. The original /healthz alias remains for local compatibility; use /health in cloud monitoring.

## Browser evidence and remaining limits

Chrome on the connected Mac displayed the live upload form. Its native file picker left Open disabled for the selected PNG, so the browser upload attempt was canceled and is not counted as passed. The production multipart upload endpoint was tested directly with real images. No deployed screenshots, mobile cloud browser checks or load/memory stress tests are claimed.

This is a classroom deployment, not a production-hardened uploader. Images are processed in memory and sent to Google Cloud Vision. The application remains publicly reachable. One concurrent analysis, 20 admitted attempts per ten minutes per process, and one F1 instance reduce exposure but are not a hard spending limit. The existing project budget is alert-only. Review usage and arrange cleanup after grading.

Source is published privately at https://github.com/LinnKhantCho2002/CS651-Vision-Labeler. Actual wiki publication, group/member details, reviewer access and Canvas submission remain unfinished.
