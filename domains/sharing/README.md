# Sharing Domain

Handles sharing notes between users.

## DynamoDB Table
- **NoteStack-SharedNotes** — Partition: `sharedWithUserId`, Sort: `noteId`

## Lambda Functions

| Function | Trigger | Description |
|---|---|---|
| ShareNote | POST /notes/share | Looks up target user in Cognito by email, copies note data to SharedNotes table, creates notification |

## Dependencies
- **shared/utils.mjs** — respond(), log(), getUserId(), parseBody()
- **notifications domain** — Creates notification for target user
- **Cognito** — ListUsers to resolve email → userId
