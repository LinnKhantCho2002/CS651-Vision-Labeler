# GitHub publication

Published on 2026-11-10 from the deployed source package.

- [Public source repository](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler)
- [Published GitHub wiki](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/wiki)
- Main branch: `main`
- Five wiki pages: Home, Application, Demonstration, Explanation and State of the System, plus navigation sidebar.
- Application code/configuration, tests and lockfile are preserved from the deployed ZIP. Publication edits update documentation and verification output.
- Group name, members, contributions and collaborator GitHub usernames are not yet supplied. No invitations were sent.
- Canvas submission was not performed.

## Visibility and wiki

The repository was initially created privately. GitHub displayed “Upgrade to GitHub Pro or make this repository public to enable this feature” for the wiki. The owner explicitly approved public visibility. The repository was made public and its actual wiki initialized and published. Both are now intended to be readable by course reviewers without sign-in. Public reading does not grant group members write access.

## Verification

The initial source commit is `4dc38a9e03bc92f1ff56a9f2689d675b75bb2218`. The remote main ref was verified. [GitHub Actions run 42885107854](https://github.com/LinnKhantCho2002/CS651-Vision-Labeler/actions/runs/42885107854) passed all checks on Node.js 24. The Mac re-run used Node.js 24.22.2: 37 tests passed and the production dependency audit reported zero known vulnerabilities. Later publication-only commits update links and status without changing application code.

The browser rendered the deployed form, but the native PNG picker left Open disabled. The selection was canceled without upload, and no browser-result screenshot is claimed. Separate real HTTP inference evidence is in `docs/evidence/live/`.

No service-account key, login token or private user photo is included. The deployment documentation names the course cloud project and runtime service account for reproducibility; these names are not credentials.

## Documentation maintenance

The `wiki/` folder contains source copies. GitHub's actual wiki is a separate repository at `https://github.com/LinnKhantCho2002/CS651-Vision-Labeler.wiki.git`. Keep both synchronized when editing. Capture genuine deployed browser screenshots and finish group details before final course submission.
