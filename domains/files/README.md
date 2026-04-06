# Files Domain

Manages file uploads and downloads via S3 pre-signed URLs.

## S3 Bucket
- **notestack-files-sandhiya** — CORS enabled, `users/{userId}/` prefix

## Lambda Functions

| Function | Trigger | Description |
|---|---|---|
| GenerateUploadUrl | POST /notes/upload-url | Validates file extension via Secrets Manager, generates pre-signed PUT URL |
| GenerateDownloadUrl | GET /notes/download-url | Generates pre-signed GET URL for file download |

## Dependencies
- **shared/utils.mjs** — respond(), log(), getUserId()
- **Secrets Manager** — notestack/config (ALLOWED_FILE_TYPES, BUCKET_NAME)
