# Demonstration

## Evidence status

**Real App Engine and Vision HTTP checks completed on 2026-11-10.** The live app is https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com. Two synthetic images produced distinct real labels; see docs/DEPLOYED.md in the source package. Browser screenshot evidence remains to be added. Local offline screenshots must be captioned “offline demo, fixture labels”; they cannot prove Google Cloud Vision or App Engine works.

## Demonstration script

1. Show the deployed HTTPS address and describe the application.
2. Explain that submitting a real-mode image sends it to Google Cloud Vision.
3. Select a permitted, non-sensitive still JPEG/PNG/WebP under 5 MiB and at most 25 megapixels; check the processing consent box.
4. Submit and explain several returned labels and confidence values.
5. Repeat with a visually different image and discuss plausible differences or mistakes.
6. Show rejection of a non-image and an oversized file. Explain why validation runs on the server.
7. Briefly show the vision-labeler App Engine service/version and the repository, without exposing secrets, billing details or private identifiers.

## Local offline screenshots

**Not captured in this preparation environment.** Chromium could not start because the environment refused its required socket operation. The optional browser script in `scripts/browser-smoke.py` can create `docs/evidence/demo-before.png`, `demo-after.png`, and `demo-mobile.png` on a compatible local machine. If captured using that script, these show **offline demo mode with simulated fixtures, not real Vision inference or cloud deployment**. Do not publish the image templates until the files actually exist.

GitHub wikis are separate repositories: `../docs/evidence/...` does not reliably refer to the main repository. Replace `OWNER`, `REPOSITORY` and `COMMIT_SHA` in the templates below with verified values after publication, then paste the image markup outside the example code block. Pinning to the tested commit keeps the evidence reproducible.

```markdown
![Offline demo upload form; no Google API call](https://raw.githubusercontent.com/OWNER/REPOSITORY/COMMIT_SHA/docs/evidence/demo-before.png)
![Offline demo results; simulated labels only](https://raw.githubusercontent.com/OWNER/REPOSITORY/COMMIT_SHA/docs/evidence/demo-after.png)
```

These are URL templates, not published or verified image links. For a private repository, verify that the chosen image location works for reviewers; upload the images to the wiki through an authorized workflow if needed.

## Real cloud screenshots to add

- **TODO: deployed home page screenshot**, with the real URL visible.
- **TODO: real successful analysis screenshot**, captioned with test date and permitted source image description.
- **TODO: second image result screenshot**, showing actual API output.
- **TODO: validation error screenshot**.
- **TODO: App Engine service/version evidence**, redact private account information.

Store screenshot assets in a location accessible to course reviewers and embed the verified links here. Never invent screenshots or API output.

## Verification record

- Verified: 2026-11-10 at 18:54 UTC using automated HTTP checks.
- Deployed version: vision-20261110b. Source repository: https://github.com/LinnKhantCho2002/CS651-Vision-Labeler (private). See the source commit and Actions run for the publication checks.
- Actual URL: https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com
- Inputs: two synthetic fixtures, landscape and apple, created for testing; no private photographs.
- Outputs: landscape Slope/Graphics/Summit; apple Fruit/Produce/Apple among ten labels. Validation responses 400/403/413/415 matched expected errors.
- Real API verified by: deployed demo mode false, runtime ADC identity, distinct actual labels from two images, and /health mode vision.
