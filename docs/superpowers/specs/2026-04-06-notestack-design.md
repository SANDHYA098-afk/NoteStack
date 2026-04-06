# NoteStack — Project Design & Implementation Plan

## Project Overview

NoteStack is a **serverless student notes & file sharing platform** built entirely on AWS. Students can sign up, log in, create/edit/delete notes, attach files (PDFs, images), and everything runs on AWS with zero servers to manage.

### Core Features

- **Authentication** — Sign up, email verification, login/logout (via Cognito)
- **CRUD Notes** — Create, Read, Update, Delete notes (via Lambda + DynamoDB)
- **File Uploads** — PDFs and images via pre-signed S3 URLs
- **Search** — Search notes by title with real-time filtering
- **Categories** — Tag and filter notes by category using DynamoDB GSI
- **Shared Notes** — Share notes with other users
- **Auto-Delete** — Scheduled cleanup of notes older than 30 days
- **Monitoring** — Structured logs, alarms, dashboards (via CloudWatch)
- **Static Hosting** — Frontend deployed to S3 as a static website

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML + CSS + JS |
| Auth | Amazon Cognito |
| API | API Gateway (REST) |
| Backend | AWS Lambda (Node.js 18.x) |
| Database | Amazon DynamoDB |
| File Storage | Amazon S3 |
| Secrets | AWS Secrets Manager |
| Monitoring | Amazon CloudWatch |
| Region | `ap-south-1` (Mumbai) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│          index.html + style.css + app.js                 │
│          (hosted on S3 or opened locally)                │
└────────────┬──────────────────────┬─────────────────────┘
             │ Auth (fetch)         │ API calls (fetch)
             ▼                      ▼
      ┌──────────────┐     ┌─────────────────┐
      │   Cognito     │     │  API Gateway     │
      │  User Pool    │     │  (REST API)      │
      │               │     │  + Cognito       │
      │  - Sign up    │     │    Authorizer    │
      │  - Verify     │     └────────┬─────────┘
      │  - Login      │              │
      └──────────────┘              ▼
                            ┌─────────────────┐
                            │  Lambda (x7)     │
                            │                  │
                            │  - CreateNote    │
                            │  - GetNotes      │
                            │  - UpdateNote    │
                            │  - DeleteNote    │
                            │  - GenerateURL   │
                            │  - SearchNotes   │
                            │  - AutoDelete    │
                            └───┬─────────┬────┘
                                │         │
                    ┌───────────┘         └──────────┐
                    ▼                                 ▼
             ┌──────────────┐                 ┌──────────────┐
             │  DynamoDB     │                 │  S3 Bucket    │
             │  NoteStack-   │                 │  notestack-   │
             │  Notes        │                 │  files-*      │
             │               │                 │               │
             │  userId (PK)  │                 │  users/       │
             │  noteId (SK)  │                 │  └─ files     │
             └──────────────┘                 └──────────────┘
                    ▲
                    │
             ┌──────────────┐    ┌──────────────┐
             │  Secrets      │    │  CloudWatch   │
             │  Manager      │    │  - Logs       │
             │  notestack/   │    │  - Dashboard  │
             │  config       │    │  - Alarms     │
             └──────────────┘    └──────────────┘
```

### User Flow

1. Student opens the app → sees login/signup form
2. Signs up → enters email + password → Cognito sends verification email
3. Verifies email → enters code → account confirmed
4. Logs in → Cognito returns an ID token (JWT) → stored in localStorage
5. Creates a note → frontend sends title + content + optional file to API Gateway
   - API Gateway validates the token via Cognito Authorizer
   - Lambda stores note in DynamoDB, file goes to S3 via pre-signed URL
6. Views notes → GetNotes Lambda queries DynamoDB by userId
7. Edits/Deletes → UpdateNote/DeleteNote Lambdas modify DynamoDB (+ S3 cleanup)
8. All activity → logged to CloudWatch automatically

---

## AWS Resources Summary

| Resource | Name | Details |
|---|---|---|
| IAM Role | `NoteStack-Lambda-Role` | DynamoDB + S3 + CloudWatch + Secrets Manager + EventBridge permissions |
| S3 Bucket | `notestack-files-yourname` | CORS enabled, `users/` folder structure, static website hosting |
| DynamoDB Table | `NoteStack-Notes` | Partition key: `userId` (String), Sort key: `noteId` (String), GSI on `category` |
| DynamoDB Table | `NoteStack-SharedNotes` | Partition key: `sharedWithUserId`, Sort key: `noteId` |
| Cognito User Pool | `NoteStack-Users` | Email as username, auto-verify email |
| Cognito App Client | `NoteStack-WebApp` | USER_PASSWORD_AUTH + REFRESH_TOKEN flows |
| Secrets Manager | `notestack/config` | `ALLOWED_FILE_TYPES`, `BUCKET_NAME` |
| Lambda Functions | 7 functions | `CreateNote`, `GetNotes`, `UpdateNote`, `DeleteNote`, `GenerateUploadUrl`, `SearchNotes`, `AutoDeleteOldNotes` |
| API Gateway | `NoteStack-API` | REST API with Cognito Authorizer, CORS, `dev` stage |
| EventBridge Rule | `NoteStack-AutoDelete` | Scheduled rule (daily) triggers AutoDeleteOldNotes Lambda |
| CloudWatch | Dashboard + Alarms | Invocations, errors, duration metrics |

---

## Project Folder Structure

```
NoteStack/
├── lambda/
│   ├── shared/
│   │   └── utils.mjs              # respond() + log() helpers
│   ├── CreateNote/
│   │   └── index.mjs
│   ├── GetNotes/
│   │   └── index.mjs
│   ├── UpdateNote/
│   │   └── index.mjs
│   ├── DeleteNote/
│   │   └── index.mjs
│   ├── GenerateUploadUrl/
│   │   └── index.mjs
│   ├── SearchNotes/
│   │   └── index.mjs
│   └── AutoDeleteOldNotes/
│       └── index.mjs
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── aws-setup/
│   └── setup-commands.sh          # All AWS CLI commands in one script
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-06-notestack-design.md
```

---

## Phased Implementation Plan

---

### Phase 1: Project Setup & AWS Infrastructure

**Goal:** Set up the project structure and all AWS resources.

| Step | Task | Method |
|---|---|---|
| 1.1 | Initialize project | Git repo, folder structure |
| 1.2 | Install & configure AWS CLI | `aws configure` with Access Key + `ap-south-1` |
| 1.3 | Create IAM Role | `NoteStack-Lambda-Role` with managed policies for DynamoDB, S3, CloudWatch, Secrets Manager |
| 1.4 | Create S3 Bucket | `notestack-files-yourname` with CORS configuration + static website hosting |
| 1.5 | Create DynamoDB Table | `NoteStack-Notes` with `userId` (HASH) + `noteId` (RANGE), GSI `CategoryIndex` on `category`, PAY_PER_REQUEST billing |
| 1.6 | Create DynamoDB Table | `NoteStack-SharedNotes` with `sharedWithUserId` (HASH) + `noteId` (RANGE), PAY_PER_REQUEST billing |
| 1.7 | Create Cognito User Pool | `NoteStack-Users` pool + `NoteStack-WebApp` app client |
| 1.8 | Create Secret | `notestack/config` with allowed file types and bucket name |
| 1.9 | Create EventBridge Rule | `NoteStack-AutoDelete` — daily schedule to trigger AutoDeleteOldNotes Lambda |

**Outcome:** All AWS resources exist and are ready to use.

#### AWS CLI Commands

```bash
# 1.3 — IAM Role
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws iam create-role \
  --role-name NoteStack-Lambda-Role \
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy --role-name NoteStack-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
aws iam attach-role-policy --role-name NoteStack-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name NoteStack-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchFullAccess
aws iam attach-role-policy --role-name NoteStack-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

# 1.4 — S3 Bucket
aws s3 mb s3://notestack-files-YOURNAME --region ap-south-1

cat > cors.json << 'EOF'
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }]
}
EOF

aws s3api put-bucket-cors \
  --bucket notestack-files-YOURNAME \
  --cors-configuration file://cors.json

# 1.5 — DynamoDB Table (Notes) with GSI for categories
aws dynamodb create-table \
  --table-name NoteStack-Notes \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=noteId,AttributeType=S \
    AttributeName=category,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=noteId,KeyType=RANGE \
  --global-secondary-indexes \
    '[{"IndexName":"CategoryIndex","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"category","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1

# 1.6 — DynamoDB Table (Shared Notes)
aws dynamodb create-table \
  --table-name NoteStack-SharedNotes \
  --attribute-definitions \
    AttributeName=sharedWithUserId,AttributeType=S \
    AttributeName=noteId,AttributeType=S \
  --key-schema \
    AttributeName=sharedWithUserId,KeyType=HASH \
    AttributeName=noteId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1

# 1.7 — Cognito User Pool
aws cognito-idp create-user-pool \
  --pool-name NoteStack-Users \
  --auto-verified-attributes email \
  --username-attributes email \
  --region ap-south-1
# Note the UserPool Id from output, then:

aws cognito-idp create-user-pool-client \
  --user-pool-id <POOL_ID> \
  --client-name NoteStack-WebApp \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region ap-south-1

# 1.8 — Secrets Manager
aws secretsmanager create-secret \
  --name notestack/config \
  --secret-string '{"ALLOWED_FILE_TYPES":["pdf","png","jpg","jpeg"],"BUCKET_NAME":"notestack-files-YOURNAME"}' \
  --region ap-south-1

# 1.9 — EventBridge Rule (daily auto-delete, configure after Lambda is deployed)
aws events put-rule \
  --name NoteStack-AutoDelete \
  --schedule-expression "rate(1 day)" \
  --region ap-south-1
```

---

### Phase 2: Lambda Functions (Backend Logic)

**Goal:** Write and deploy all 7 Lambda functions.

| Step | Function | What It Does |
|---|---|---|
| 2.1 | **Shared helpers** | `respond(statusCode, body)` — consistent response format; `log(level, message, data)` — structured logging |
| 2.2 | **CreateNote** | Validates input → generates unique noteId → saves to DynamoDB with optional `category` field → validates file types via Secrets Manager |
| 2.3 | **GetNotes** | Queries DynamoDB by userId → returns all user's notes; supports optional `category` filter via GSI `CategoryIndex` |
| 2.4 | **UpdateNote** | Updates title/content/category of existing note in DynamoDB |
| 2.5 | **DeleteNote** | Deletes note from DynamoDB + deletes attached file from S3 (using ReturnValues "ALL_OLD") + removes from SharedNotes table |
| 2.6 | **GenerateUploadUrl** | Validates file extension against Secrets Manager ALLOWED_FILE_TYPES → generates pre-signed S3 PUT URL |
| 2.7 | **SearchNotes** | Scans DynamoDB with FilterExpression on `title` (contains keyword) → returns matching notes for the user |
| 2.8 | **AutoDeleteOldNotes** | Triggered daily by EventBridge → scans all notes → deletes notes with `createdAt` older than 30 days + cleans up S3 files |
| 2.9 | **Deploy & test** | Zip each function → create Lambda → test with sample events → attach EventBridge target for AutoDelete |

#### Key Patterns for All Functions

```javascript
// Extract userId from Cognito token (automatic via API Gateway Authorizer)
const userId = event.requestContext?.authorizer?.claims?.sub;

// Consistent response helper
function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

// Structured logging
function log(level, message, data) {
  console.log(JSON.stringify({ level, message, ...data, timestamp: new Date().toISOString() }));
}
```

#### Deploy Commands

```bash
# Example: deploy CreateNote
cd lambda/CreateNote
zip -r CreateNote.zip index.mjs
aws lambda create-function \
  --function-name NoteStack-CreateNote \
  --runtime nodejs18.x \
  --role arn:aws:iam::<ACCOUNT_ID>:role/NoteStack-Lambda-Role \
  --handler index.handler \
  --zip-file fileb://CreateNote.zip \
  --region ap-south-1

# To update after code changes:
aws lambda update-function-code \
  --function-name NoteStack-CreateNote \
  --zip-file fileb://CreateNote.zip \
  --region ap-south-1
```

**Outcome:** 5 working Lambda functions, each tested individually.

---

### Phase 3: API Gateway (Connect Frontend to Backend)

**Goal:** Build the REST API that routes requests to Lambda functions.

| Step | Task |
|---|---|
| 3.1 | Create REST API `NoteStack-API` in AWS Console |
| 3.2 | Create Cognito Authorizer (link to `NoteStack-Users` pool) |
| 3.3 | Create resource `/notes` with methods: `POST`, `GET`, `PUT`, `DELETE` |
| 3.4 | Create resource `/notes/upload-url` with method: `POST` |
| 3.5 | Create resource `/notes/search` with method: `GET` |
| 3.6 | Create resource `/notes/share` with method: `POST` |
| 3.7 | Link each method to corresponding Lambda function |
| 3.8 | Attach Cognito Authorizer to all methods |
| 3.9 | Enable CORS on all resources |
| 3.10 | Deploy to `dev` stage |
| 3.11 | Test endpoints with curl or Postman |

#### API Routes

| Method | Path | Lambda | Description |
|---|---|---|---|
| `POST` | `/notes` | NoteStack-CreateNote | Create a new note (with optional category) |
| `GET` | `/notes` | NoteStack-GetNotes | Get all notes (optionally filter by `?category=`) |
| `PUT` | `/notes` | NoteStack-UpdateNote | Update a note |
| `DELETE` | `/notes` | NoteStack-DeleteNote | Delete a note |
| `POST` | `/notes/upload-url` | NoteStack-GenerateUploadUrl | Get pre-signed upload URL |
| `GET` | `/notes/search` | NoteStack-SearchNotes | Search notes by title (`?q=keyword`) |
| `POST` | `/notes/share` | NoteStack-ShareNote | Share a note with another user |

**Outcome:** A working API URL (`https://xxxxxx.execute-api.ap-south-1.amazonaws.com/dev`) that accepts authenticated requests.

---

### Phase 4: Frontend (User Interface)

**Goal:** Build the complete vanilla HTML/CSS/JS frontend.

| Step | File | What |
|---|---|---|
| 4.1 | `index.html` | Page structure — header, auth section, notes section, search bar, category filter, share modal |
| 4.2 | `style.css` | Modern, polished styling (see Frontend Design section below) |
| 4.3 | `app.js` | Config object with `API_URL` and `COGNITO_CLIENT_ID` |
| 4.4 | `app.js` | Auth functions — `signUp()`, `verify()`, `login()`, `logout()` via direct fetch to Cognito |
| 4.5 | `app.js` | API helper — `apiCall(method, path, body)` with Authorization header |
| 4.6 | `app.js` | CRUD — `createNote()`, `loadNotes()`, `editNote()`, `deleteNote()` |
| 4.7 | `app.js` | File upload — get pre-signed URL → upload to S3 → attach to note |
| 4.8 | `app.js` | Search — real-time search bar that calls `/notes/search?q=keyword` |
| 4.9 | `app.js` | Categories — dropdown filter + category tag on create/edit form |
| 4.10 | `app.js` | Share — share modal to enter email, calls `/notes/share` |
| 4.11 | `app.js` | XSS prevention — escape HTML in all user-generated content |

#### Frontend Config & Auth Pattern

```javascript
// Config
const CONFIG = {
  API_URL: "https://xxxxxx.execute-api.ap-south-1.amazonaws.com/dev",
  COGNITO_CLIENT_ID: "your-client-id"
};

// Tokens stored in localStorage
localStorage.setItem("idToken", token);

// Auth via direct Cognito fetch
fetch(`https://cognito-idp.ap-south-1.amazonaws.com/`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-amz-json-1.1",
    "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp"
  },
  body: JSON.stringify({ ClientId: CONFIG.COGNITO_CLIENT_ID, Username: email, Password: password })
});

// API calls with auth
function apiCall(method, path, body) {
  return fetch(CONFIG.API_URL + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": localStorage.getItem("idToken")
    },
    body: body ? JSON.stringify(body) : undefined
  });
}
```

**Outcome:** Fully functional frontend that handles auth and talks to the API.

---

### Phase 5: CloudWatch Monitoring

**Goal:** Set up observability for the application.

| Step | Task |
|---|---|
| 5.1 | Verify structured `log()` calls exist in all Lambda functions |
| 5.2 | Create CloudWatch Dashboard with widgets for: invocations, errors, duration per function |
| 5.3 | Create alarm: error count > 5 in 5 minutes |
| 5.4 | Create alarm: average duration > 3 seconds |

**Outcome:** Real-time visibility into application health.

---

### Phase 6: S3 Static Website Hosting

**Goal:** Deploy the frontend to S3 as a publicly accessible static website.

| Step | Task |
|---|---|
| 6.1 | Create a separate S3 bucket for hosting (e.g., `notestack-web-yourname`) |
| 6.2 | Enable static website hosting (index document: `index.html`) |
| 6.3 | Set bucket policy for public read access |
| 6.4 | Upload `index.html`, `style.css`, `app.js` to the bucket |
| 6.5 | Test via the S3 website endpoint URL |

**Outcome:** Frontend is live at `http://notestack-web-yourname.s3-website.ap-south-1.amazonaws.com`

---

### Phase 7: Integration Testing & Submission

**Goal:** End-to-end testing and mentor demo preparation.

#### Test Checklist

- [ ] Sign up → Verify email → Login
- [ ] Create note (with and without file) → View notes
- [ ] Create note with category → Filter by category
- [ ] Search notes by title
- [ ] Share a note with another user → Other user sees it
- [ ] Edit a note → Delete a note
- [ ] Logout → Login again (notes still there)
- [ ] Wrong password (should fail) → No token (should get 401)
- [ ] Wait for auto-delete to run (or trigger manually) → Verify old notes removed
- [ ] Check CloudWatch logs and dashboard
- [ ] Access frontend via S3 website URL

#### Submission Checklist (Show Your Mentor)

1. All AWS resources in the console (IAM, S3, DynamoDB, Cognito, Lambda, API Gateway, Secrets Manager, CloudWatch, EventBridge)
2. Live demo: sign up → login → create 3 notes → search → filter by category → share → edit → delete → show CloudWatch logs
3. Code walkthrough: explain the flow from frontend → API Gateway → Lambda → DynamoDB
4. Answer: Why DynamoDB over SQL? What if 1000 users create notes simultaneously? How does the Cognito Authorizer protect the API?

---

## Frontend Design — Best Practices & Improvements

Even with vanilla HTML/CSS/JS, the frontend can look and feel professional. Here's what we'll implement:

### 1. Visual Design

- **Color scheme** — Clean dark/light palette with accent color (e.g., indigo/blue) for buttons and highlights
- **Typography** — System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) for native feel, zero load time
- **Spacing** — Consistent 8px grid system for margins/padding
- **Cards** — Each note rendered as a card with subtle shadow, hover lift effect
- **Responsive** — Mobile-first CSS, works on phone/tablet/desktop

### 2. UX Improvements

- **Toast notifications** — Success/error messages that auto-dismiss (no `alert()` calls)
- **Loading states** — Skeleton loaders or spinners while API calls are in progress
- **Empty states** — Friendly message + illustration when no notes exist ("No notes yet — create your first one!")
- **Confirmation dialogs** — Custom modal for delete confirmation (not browser `confirm()`)
- **Form validation** — Inline error messages below inputs, disable submit button until valid
- **Debounced search** — Search triggers after 300ms of no typing, not on every keystroke

### 3. Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Header: Logo + "NoteStack"    User email | Logout  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐│
│  │  Search bar  [🔍 Search notes...]    [Category ▼]││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  Create Note Form                                ││
│  │  [Title] [Category ▼] [Choose File]              ││
│  │  [Content textarea...........................]   ││
│  │  [Create Note]                                   ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Note 1  │ │ Note 2  │ │ Note 3  │               │
│  │ title   │ │ title   │ │ title   │               │
│  │ content │ │ content │ │ content │               │
│  │ 📎 file │ │ [cat]   │ │ 📎 file │               │
│  │ Edit|Del│ │ Edit|Del│ │ Share   │               │
│  │ |Share  │ │ |Share  │ │ Edit|Del│               │
│  └─────────┘ └─────────┘ └─────────┘               │
└─────────────────────────────────────────────────────┘
```

### 4. CSS Techniques

- **CSS Custom Properties** — Theme colors defined as `--primary`, `--bg`, `--text` for easy theming
- **CSS Grid** — For the notes card layout (auto-fill responsive grid)
- **Transitions** — Smooth 200ms transitions on hover, focus, and state changes
- **Focus styles** — Visible focus rings for accessibility
- **Scrollbar styling** — Custom thin scrollbar for the notes area

### 5. JavaScript Patterns

- **State management** — Simple object (`state = { user, notes, filters }`) to track UI state
- **Event delegation** — Single event listener on notes container, not one per button
- **Template literals** — Clean HTML generation with tagged template strings
- **Async/await** — All API calls use async/await (no `.then()` chains)
- **Error boundary** — Global `try/catch` wrapper around API calls with toast feedback
