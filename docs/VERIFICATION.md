# Verification report

Updated on **2026-11-10** after real deployment. See [DEPLOYED.md](DEPLOYED.md) and [live HTTP checks](evidence/live/live-checks.json). Source publication is recorded below. This is not a claim of actual wiki publication, collaborator access or course submission.

## Initial local checks passed

- Node.js 24.22.1, npm 11.9.0.
- `npm run check`: JavaScript syntax checks plus **37 tests passed, 0 failed**.
- Tests exercise the actual Express routes with Supertest and real JPEG/PNG/WebP bytes. They cover normalization, metadata removal, upload limits, animation rejection, corrupt/truncated files, consent, HTML escaping, empty results, safe errors, request/concurrency limits and static routes.
- The Vision adapter is tested with an injected fake client: request shape, label feature, maximum results, timeout, disabled retries, response and error handling. **Those checks do not call Google.**
- Actual local server startup and HTTP smoke check: `/health` returned demo mode, and a multipart landscape upload returned clearly marked simulated labels. No Google request was made.
- `npm audit --omit=dev --audit-level=high`: **0 vulnerabilities reported** at preparation time. This is a dependency advisory check, not a security guarantee.

Raw output: [tests](evidence/test-results.txt), [production dependency audit](evidence/dependency-audit.txt).

## Cloud follow-up and remaining checks

- **Browser visual checks and screenshots:** Chromium failed to start because this execution environment refused its required local socket operation, including a retry with the permitted execution setting. No screenshots were created and browser checks are not counted as passed.
- **Real Vision request:** passed on two synthetic images in the deployed service. See the deployment record.
- **App Engine deployment and cloud smoke test:** passed. Final version vision-20261110b uses the separate vision-labeler service; /health and live validation checks passed.
- **GitHub source repository:** published privately at https://github.com/LinnKhantCho2002/CS651-Vision-Labeler. Actual wiki publication and collaborator/reviewer access remain unfinished.
- **Canvas submission:** not performed.

## Run the optional browser checks locally

Start `npm run demo` in one terminal. In another terminal, from the project directory, install the optional Python test tooling in a virtual environment:

```sh
python -m venv .venv
# Activate the virtual environment for your shell before the next commands.
python -m pip install playwright
python -m playwright install chromium
python scripts/browser-smoke.py
```

To use an already installed Chromium, set `CHROMIUM_EXECUTABLE` to its full path. The script visits only the local demo at `http://127.0.0.1:8080`. It checks form preview, results, Back navigation, replacing/clearing an upload, mobile layout, JavaScript-disabled operation and client errors. It writes its report and screenshots under `docs/evidence/`. Test script results remain unverified until you run it successfully.

The supplied `sample-landscape.png` is a synthetic landscape created for this project, not a private user photo. The offline demo returns the same fixture labels for every accepted image. Do not present these fixture labels or local screenshots as real Google inference or deployment evidence.

## Finish the assignment

Review the real deployment/API record, capture actual before/after screenshots, fill remaining wiki TODOs, review as a group, initialize/publish the actual wiki and arrange repository access. Submit the repository URL once per group in Canvas. Keep the honest remaining-issues section even if some limitations persist.
