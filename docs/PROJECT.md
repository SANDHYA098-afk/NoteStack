# NoteStack — Project Documentation

## Overview

NoteStack is a **serverless student notes & file sharing platform** built on AWS. Students can sign up, create and share notes with file attachments, search across community notes, and receive real-time notifications — all powered by a fully serverless architecture.

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
| **Star/Favourite** | Star important notes; starred list persists across pages |
| **In-App Notifications** | Bell icon with unread count; notified when someone creates or shares a note |
| **Dark/Light Theme** | Toggle in Settings; persists across sessions |
| **Profile** | Editable username, profile picture upload, stats (notes count, files, categories) |
| **Auto-Delete** | EventBridge-triggered daily cleanup of notes older than 30 days |

### UI Features
| Feature | Description |
|---|---|
| **Doodle Design** | Hand-drawn borders, floating SVG doodles, sketchy animations |
| **Dual-Color Branding** | "Note" in green + "Stack" in ink |
| **Responsive** | Mobile-first design, collapsible sidebar |
| **Sidebar Navigation** | Collapsible left nav: Community, My Notes, Profile, Settings, Notifications |
| **Toast Notifications** | Success/error/info popups with auto-dismiss |
| **Skeleton Loading** | Shimmer loading states while data fetches |
| **Password Toggle** | Show/hide password with eye icon |

---

## Pages

### 1. Auth Page (Login / Sign Up / Verify)
- Split layout: illustration left, form right
- Tab switching between Login and Sign Up
- Inline verification — after signup, code input appears in same view
- Auto-login after successful verification

### 2. Community Feed (Home)
- Hero section with dual-color "NoteStack" title and book illustration
- Search bar with 300ms debounce
- Category filter pills
- Single-column feed with author avatar, name, date
- Star button on each note
- Download button for notes with files

### 3. My Notes (Dashboard)
- Full CRUD: create, edit, delete notes
- File upload during note creation
- Star/favourite toggle
- Starred filter view (fetches from community to show all starred notes)
- Share notes via modal
- Shared notes displayed with "Shared with you" badge

### 4. Profile
- Large avatar (uploadable profile picture)
- Editable username
- Stats: notes count, files count, categories used, join date
- Grid of published notes

### 5. Settings
- Account info (email, auth provider)
- Dark/Light theme toggle
- Notification info
- Storage info (allowed file types, auto-delete policy)

---

## Backend Architecture

```
Frontend (Next.js on Vercel)
    │
    ├── Auth ──→ Amazon Cognito (direct fetch, no SDK)
    │              ├── SignUp
    │              ├── ConfirmSignUp
    │              └── InitiateAuth (USER_PASSWORD_AUTH)
    │
    └── API ──→ API Gateway (REST, Cognito Authorizer)
                   │
                   ├── POST   /notes          → CreateNote Lambda
                   ├── GET    /notes          → GetNotes Lambda
                   ├── PUT    /notes          → UpdateNote Lambda
                   ├── DELETE /notes          → DeleteNote Lambda
                   ├── GET    /notes/feed     → GetAllNotes Lambda
                   ├── GET    /notes/search   → SearchNotes Lambda
                   ├── POST   /notes/upload-url    → GenerateUploadUrl Lambda
                   ├── GET    /notes/download-url  → GenerateDownloadUrl Lambda
                   ├── POST   /notes/share    → ShareNote Lambda
                   ├── GET    /notifications  → GetNotifications Lambda
                   └── PUT    /notifications  → MarkNotificationRead Lambda
                                │
                                ├── DynamoDB
                                │    ├── NoteStack-Notes (PK: userId, SK: noteId, GSI: CategoryIndex)
                                │    ├── NoteStack-SharedNotes (PK: sharedWithUserId, SK: noteId)
                                │    └── NoteStack-Notifications (PK: userId, SK: notificationId)
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
| NoteStack-GetAllNotes | notes | GET /notes/feed | Scan all notes, enrich with author emails |
| NoteStack-SearchNotes | notes | GET /notes/search | Case-insensitive search on title |
| NoteStack-GenerateUploadUrl | files | POST /notes/upload-url | Validate file type, generate pre-signed PUT URL |
| NoteStack-GenerateDownloadUrl | files | GET /notes/download-url | Generate pre-signed GET URL |
| NoteStack-ShareNote | sharing | POST /notes/share | Lookup user by email, copy to SharedNotes, notify |
| NoteStack-GetNotifications | notifications | GET /notifications | Fetch latest 20 notifications |
| NoteStack-MarkNotificationRead | notifications | PUT /notifications | Mark single or all as read |
| NoteStack-AutoDeleteOldNotes | cleanup | EventBridge (daily) | Delete notes > 30 days old |

### Amazon API Gateway
- **API:** `NoteStack-API-Sandhiya` (REST, Regional)
- **Stage:** `dev`
- **Auth:** Cognito User Pool Authorizer on all endpoints
- **CORS:** Enabled on all resources + Gateway Response CORS headers

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
| Auth | Amazon Cognito (direct fetch, no SDK) |
| API | Amazon API Gateway (REST) |
| Backend | AWS Lambda (Node.js 18.x, ES Modules) |
| Database | Amazon DynamoDB (3 tables + 1 GSI) |
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
│   ├── notes/                        # CRUD + search
│   │   └── lambdas/ (5 functions)
│   ├── files/                        # S3 upload/download
│   │   └── lambdas/ (2 functions)
│   ├── sharing/                      # Note sharing
│   │   └── lambdas/ (1 function)
│   ├── notifications/                # In-app notifications
│   │   └── lambdas/ (2 functions)
│   └── cleanup/                      # Scheduled maintenance
│       └── lambdas/ (1 function)
├── shared/
│   └── utils.mjs                     # respond(), log(), getUserId()
├── infrastructure/
│   ├── setup-commands.sh
│   └── *.json (IAM, CORS, GSI configs)
├── frontend/
│   └── app/
│       ├── domains/
│       │   ├── auth/                 # Cognito auth + AuthForm
│       │   ├── notes/                # Dashboard, NoteCard, API
│       │   ├── feed/                 # Community feed page
│       │   ├── files/                # Upload/download API
│       │   ├── sharing/              # Share modal + API
│       │   ├── notifications/        # Bell + API
│       │   ├── profile/              # Profile page
│       │   └── settings/             # Settings page
│       ├── shared/
│       │   ├── config.ts, api-client.ts
│       │   ├── Sidebar, Toast, Modal, FloatingDoodles
│       │   ├── PasswordInput, ProfileSection
│       │   └── icons/Icons.tsx (25+ SVG icons)
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
└── docs/
    ├── PROJECT.md
    ├── UPDATE.md
    └── DEPLOYMENT.md
```

---

## Workflow

### User Registration Flow
```
User enters email + password → Cognito SignUp → Email sent with code
→ User enters code → Cognito ConfirmSignUp → Auto-login via InitiateAuth
→ ID Token stored in localStorage → Redirected to dashboard
```

### Note Creation Flow
```
User fills form (title, content, category, optional file)
→ If file: POST /notes/upload-url → Pre-signed S3 PUT URL
→ Upload file directly to S3 → Get fileKey
→ POST /notes (with fileKey) → Lambda validates, generates noteId
→ Saves to DynamoDB → Notifies all other users
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
→ Returns matching notes with author emails
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
