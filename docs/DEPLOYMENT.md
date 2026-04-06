# NoteStack — Deployment Guide

## Option 1: Deploy to S3 as Static Website (Recommended)

Next.js can be exported as static HTML files and hosted on S3.

### Step 1: Configure Next.js for Static Export

Add `output: 'export'` to your `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
};

export default nextConfig;
```

### Step 2: Build the Static Files

```bash
cd frontend
npm run build
```

This creates an `out/` folder with all the static HTML, CSS, and JS files.

### Step 3: Create S3 Bucket for Hosting

```bash
aws s3 mb s3://notestack-web-sandhiya --region ap-south-1
```

### Step 4: Enable Static Website Hosting

```bash
aws s3 website s3://notestack-web-sandhiya --index-document index.html --error-document index.html
```

### Step 5: Set Bucket Policy for Public Access

Create a file `web-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::notestack-web-sandhiya/*"
  }]
}
```

Apply it:

```bash
aws s3api put-bucket-policy --bucket notestack-web-sandhiya --policy file://web-policy.json --region ap-south-1
```

**Note:** You may need to disable "Block Public Access" first:

```bash
aws s3api put-public-access-block --bucket notestack-web-sandhiya --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" --region ap-south-1
```

### Step 6: Upload the Build Files

```bash
aws s3 sync frontend/out/ s3://notestack-web-sandhiya/ --region ap-south-1
```

### Step 7: Access Your Website

Your site is live at:

```
http://notestack-web-sandhiya.s3-website.ap-south-1.amazonaws.com
```

### Updating the Site

Whenever you make changes:

```bash
cd frontend
npm run build
aws s3 sync out/ s3://notestack-web-sandhiya/ --region ap-south-1 --delete
```

---

## Option 2: Deploy to Vercel (Easiest)

### Step 1: Push to GitHub

```bash
cd NoteStack
git add .
git commit -m "NoteStack complete"
git remote add origin https://github.com/YOUR_USERNAME/NoteStack.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to https://vercel.com
2. Click **"Import Project"**
3. Select your GitHub repo
4. Set **Root Directory** to `frontend`
5. Vercel auto-detects Next.js
6. Click **Deploy**

Your site will be live at `https://notestack-xxx.vercel.app`

---

## Option 3: Deploy to AWS Amplify

### Step 1: Push to GitHub (same as above)

### Step 2: Go to AWS Amplify Console

1. AWS Console → **Amplify** → **New App** → **Host Web App**
2. Connect your GitHub repo
3. Set **App root directory** to `frontend`
4. Amplify auto-detects Next.js
5. Click **Save and Deploy**

### Your URL

Amplify gives you a URL like:
```
https://main.xxxx.amplifyapp.com
```

---

## Updating Lambda Functions After Code Changes

If you modify any Lambda function code (DDD structure):

```bash
# Example: update CreateNote (in domains/notes/lambdas/CreateNote/)
cd domains/notes/lambdas/CreateNote

# Copy shared utils and fix import
cp ../../../../shared/utils.mjs ./utils.mjs
sed 's|../../../../shared/utils.mjs|./utils.mjs|g' index.mjs > index_deploy.mjs

# Zip and deploy
powershell -Command "Compress-Archive -Path 'index_deploy.mjs','utils.mjs' -DestinationPath 'NoteStack-CreateNote.zip' -Force"
aws lambda update-function-code --function-name NoteStack-CreateNote --zip-file fileb://NoteStack-CreateNote.zip --region ap-south-1

# Clean up
rm -f utils.mjs index_deploy.mjs NoteStack-CreateNote.zip
```

Domain → Lambda name mapping:
- `domains/notes/lambdas/CreateNote/` → `NoteStack-CreateNote`
- `domains/notes/lambdas/GetNotes/` → `NoteStack-GetNotes`
- `domains/notes/lambdas/UpdateNote/` → `NoteStack-UpdateNote`
- `domains/notes/lambdas/DeleteNote/` → `NoteStack-DeleteNote`
- `domains/notes/lambdas/SearchNotes/` → `NoteStack-SearchNotes`
- `domains/files/lambdas/GenerateUploadUrl/` → `NoteStack-GenerateUploadUrl`
- `domains/files/lambdas/GenerateDownloadUrl/` → `NoteStack-GenerateDownloadUrl`
- `domains/sharing/lambdas/ShareNote/` → `NoteStack-ShareNote`
- `domains/notifications/lambdas/GetNotifications/` → `NoteStack-GetNotifications`
- `domains/notifications/lambdas/MarkNotificationRead/` → `NoteStack-MarkNotificationRead`
- `domains/cleanup/lambdas/AutoDeleteOldNotes/` → `NoteStack-AutoDeleteOldNotes`

---

## Environment Checklist Before Deploying

- [ ] `frontend/app/lib/config.ts` has the correct `API_URL` and `COGNITO_CLIENT_ID`
- [ ] API Gateway is deployed to `dev` stage
- [ ] CORS is enabled on all API Gateway resources
- [ ] S3 bucket CORS allows your website domain
- [ ] All Lambda functions are on `nodejs18.x` runtime
- [ ] Cognito User Pool has the correct app client settings

---

## Updating S3 CORS for Production

Once deployed, update S3 CORS to only allow your domain:

```json
{
  "CORSRules": [{
    "AllowedOrigins": ["http://notestack-web-sandhiya.s3-website.ap-south-1.amazonaws.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }]
}
```

```bash
aws s3api put-bucket-cors --bucket notestack-files-sandhiya --cors-configuration file://cors-prod.json --region ap-south-1
```
