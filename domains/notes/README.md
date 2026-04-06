# Notes Domain

Core note management — CRUD operations and search.

## DynamoDB Table
- **NoteStack-Notes** — Partition: `userId`, Sort: `noteId`, GSI: `CategoryIndex` (userId + category)

## Lambda Functions

| Function | Trigger | Description |
|---|---|---|
| CreateNote | POST /notes | Validates input, generates noteId, saves to DynamoDB, notifies other users |
| GetNotes | GET /notes | Query by userId, optional category filter via GSI, includes shared notes |
| UpdateNote | PUT /notes | Dynamic update of title/content/category |
| DeleteNote | DELETE /notes | Deletes from DynamoDB + S3 file + SharedNotes cleanup |
| SearchNotes | GET /notes/search | Query with FilterExpression `contains()` on title |

## Dependencies
- **shared/utils.mjs** — respond(), log(), getUserId(), parseBody()
- **notifications domain** — CreateNote writes to NoteStack-Notifications table
- **files domain** — DeleteNote cleans up S3 files
