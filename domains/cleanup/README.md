# Cleanup Domain

Scheduled maintenance tasks triggered by EventBridge.

## Lambda Functions

| Function | Trigger | Description |
|---|---|---|
| AutoDeleteOldNotes | EventBridge (daily) | Scans all notes, deletes those older than 30 days + S3 files + SharedNotes entries |

## EventBridge Rule
- **NoteStack-AutoDelete** — `rate(1 day)`

## Dependencies
- **shared/utils.mjs** — log()
- Touches notes domain table (NoteStack-Notes) and sharing domain table (NoteStack-SharedNotes)
