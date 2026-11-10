# Submission checklist

## Group and publication

- [ ] Record group number/name, every member and contributions.
- [x] Publish one public GitHub repository and actual wiki for the group.
- [x] Publish source, lockfile, app.yaml, tests and instructions with no credentials or private test images. Repository: https://github.com/LinnKhantCho2002/CS651-Vision-Labeler (public).
- [x] Publish actual GitHub wiki pages and verify navigation and evidence links.
- [x] Enable public read access for course reviewers.
- [ ] Arrange group-member write access after their GitHub usernames are supplied.
- [x] Fill in verified repository, wiki and application URLs throughout the documentation.

## Application and evidence

- [x] Run `npm ci` and `npm test` on Node.js 24; 37 passed.
- [ ] Try the offline demo and keep its fixture warning visible.
- [ ] Configure approved billing, APIs, ADC/runtime identity and cost alerts.
- [x] Test real Vision calls with two authorized synthetic images.
- [x] Deploy the separate vision-labeler service to App Engine standard with demo disabled.
- [ ] Test the public HTTPS application, a second image, required consent and validation failures (5 MiB, 25 MP, corrupt/unsupported/animated inputs).
- [ ] Verify single-analysis concurrency and the 20-attempt/10-minute process allowance; retain the distinction from a hard cost cap.
- [ ] Verify logs/metrics, resource use and cloud identity; `/health` alone is insufficient.
- [ ] Add genuine screenshots and test dates/version to the wiki.
- [ ] Finish Application, Demonstration, Explanation and State-of-the-System pages honestly, including known limitations.
- [ ] Review public-upload abuse risk and arrange cleanup after grading.

## Submit

- [ ] Choose one group member to submit the **GitHub repository URL once per group in Canvas**.
- [ ] Open the submitted URL as a reviewer would and verify that the wiki and live app are discoverable.
- [ ] Record the Canvas submission confirmation for the group.

Deployment and real Vision checks are recorded in DEPLOYED.md. Source publication is complete. Actual GitHub wiki publication and public read access are complete. Group write access and Canvas submission are not claimed. Unchecked items remain for the group.
