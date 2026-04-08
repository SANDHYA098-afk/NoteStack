# NoteStack — Project Documentation

## Overview

NoteStack is a **serverless student notes & file sharing platform** built on AWS. Students can sign up, create and share notes with file attachments, search across community notes, star favourites, and receive real-time notifications — all powered by a fully serverless architecture.

**Live URL:** [notestack-tawny.vercel.app](https://notestack-tawny.vercel.app)
**Repository:** [github.com/SANDHYA098-afk/NoteStack](https://github.com/SANDHYA098-afk/NoteStack)

---

## Features

### Core Features
| Feature | Description |
|---|---|
| **User Authentication** | Sign up, email verification, login/logout via Amazon Cognito |
| **Create Notes** | Title, content, category selection, optional file attachment |
| **Edit & Delete Notes** | Modify or remove your own notes |
| **File Upload/Download** | Upload PDFs, PNGs, JPGs via S3 pre-signed URLs; download with one click |
| **Search** | Case-insensitive keyword search across title, content, and category |
| **Categories** | Filter notes by: General, Lecture, Assignment, Exam, Project, Personal |
| **Community Feed** | Browse all notes from all users with author profiles |
| **Share Notes** | Share notes with other users by email |
| **Star/Favourite** | Star important notes; stored in DynamoDB, syncs across all devices |
| **In-App Notifications** | Bell icon with unread count; notified when someone creates or shares a note |
| **Dark/Light Theme** | Toggle in Settings; persists across sessions |
| **Profile** | Editable username, colored avatar, stats (notes count, files, categories) |
| **Auto-Delete** | EventBridge-triggered daily cleanup of notes older than 30 days |

### UI Features
| Feature | Description |
|---|---|
| **Doodle Design** | Hand-drawn borders, floating SVG doodles, sketchy animations |
| **Botanical Theme** | Green/lime color palette inspired by the watercolor book logo |
| **Dual-Color Branding** | "Note" in green + "Stack" in ink |
| **Responsive** | Mobile-first design, collapsible sidebar |
| **Sidebar Navigation** | Collapsible left nav: Community, My Notes, Profile, Settings, Notifications |
| **Toast Notifications** | Success/error/info popups with auto-dismiss |
| **Skeleton Loading** | Shimmer loading states while data fetches |
| **Password Toggle** | Show/hide password with eye icon |
| **Floating Doodles** | Animated SVG stars, circles, hearts, spirals across all pages |

---

## Pages

### 1. Auth Page (Login / Sign Up / Verify)
- Split layout: illustration left, form right (stacks vertically on mobile)
- Tab switching between Login and Sign Up
- Inline verification — after signup, code input appears in same view
- Auto-login after successful verification
- Floating doodle decorations visible on all screen sizes
- Light mode: `book2.png` illustration; Dark mode: `bookimg.png`

### 2. Community Feed (Home)
- Hero section with dual-color "NoteStack" title and book illustration
- Search bar with 300ms debounce (case-insensitive across title, content, category)
- Category filter pills
- Single-column feed with author avatar, name, date
- Star button on each note (persists to DynamoDB)
- Download button for notes with files

### 3. My Notes (Dashboard)
- Full CRUD: create, edit, delete notes
- File upload during note creation
- Star/favourite toggle (synced via DynamoDB)
- Starred filter view (fetches from community to show all starred notes)
- Share notes via modal
- Shared notes displayed with "Shared with you" badge
- Action buttons (edit, delete, share) appear on hover / always visible on mobile

### 4. Profile
- Large colored avatar with user initial
- Editable username (saved to localStorage)
- Stats: notes count, files count, categories used, join date
- Grid of published notes

### 5. Settings
- Account info (email, auth provider)
- Dark/Light theme toggle with doodle-style switch
- Notification info
- Storage info (allowed file types, auto-delete policy)

---

## Backend Architecture

```
Frontend (Next.js 16 on Vercel)
    │
    ├── Auth ──→ Amazon Cognito (direct fetch, no SDK)
    │              ├── SignUp
    │              ├── ConfirmSignUp
    │              └── InitiateAuth (USER_PASSWORD_AUTH)
    │
    └── API ──→ API Gateway (REST, Cognito Authorizer)
                   │
                   ├── POST   /notes              → CreateNote Lambda
                   ├── GET    /notes              → GetNotes Lambda
                   ├── PUT    /notes              → UpdateNote Lambda
                   ├── DELETE /notes              → DeleteNote Lambda
                   ├── GET    /notes/feed         → GetAllNotes Lambda
                   ├── GET    /notes/search       → SearchNotes Lambda
                   ├── POST   /notes/upload-url   → GenerateUploadUrl Lambda
                   ├── GET    /notes/download-url → GenerateDownloadUrl Lambda
                   ├── POST   /notes/share        → ShareNote Lambda
                   ├── POST   /notes/star         → ToggleStar Lambda
                   ├── GET    /notes/star         → GetStarredNotes Lambda
                   ├── GET    /notifications      → GetNotifications Lambda
                   └── PUT    /notifications      → MarkNotificationRead Lambda
                                │
                                ├── DynamoDB
                                │    ├── NoteStack-Notes (PK: userId, SK: noteId, GSI: CategoryIndex)
                                │    ├── NoteStack-SharedNotes (PK: sharedWithUserId, SK: noteId)
                                │    ├── NoteStack-Notifications (PK: userId, SK: notificationId)
                                │    └── NoteStack-StarredNotes (PK: userId, SK: noteId)
                                │
                                ├── S3 Bucket (notestack-files-sandhiya)
                                │    └── users/{userId}/{timestamp}_{filename}
                                │
                                ├── Secrets Manager (notestack/config)
                                │    └── ALLOWED_FILE_TYPES, BUCKET_NAME
                                │
                                └── Cognito (ListUsers for email lookup)

EventBridge (daily) ──→ AutoDeleteOldNotes Lambda ──→ DynamoDB + S3 cleanup
```

---

## AWS Services Used

### Amazon Cognito
- **User Pool:** `NoteStack-Users` (ap-south-1_EM3m76UWV)
- **App Client:** `NoteStack-WebApp` (29vol0pqf64s7o0he3lobd62ns)
- **Auth flows:** USER_PASSWORD_AUTH, REFRESH_TOKEN
- **Username:** email-based, auto-verified
- **Frontend auth:** Direct `fetch()` to Cognito endpoint (no AWS SDK)

### Amazon DynamoDB

**Table: NoteStack-Notes**
| Key | Type | Description |
|---|---|---|
| userId (PK) | String | Cognito user sub ID |
| noteId (SK) | String | `note_{timestamp}_{random}` |
| title | String | Note title |
| content | String | Note content |
| category | String | general, lecture, assignment, exam, project, personal |
| fileKey | String | S3 object key (nullable) |
| createdAt | String | ISO timestamp |
| updatedAt | String | ISO timestamp |

**GSI: CategoryIndex** — PK: userId, SK: category — enables filtering notes by category.

**Table: NoteStack-SharedNotes**
| Key | Type | Description |
|---|---|---|
| sharedWithUserId (PK) | String | Target user's Cognito sub ID |
| noteId (SK) | String | Original note ID |
| + copied fields | | title, content, category, fileKey, sharedByUserId, sharedAt |

**Table: NoteStack-Notifications**
| Key | Type | Description |
|---|---|---|
| userId (PK) | String | Target user ID |
| notificationId (SK) | String | `notif_{timestamp}_{random}` |
| type | String | `new_note` or `shared_note` |
| message | String | Human-readable notification text |
| read | Boolean | Read status |

**Table: NoteStack-StarredNotes**
| Key | Type | Description |
|---|---|---|
| userId (PK) | String | User who starred the note |
| noteId (SK) | String | Starred note ID |
| starredAt | String | ISO timestamp |

### Amazon S3
- **Bucket:** `notestack-files-sandhiya`
- **Structure:** `users/{userId}/{timestamp}_{filename}`
- **CORS:** Enabled for all origins
- **Access:** Via pre-signed URLs (PUT for upload, GET for download, 5-min expiry)

### AWS Lambda (Node.js 18.x)

| Function | Domain | Trigger | Description |
|---|---|---|---|
| NoteStack-CreateNote | notes | POST /notes | Create note + notify all users |
| NoteStack-GetNotes | notes | GET /notes | Get user's notes + optional shared |
| NoteStack-UpdateNote | notes | PUT /notes | Update note fields |
| NoteStack-DeleteNote | notes | DELETE /notes | Delete from DB + S3 + SharedNotes |
| NoteStack-GetAllNotes | notes | GET /notes/feed | Scan all notes, enrich with author emails, case-insensitive search |
| NoteStack-SearchNotes | notes | GET /notes/search | Case-insensitive search on title |
| NoteStack-ToggleStar | notes | POST /notes/star | Star/unstar a note (DynamoDB toggle) |
| NoteStack-GetStarredNotes | notes | GET /notes/star | Get list of starred note IDs |
| NoteStack-GenerateUploadUrl | files | POST /notes/upload-url | Validate file type, generate pre-signed PUT URL |
| NoteStack-GenerateDownloadUrl | files | GET /notes/download-url | Generate pre-signed GET URL |
| NoteStack-ShareNote | sharing | POST /notes/share | Lookup user by email, copy to SharedNotes, notify |
| NoteStack-GetNotifications | notifications | GET /notifications | Fetch latest 20 notifications |
| NoteStack-MarkNotificationRead | notifications | PUT /notifications | Mark single or all as read |
| NoteStack-AutoDeleteOldNotes | cleanup | EventBridge (daily) | Delete notes > 30 days old |

### Amazon API Gateway
- **API:** `NoteStack-API-Sandhiya` (REST, Regional)
- **Stage:** `dev`
- **URL:** `https://019vhyfrah.execute-api.ap-south-1.amazonaws.com/dev`
- **Auth:** Cognito User Pool Authorizer on all endpoints
- **CORS:** Enabled on all resources + Gateway Response CORS headers (DEFAULT_4XX, DEFAULT_5XX)

### AWS Secrets Manager
- **Secret:** `notestack/config`
- **Contents:** `{"ALLOWED_FILE_TYPES":["pdf","png","jpg","jpeg"],"BUCKET_NAME":"notestack-files-sandhiya"}`

### Amazon EventBridge
- **Rule:** `NoteStack-AutoDelete`
- **Schedule:** `rate(1 day)`
- **Target:** NoteStack-AutoDeleteOldNotes Lambda

### Amazon CloudWatch
- Automatic logging from all Lambda functions
- Structured JSON logs with level, message, timestamp, and context data

### IAM
- **Role:** `NoteStack-Lambda-Role`
- **Policies:** DynamoDB Full Access, S3 Full Access, CloudWatch Full Access, Secrets Manager Read/Write, Cognito Read Only

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.2, React 19, TypeScript, Tailwind CSS v4 |
| Fonts | Caveat (handwritten display), Patrick Hand (body) |
| Design | Doodle/botanical theme, 25+ custom SVG icons, floating animations |
| Auth | Amazon Cognito (direct fetch, no SDK) |
| API | Amazon API Gateway (REST) |
| Backend | AWS Lambda (Node.js 18.x, ES Modules) — 14 functions |
| Database | Amazon DynamoDB (4 tables + 1 GSI) |
| File Storage | Amazon S3 (pre-signed URLs) |
| Secrets | AWS Secrets Manager |
| Scheduling | Amazon EventBridge |
| Monitoring | Amazon CloudWatch |
| Hosting | Vercel (frontend), AWS (backend) |
| Region | ap-south-1 (Mumbai) |

---

## Project Structure (DDD)

```
NoteStack/
├── domains/                          # Backend domains
│   ├── notes/                        # CRUD + search + star
│   │   └── lambdas/
│   │       ├── CreateNote/
│   │       ├── GetNotes/
│   │       ├── UpdateNote/
│   │       ├── DeleteNote/
│   │       ├── GetAllNotes/
│   │       ├── SearchNotes/
│   │       ├── ToggleStar/
│   │       └── GetStarredNotes/
│   ├── files/                        # S3 upload/download
│   │   └── lambdas/
│   │       ├── GenerateUploadUrl/
│   │       └── GenerateDownloadUrl/
│   ├── sharing/                      # Note sharing
│   │   └── lambdas/
│   │       └── ShareNote/
│   ├── notifications/                # In-app notifications
│   │   └── lambdas/
│   │       ├── GetNotifications/
│   │       └── MarkNotificationRead/
│   └── cleanup/                      # Scheduled maintenance
│       └── lambdas/
│           └── AutoDeleteOldNotes/
├── shared/
│   └── utils.mjs                     # respond(), log(), getUserId(), parseBody()
├── infrastructure/
│   ├── setup-commands.sh
│   └── *.json (IAM, CORS, GSI configs)
├── frontend/
│   └── app/
│       ├── domains/
│       │   ├── auth/                 # Cognito auth + AuthForm
│       │   ├── notes/                # Dashboard, NoteCard, API (CRUD + star)
│       │   ├── feed/                 # Community feed page
│       │   ├── files/                # Upload/download API
│       │   ├── sharing/              # Share modal + API
│       │   ├── notifications/        # Bell + API
│       │   ├── profile/              # Profile page
│       │   └── settings/             # Settings page
│       ├── shared/
│       │   ├── config.ts             # API URL, Cognito config
│       │   ├── api-client.ts         # Base fetch helper with auth
│       │   ├── Sidebar.tsx           # Collapsible navigation
│       │   ├── Toast.tsx             # Toast notifications
│       │   ├── Modal.tsx             # Reusable modal
│       │   ├── FloatingDoodles.tsx   # Animated SVG decorations
│       │   ├── PasswordInput.tsx     # Password with show/hide
│       │   └── icons/Icons.tsx       # 25+ custom SVG icons
│       ├── globals.css               # Theme, animations, doodle styles
│       ├── layout.tsx                # Root layout + fonts
│       └── page.tsx                  # Entry point + routing
└── docs/
    ├── PROJECT.md                    # This file
    ├── UPDATE.md                     # Progress tracker
    └── DEPLOYMENT.md                 # Deployment guide
```

---

## How Frontend Connects to Backend

### 1. Authentication (Frontend → Cognito directly)
```
Browser  ──fetch()──→  cognito-idp.ap-south-1.amazonaws.com
                       ├── SignUp (email + password)
                       ├── ConfirmSignUp (email + code)
                       └── InitiateAuth → returns JWT tokens
                                          └── IdToken stored in localStorage
```

### 2. API Calls (Frontend → API Gateway → Lambda → DynamoDB/S3)
```
Browser  ──fetch()──→  API Gateway  ──validates JWT──→  Lambda  ──→  DynamoDB/S3
         (Authorization:                (Cognito
          IdToken)                       Authorizer)
```

### 3. File Uploads (Frontend → Lambda → S3 directly)
```
Browser  ──POST /notes/upload-url──→  Lambda (returns pre-signed URL)
Browser  ──PUT file directly──→  S3 (using pre-signed URL, no auth needed)
```

---

## Workflow

### User Registration Flow
```
User enters email + password → Cognito SignUp → Email sent with code
→ User enters code → Cognito ConfirmSignUp → Auto-login via InitiateAuth
→ ID Token stored in localStorage → Redirected to Community Feed
```

### Note Creation Flow
```
User fills form (title, content, category, optional file)
→ If file: POST /notes/upload-url → Pre-signed S3 PUT URL
→ Upload file directly to S3 → Get fileKey
→ POST /notes (with fileKey) → Lambda validates, generates noteId
→ Saves to DynamoDB → Notifies all other users via Notifications table
→ Frontend refreshes note list
```

### File Download Flow
```
User clicks Download → GET /notes/download-url?fileKey=...
→ Lambda generates pre-signed GET URL (5-min expiry)
→ Browser opens URL in new tab → File downloads
```

### Search Flow
```
User types in search bar → 300ms debounce
→ GET /notes/feed?q=keyword → Lambda scans DynamoDB
→ In-memory case-insensitive filter on title + content + category
→ Returns matching notes enriched with author emails from Cognito
```

### Star/Favourite Flow
```
User clicks star icon → Optimistic UI update (instant)
→ POST /notes/star { noteId } → Lambda checks NoteStack-StarredNotes
→ If exists: DELETE (unstar) → returns { starred: false }
→ If not: PUT (star) → returns { starred: true }
→ On page load: GET /notes/star → returns all starred noteIds
→ Syncs across all devices via DynamoDB
```

### Sharing Flow
```
User clicks Share → Enters target email
→ POST /notes/share → Lambda looks up email in Cognito (ListUsers)
→ Copies note to NoteStack-SharedNotes table
→ Creates notification for target user
→ Target user sees "Shared with you" badge on the note
```

### Notification Flow
```
Note created → CreateNote Lambda writes to NoteStack-Notifications for all other users
Note shared → ShareNote Lambda writes notification for target user
Frontend polls GET /notifications every 30 seconds
Bell icon shows unread count → Click to open dropdown
Mark individual or all as read via PUT /notifications
```

### Auto-Delete Flow
```
EventBridge triggers daily at rate(1 day)
→ AutoDeleteOldNotes Lambda scans NoteStack-Notes
→ Finds notes with createdAt > 30 days ago
→ Deletes from DynamoDB + S3 file + SharedNotes entries
→ Logs results to CloudWatch
```

---

## Testing



**Result:** 51 tests, 15 suites, 0 failures

### Test Framework
- **Node.js built-in test runner** (`node:test` + `node:assert`) — zero dependencies, no npm install needed
- **Mock DynamoDB** (`tests/backend/mock-aws.mjs`) — simulates all DynamoDB commands in-memory
- **TDD-style** — tests cover both happy paths and edge cases (missing fields, empty data, wrong user, invalid input)

### Test Files

| File | Tests | What It Covers |
|---|---|---|
| `test-utils.mjs` | 17 | `respond()` — status codes, JSON body, CORS headers; `getUserId()` — Cognito claims extraction, missing/null events; `parseBody()` — valid JSON, null body, invalid JSON; `getQueryParam()` — present/missing params, null queryStringParameters; `log()` — no-throw guarantee |
| `test-toggle-star.mjs` | 4 | Star a new note, unstar an existing note, get all starred IDs for a user, user isolation (one user's stars don't affect another's) |
| `test-notes-crud.mjs` | 11 | **Create:** required fields validation (title, content), default category, unique noteId generation; **Read:** filter by userId, empty results; **Delete:** return old values, handle non-existent; **Search:** case-insensitive on title/content, no matches |
| `test-notifications.mjs` | 4 | Create new_note notification, skip self-notification, unread count calculation, shared_note notification type |
| `test-sharing.mjs` | 4 | Copy note to SharedNotes table, create notification for target user, reject non-existent note, require both noteId and email |
| `test-file-validation.mjs` | 10 | Allow pdf/png/jpg/jpeg, reject exe/js, case-insensitive extensions, S3 key format (`users/{userId}/{timestamp}_{filename}`), require fileName parameter |

### Mock Infrastructure

**`tests/backend/mock-aws.mjs`** provides:

| Class/Function | Purpose |
|---|---|
| `MockDynamoDB` | In-memory DynamoDB simulator — supports `PutCommand`, `GetCommand`, `QueryCommand`, `ScanCommand`, `DeleteCommand`, `UpdateCommand` |
| `MockDynamoDB.seedTable()` | Pre-populate tables with test data |
| `MockDynamoDB.getCallCount()` | Assert how many times a command was called |
| `MockDynamoDB.getLastCall()` | Inspect the last call's input parameters |
| `createMockEvent()` | Build Lambda event objects with userId, body, queryParams, email |
| `parseResponse()` | Parse Lambda response (statusCode + JSON body) |

### Test Coverage by Domain

```
domains/
├── notes/          ✅ CRUD (11 tests) + Star (4 tests) + Search (3 tests)
├── files/          ✅ File validation (10 tests)
├── sharing/        ✅ Share flow (4 tests)
├── notifications/  ✅ Notification flow (4 tests)
├── cleanup/        ⬜ (uses same DynamoDB logic, covered by CRUD tests)
└── shared/         ✅ Utilities (17 tests)
```

### What Tests Verify

| Category | Examples |
|---|---|
| **Input Validation** | Missing title/content rejected, missing noteId rejected, missing fileName rejected |
| **Auth** | userId extracted from Cognito JWT claims, undefined for missing claims |
| **Data Integrity** | Notes created with correct fields, deleted notes return old values, shared notes copy all fields |
| **User Isolation** | User A's stars don't appear in User B's list, notifications skip the author |
| **Search** | Case-insensitive matching, search across title + content, empty results for no matches |
| **File Security** | Only pdf/png/jpg/jpeg allowed, exe/js rejected, case-insensitive extension check |
| **Response Format** | CORS headers present, JSON body stringified, correct status codes (200, 401, 500) |
