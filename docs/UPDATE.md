# NoteStack — Project Update Log

> This document tracks the progress of every implementation step. Each task is marked as it's completed. Updated after every change.

**Project:** NoteStack — Serverless Student Notes & File Sharing Platform
**Region:** ap-south-1 (Mumbai)
**Started:** 2026-04-06
**Last Updated:** 2026-04-06 (after code generation)

---

## Overall Progress

| Phase | Status | Progress |
|---|---|---|
| Phase 1: AWS Infrastructure | In Progress | 1/9 |
| Phase 2: Lambda Functions | Code Complete | 8/9 (deploy pending) |
| Phase 3: API Gateway | Not Started | 0/11 |
| Phase 4: Frontend | Code Complete | 11/11 |
| Phase 5: CloudWatch Monitoring | Not Started | 0/4 |
| Phase 6: S3 Static Hosting | Not Started | 0/5 |
| Phase 7: Integration Testing | Not Started | 0/11 |

**Total:** 20/60 tasks completed

---

## AWS Resource IDs

> Fill these in as you create each resource. These are needed to wire everything together.

| Resource | Name | ID / ARN |
|---|---|---|
| IAM Role | NoteStack-Lambda-Role | `arn:aws:iam::896823725438:role/NoteStack-Lambda-Role` |
| S3 Bucket (files) | notestack-files-sandhiya | `notestack-files-sandhiya` |
| S3 Bucket (website) | notestack-web-sandhiya | `pending` |
| DynamoDB Table | NoteStack-Notes | `NoteStack-Notes` (with CategoryIndex GSI) |
| DynamoDB Table | NoteStack-SharedNotes | `NoteStack-SharedNotes` |
| Cognito User Pool | NoteStack-Users | Pool ID: `ap-south-1_EM3m76UWV` |
| Cognito App Client | NoteStack-WebApp | Client ID: `29vol0pqf64s7o0he3lobd62ns` |
| Secrets Manager | notestack/config | `arn:aws:secretsmanager:ap-south-1:896823725438:secret:notestack/config-3zVHhE` |
| API Gateway | NoteStack-API-Sandhiya | API ID: `019vhyfrah` |
| API Gateway URL | dev stage | `https://019vhyfrah.execute-api.ap-south-1.amazonaws.com/dev` |
| EventBridge Rule | NoteStack-AutoDelete | `arn:aws:events:ap-south-1:896823725438:rule/NoteStack-AutoDelete` |

---

## Phase 1: Project Setup & AWS Infrastructure

- [x] 1.1 Initialize project — git repo + folder structure
- [ ] 1.2 Install & configure AWS CLI (`aws configure`)
- [ ] 1.3 Create IAM Role — `NoteStack-Lambda-Role`
- [ ] 1.4 Create S3 Bucket — `notestack-files-yourname` + CORS
- [ ] 1.5 Create DynamoDB Table — `NoteStack-Notes` + GSI `CategoryIndex`
- [ ] 1.6 Create DynamoDB Table — `NoteStack-SharedNotes`
- [ ] 1.7 Create Cognito User Pool — `NoteStack-Users` + App Client
- [ ] 1.8 Create Secret — `notestack/config`
- [ ] 1.9 Create EventBridge Rule — `NoteStack-AutoDelete`

**Phase 1 Notes:**
> _(Add any issues, decisions, or learnings here as you go)_

---

## Phase 2: Lambda Functions (Backend)

- [x] 2.1 Create shared helpers — `lambda/shared/utils.mjs` (`respond()`, `log()`)
- [x] 2.2 Create `CreateNote` Lambda — validate input, generate noteId, save to DynamoDB
- [x] 2.3 Create `GetNotes` Lambda — query by userId, optional category filter via GSI
- [x] 2.4 Create `UpdateNote` Lambda — update title/content/category
- [x] 2.5 Create `DeleteNote` Lambda — delete from DynamoDB + S3 + SharedNotes
- [x] 2.6 Create `GenerateUploadUrl` Lambda — validate file type, generate pre-signed URL
- [x] 2.7 Create `SearchNotes` Lambda — scan with FilterExpression on title
- [x] 2.8 Create `AutoDeleteOldNotes` Lambda — delete notes older than 30 days
- [ ] 2.9 Deploy & test all Lambda functions

**Phase 2 Notes:**
> _(Add any issues, decisions, or learnings here as you go)_

---

## Phase 3: API Gateway

- [ ] 3.1 Create REST API — `NoteStack-API`
- [ ] 3.2 Create Cognito Authorizer
- [ ] 3.3 Create `/notes` resource — POST, GET, PUT, DELETE methods
- [ ] 3.4 Create `/notes/upload-url` resource — POST method
- [ ] 3.5 Create `/notes/search` resource — GET method
- [ ] 3.6 Create `/notes/share` resource — POST method
- [ ] 3.7 Link each method to its Lambda function
- [ ] 3.8 Attach Cognito Authorizer to all methods
- [ ] 3.9 Enable CORS on all resources
- [ ] 3.10 Deploy to `dev` stage
- [ ] 3.11 Test all endpoints with curl or Postman

**Phase 3 Notes:**
> _(Add any issues, decisions, or learnings here as you go)_

---

## Phase 4: Frontend

- [x] 4.1 Create `index.html` — page structure, header, auth section, notes section
- [x] 4.2 Create `style.css` — theming, layout, cards, animations, responsive design
- [x] 4.3 Add config object — `API_URL`, `COGNITO_CLIENT_ID`
- [x] 4.4 Implement auth — `signUp()`, `verify()`, `login()`, `logout()`
- [x] 4.5 Implement API helper — `apiCall(method, path, body)`
- [x] 4.6 Implement CRUD — `createNote()`, `loadNotes()`, `editNote()`, `deleteNote()`
- [x] 4.7 Implement file upload — pre-signed URL flow
- [x] 4.8 Implement search — debounced search bar
- [x] 4.9 Implement categories — filter dropdown + create/edit tag
- [x] 4.10 Implement sharing — share modal + `/notes/share` call
- [x] 4.11 Add XSS prevention — escape all user-generated HTML

**Phase 4 Notes:**
> _(Add any issues, decisions, or learnings here as you go)_

---

## Phase 5: CloudWatch Monitoring

- [ ] 5.1 Verify structured `log()` calls in all Lambda functions
- [ ] 5.2 Create CloudWatch Dashboard — invocations, errors, duration widgets
- [ ] 5.3 Create alarm — error count > 5 in 5 minutes
- [ ] 5.4 Create alarm — average duration > 3 seconds

**Phase 5 Notes:**
> _(Add any issues, decisions, or learnings here as you go)_

---

## Phase 6: S3 Static Website Hosting

- [ ] 6.1 Create S3 bucket for hosting — `notestack-web-yourname`
- [ ] 6.2 Enable static website hosting — index document: `index.html`
- [ ] 6.3 Set bucket policy for public read access
- [ ] 6.4 Upload `index.html`, `style.css`, `app.js`
- [ ] 6.5 Test via S3 website endpoint URL

**Phase 6 Notes:**
> _(Add any issues, decisions, or learnings here as you go)_

---

## Phase 7: Integration Testing & Submission

- [ ] 7.1 Sign up → Verify email → Login
- [ ] 7.2 Create note (with and without file) → View notes
- [ ] 7.3 Create note with category → Filter by category
- [ ] 7.4 Search notes by title
- [ ] 7.5 Share a note with another user → Other user sees it
- [ ] 7.6 Edit a note → Delete a note
- [ ] 7.7 Logout → Login again (notes still there)
- [ ] 7.8 Wrong password (should fail) → No token (should get 401)
- [ ] 7.9 Trigger auto-delete → Verify old notes removed
- [ ] 7.10 Check CloudWatch logs and dashboard
- [ ] 7.11 Access frontend via S3 website URL

**Phase 7 Notes:**
> _(Add any issues, decisions, or learnings here as you go)_

---

## Issues & Blockers

| # | Date | Issue | Status | Resolution |
|---|---|---|---|---|
| — | — | — | — | — |

---

## Decisions Made

| # | Date | Decision | Reason |
|---|---|---|---|
| 1 | 2026-04-06 | Vanilla HTML/CSS/JS for frontend | Matches guide spec, keeps focus on AWS learning |
| 2 | 2026-04-06 | Layer-based project structure (not DDD) | Project is too small for DDD, single domain |
| 3 | 2026-04-06 | Pure CSS animations (no libraries) | Zero dependencies, hardware accelerated |
| 4 | 2026-04-06 | Bonus challenges included as core features | Search, categories, sharing, auto-delete, S3 hosting |

---

## Change Log

| Date | What Changed |
|---|---|
| 2026-04-06 | Project initialized — design spec created, update doc created |
| 2026-04-06 | All 7 Lambda functions written (shared/utils.mjs, CreateNote, GetNotes, UpdateNote, DeleteNote, GenerateUploadUrl, SearchNotes, AutoDeleteOldNotes) |
| 2026-04-06 | AWS setup script created (aws-setup/setup-commands.sh) |
| 2026-04-06 | Complete frontend built (index.html, style.css, app.js) with auth, CRUD, search, categories, sharing, modals, toasts, animations |
