# State of the System

## Verified work

- Source is published in the [public repository](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler), with this actual GitHub wiki and all five documentation pages.
- The source code, deployment configuration, tests and lockfile are unchanged from the deployed source package. Publication edits update documentation and verification output.
- All **37 automated checks passed** on Node.js 24.22.2. [Initial GitHub Actions run](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/actions/runs/42885107854) passed. The production dependency audit reported zero known vulnerabilities at that time; this is not a security guarantee.
- Real Google Cloud Vision requests succeeded for two synthetic images with distinct labels. [Live evidence](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/blob/4dc38a9e03bc92f1ff56a9f2689d675b75bb2218/docs/evidence/live/live-checks.json).
- Google App Engine deployment was verified: service `vision-labeler`, version `vision-20261110b`, region `us-west1`. [Live application](https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com).
- Public repository/wiki reading is enabled. No collaborator invitations were sent because group GitHub usernames were not supplied.
- Canvas submission: **not performed**.

## Known limitations

The app requires processing consent and accepts still JPEG, PNG and WebP uploads up to 5 MiB and 25 megapixels. It strips metadata and normalizes images to a JPEG within 2400 × 2400. Default safeguards allow 20 admitted attempts per ten minutes per process and one concurrent analysis. They reset on restart, do not authenticate users, and do not guarantee a spending ceiling. App Engine runs at most one F1 instance, but this and the alert-only budget are not hard billing caps.

No custom model training, persistent image gallery or production-grade account system is claimed. Offline fixture labels do not depend on image contents. Load testing, sustained quota behavior and worst-case F1 memory usage remain unverified. Public upload access can be abused and incur charges.

The deployed form was visible in Chrome, but PNG file selection left Open disabled. The browser upload was canceled rather than counted as a pass. Actual deployed screenshots and full browser/mobile checks remain incomplete; successful direct HTTP inference is documented separately.

## Remaining work

1. Fill in the group name/number, all members and their contributions.
2. Give group members write access after their GitHub usernames and intended permissions are supplied.
3. Complete browser/mobile checks and add actual deployed screenshots.
4. Have one group member submit the repository URL once in Canvas and record the receipt.
5. Agree on post-grading cleanup with the group and billing owner.

## Verification history

- 2026-11-10, 18:54 UTC: 37 tests and cloud HTTP checks passed on version `vision-20261110b`. `/health` replaced `/healthz` for cloud monitoring after the platform returned a generic 404 for `/healthz`.
- 2026-11-10: source published, tests repeated under Node.js 24.22.2, and GitHub Actions passed. The repository was initially private; with the owner's approval it became public because the current account plan does not support private wikis. The actual wiki was then initialized and published.
