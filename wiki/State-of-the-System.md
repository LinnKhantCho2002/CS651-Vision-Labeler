# State of the System

## Honest completion status

- Application source and local run workflow: prepared; consult the repository and current test report.
- Automated local tests: **37 passed, 0 failed** with `npm run check` on 2026-11-10, Node.js 24.22.1. Recorded in `docs/evidence/test-results.txt`. Production dependency audit found 0 vulnerabilities at that time.
- Offline demonstration: server-side HTML flow and simulated results passed automated integration tests. Browser visual checks/screenshots are **blocked**, not passed: Chromium could not start because its required socket operation was not permitted. See `docs/VERIFICATION.md`.
- Real Google Cloud Vision requests: **verified** on two synthetic images, with distinct real labels.
- Google App Engine deployment: **verified**, service vision-labeler, version vision-20261110b, us-west1. Live URL: https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com
- Source repository: **published, private**, at https://github.com/LinnKhantCho2002/CS651-Vision-Labeler. Actual GitHub wiki publication, group/reviewer access and group details remain **TODO**.
- Actual deployed screenshots: **TODO**.
- Canvas submission: **not performed**.

## Known limitations

The app requires processing consent and limits still JPEG/PNG/WebP uploads to 5 MiB and 25 megapixels. It strips metadata and normalizes to a JPEG within 2400 × 2400. Default safeguards allow 20 admitted attempts per 10 minutes per process and one concurrent analysis. These limits reset on restart and do not authenticate users. No custom model training, persistent image gallery, or production-grade account system is claimed. Offline fixtures do not depend on image contents. Basic cloud inference, deployment, native dependencies and minimal runtime permissions are verified. Load testing, sustained quota behavior and worst-case F1 memory behavior remain unverified. A public endpoint may incur charges through abuse; a single-instance setting and alerts-only budget are not hard spending caps.

## Remaining work

1. Fill in group membership and contributions.
2. Initialize and publish the actual GitHub wiki, and arrange group/reviewer access to the private repository.
3. Capture actual deployed browser screenshots and complete browser/mobile checks.
4. Submit the repository URL once per group in Canvas and record receipt.
5. Plan post-grading cleanup with the group and billing owner.

## Final verification log

2026-11-10, 18:54 UTC: 37 tests passed under Node 24.22.2; cloud HTTP checks passed on version vision-20261110b. /health replaced /healthz for cloud checks after a platform 404. Native Chrome form display passed; file-picker upload was canceled because Open remained disabled. See docs/DEPLOYED.md and docs/evidence/live/live-checks.json in the source package. Source publication is recorded below; actual wiki publication and Canvas submission are not claimed.
