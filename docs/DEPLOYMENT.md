# Deploy to Google App Engine standard

This is the repeatable operator guide. See [DEPLOYED.md](DEPLOYED.md) for the verified 2026-11-10 deployment. Commands can change cloud resources and incur costs; review them before running. The existing project has other coursework services, so this application uses the separate vision-labeler service.

## 1. Agree on project, region and spending

Use a course-approved project with billing enabled and permission to process your test images. Have the billing owner approve expected use. Select the App Engine region carefully: it cannot be changed after app creation. Check whether the project already has an App Engine application before creating one. See [project and billing setup](https://docs.cloud.google.com/appengine/docs/standard/managing-projects-apps-billing) and [Vision setup](https://docs.cloud.google.com/vision/docs/setup).

Review current [Vision pricing](https://cloud.google.com/vision/pricing) and [App Engine pricing](https://cloud.google.com/appengine/pricing). Also account for builds, artifacts, logs and network charges. Configure alerts for a small approved budget. **Alerts-only budgets do not stop usage or cap spending.** Do not assume newer spend-cap products cover every service used here. See [billing budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets).

## 2. Prepare tooling and APIs

Install Node.js 24 and the [Google Cloud CLI](https://docs.cloud.google.com/sdk/docs/install) from official sources. Run these commands from the project directory, replacing uppercase placeholders:

```sh
export PROJECT_ID='YOUR_PROJECT_ID'
gcloud auth login
gcloud config set project "$PROJECT_ID"
gcloud projects describe "$PROJECT_ID"
gcloud services enable vision.googleapis.com appengine.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

API enablement requires `serviceusage.services.enable`, included in Service Usage Admin. Do not grant this administrative role to the application merely to make requests. If no App Engine app exists, an authorized operator can run:

```sh
gcloud app create --project="$PROJECT_ID" --region=YOUR_APPROVED_REGION
```

## 3. Configure identities, not downloaded keys

The runtime service account and the human/build deployment identity serve different purposes.

- **Runtime:** use a dedicated existing service account, for example `vision-labeler@PROJECT_ID.iam.gserviceaccount.com`. An authorized administrator can create it if needed and grant `roles/serviceusage.serviceUsageConsumer` on the project used for API consumption. The app sends image bytes, not `gs://` object references, so it does not need Storage Object Viewer for image uploads. Do not give it Owner, Editor or Vision Product Search administration roles. Google's [Vision authentication guide](https://docs.cloud.google.com/vision/docs/authentication) explains ADC and the separate Storage permission needed when reading bucket objects.
- **Deployer:** needs App Engine deployment permissions, `roles/iam.serviceAccountUser` on the chosen runtime identity, and the build/storage permissions documented in [App Engine roles](https://docs.cloud.google.com/appengine/docs/standard/roles). App Engine Deployer alone does not cover every deployment step or traffic management. Have the administrator grant only the necessary scope.
- **Build identity:** inspect the actual Cloud Build service account for this project; defaults and organization policies vary. Build or artifact permission errors should be corrected for that identity, not by making the runtime account an Editor. Consult [deployment troubleshooting](https://docs.cloud.google.com/appengine/docs/standard/troubleshooter/deployment).

Use the service account attached to the deployed version via ADC. Do not upload a JSON key, commit credentials, or set `GOOGLE_APPLICATION_CREDENTIALS` to a developer-machine path in `app.yaml`. The deployment flag below selects the identity; see [App Engine service accounts](https://docs.cloud.google.com/appengine/docs/standard/configure-service-accounts).

For a **local real-API test**, create local ADC separately from CLI login:

```sh
gcloud auth application-default login
gcloud auth application-default set-quota-project "$PROJECT_ID"
export GOOGLE_CLOUD_PROJECT="$PROJECT_ID"
npm ci
npm test
npm start
```

If quota-project setup reports `serviceusage.services.use` missing, ask the project administrator for Service Usage Consumer on that quota project. Use a non-sensitive, permitted image for a real test. Verify that demo mode is off.

## 4. Review the deployment configuration

The key `app.yaml` settings are shown below; the checked-in file also defines the entrypoint, environment values and HTTPS handler:

```yaml
runtime: nodejs24
service: vision-labeler
instance_class: F1
automatic_scaling:
  min_instances: 0
  max_instances: 1
  max_concurrent_requests: 10
```

Node.js 24 is generally available per [release notes](https://docs.cloud.google.com/appengine/docs/standard/nodejs/release-notes). Keep the package Node engine compatible with major 24. App Engine installs dependencies and uses the application's start command; the server must listen on its supplied `PORT`. See the [Node.js runtime](https://docs.cloud.google.com/appengine/docs/standard/nodejs/runtime).

The [app.yaml reference](https://docs.cloud.google.com/appengine/docs/standard/reference/app-yaml) supports this F1 automatic-scaling configuration. `min_instances: 0` permits scaling to zero, with cold starts. `max_instances: 1` limits the version, not all versions or all project charges. Do not change the minimum to a positive value without reviewing warmup requirements and cost. Use standard-environment names, not flexible-environment `min_num_instances` fields.

The application settings are `MAX_REQUESTS_PER_WINDOW=20`, `RATE_WINDOW_MS=600000`, and `MAX_CONCURRENT_ANALYSES=1`. The first two describe a shared per-process allowance, not a per-user limit. The third limits image processing independently of the App Engine HTTP concurrency setting. Keep the single-analysis setting for F1 and verify actual memory use. In real mode the app requests at most 10 labels with a 15-second API deadline and automatic retries disabled.

Check `.gcloudignore` and the upload file list before deployment:

```sh
gcloud meta list-files-for-upload
```

Exclude secrets, ADC files, `.env` files, `node_modules`, local screenshots and test uploads. Ensure demo mode is not enabled in the deployment configuration or environment.

## 5. Deploy only after authorization

```sh
gcloud app deploy app.yaml --project="$PROJECT_ID"   --service-account="vision-labeler@$PROJECT_ID.iam.gserviceaccount.com"
gcloud app browse --project="$PROJECT_ID"
```

Review the interactive project, service, version, identity and traffic-promotion details before confirming. This creates a cloud version and may make the application publicly reachable. Record the actual HTTPS address shown by Google rather than constructing or guessing a URL.

## 6. Verify the actual cloud system

1. Open the deployed HTTPS page in a fresh browser session.
2. Confirm it does not say demo/offline, check the processing consent box, and upload a permitted still JPEG or PNG no larger than 5 MiB and 25 megapixels. The server also accepts still WebP. App Engine startup rejects demo mode as an additional guard.
3. Check actual returned labels and confidence values. Repeat with a different image; do not present fixture output as inference.
4. Check `/health`, but do not treat it as an API integration check.
5. Try missing, non-image, corrupt, animated and over-limit uploads, plus a submission without consent. Expect a helpful error, not a stack trace or leaked credentials.
6. Review application logs and Vision metrics, billing/quota usage and the active runtime identity.
7. Capture real deployment screenshots and record date, commit/version, tests, failures and fixes in the wiki.

Use `gcloud app logs tail --service=vision-labeler --project="$PROJECT_ID"` for diagnosis. Authentication errors usually require checking ADC/identity, enabled API, quota project and billing. Capacity errors can reflect the intentionally small instance allowance; do not silently increase it. Native dependency failures require reviewing the sharp install/build logs and Node compatibility.

## 7. Exposure and cleanup

A public uploader can generate paid Vision requests. Image limits and HTML escaping do not prevent automated abuse. The implemented process-wide limiter defaults to 20 admitted upload attempts per 10 minutes, plus one active analysis. Before broad exposure, add appropriate authentication/access restrictions and robust centralized request quotas/rate limits. Any process-local limiter resets on restart, can be consumed by one attacker and is not a reliable project spending control. Keep classroom exposure short and monitor usage.

After grading, agree with the group on what must stay available. An operator should review old versions, build artifacts and logs, and disable the App Engine application or otherwise remove exposure when appropriate. Stopping a previous version does not necessarily remove every reachable service or storage charge. Do not delete a shared project or disable services used by other work. Verify resulting traffic and billing rather than assuming cleanup succeeded.
