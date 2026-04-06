#!/bin/bash
# =============================================================================
# NoteStack — AWS Resource Setup Script
# Region: ap-south-1 (Mumbai)
# =============================================================================
# INSTRUCTIONS:
# 1. Replace ALL occurrences of "YOURNAME" with your actual name (lowercase)
# 2. Replace "<ACCOUNT_ID>" with your AWS account ID
# 3. Run each section one at a time, not all at once
# 4. Save the output IDs — you'll need them for later steps
# =============================================================================

REGION="ap-south-1"
BUCKET_NAME="notestack-files-YOURNAME"
WEB_BUCKET="notestack-web-YOURNAME"

echo "=========================================="
echo " NoteStack AWS Setup"
echo " Region: $REGION"
echo "=========================================="

# =============================================================================
# STEP 1: IAM Role
# =============================================================================
echo ""
echo ">>> Step 1: Creating IAM Role..."

cat > /tmp/trust-policy.json << 'EOF'
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
  --assume-role-policy-document file:///tmp/trust-policy.json

echo "Attaching policies..."

aws iam attach-role-policy --role-name NoteStack-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam attach-role-policy --role-name NoteStack-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy --role-name NoteStack-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchFullAccess

aws iam attach-role-policy --role-name NoteStack-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

echo ">>> IAM Role created. Save the Role ARN from above!"
echo ""

# =============================================================================
# STEP 2: S3 Bucket (File Storage)
# =============================================================================
echo ">>> Step 2: Creating S3 Bucket for files..."

aws s3 mb s3://$BUCKET_NAME --region $REGION

cat > /tmp/cors.json << 'EOF'
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
  --bucket $BUCKET_NAME \
  --cors-configuration file:///tmp/cors.json

echo ">>> S3 Bucket created: $BUCKET_NAME"
echo ""

# =============================================================================
# STEP 3: DynamoDB Table — NoteStack-Notes (with GSI)
# =============================================================================
echo ">>> Step 3: Creating DynamoDB Table (NoteStack-Notes)..."

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
  --region $REGION

echo ">>> NoteStack-Notes table created with CategoryIndex GSI"
echo ""

# =============================================================================
# STEP 4: DynamoDB Table — NoteStack-SharedNotes
# =============================================================================
echo ">>> Step 4: Creating DynamoDB Table (NoteStack-SharedNotes)..."

aws dynamodb create-table \
  --table-name NoteStack-SharedNotes \
  --attribute-definitions \
    AttributeName=sharedWithUserId,AttributeType=S \
    AttributeName=noteId,AttributeType=S \
  --key-schema \
    AttributeName=sharedWithUserId,KeyType=HASH \
    AttributeName=noteId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

echo ">>> NoteStack-SharedNotes table created"
echo ""

# =============================================================================
# STEP 5: Cognito User Pool
# =============================================================================
echo ">>> Step 5: Creating Cognito User Pool..."

aws cognito-idp create-user-pool \
  --pool-name NoteStack-Users \
  --auto-verified-attributes email \
  --username-attributes email \
  --region $REGION

echo ""
echo "!!! IMPORTANT: Copy the 'Id' field from the output above !!!"
echo "!!! Then replace <POOL_ID> below and run Step 5b         !!!"
echo ""

# --- Step 5b: Uncomment and run after getting Pool ID ---
# POOL_ID="<POOL_ID>"
# aws cognito-idp create-user-pool-client \
#   --user-pool-id $POOL_ID \
#   --client-name NoteStack-WebApp \
#   --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
#   --region $REGION
# echo ">>> App Client created. Save the ClientId!"

# =============================================================================
# STEP 6: Secrets Manager
# =============================================================================
echo ">>> Step 6: Creating Secret..."

aws secretsmanager create-secret \
  --name notestack/config \
  --secret-string "{\"ALLOWED_FILE_TYPES\":[\"pdf\",\"png\",\"jpg\",\"jpeg\"],\"BUCKET_NAME\":\"$BUCKET_NAME\"}" \
  --region $REGION

echo ">>> Secret created: notestack/config"
echo ""

# =============================================================================
# STEP 7: EventBridge Rule (after Lambda deployment)
# =============================================================================
echo ">>> Step 7: Creating EventBridge Rule..."

aws events put-rule \
  --name NoteStack-AutoDelete \
  --schedule-expression "rate(1 day)" \
  --region $REGION

echo ">>> EventBridge rule created (attach Lambda target after deployment)"
echo ""

# =============================================================================
# STEP 8: Deploy Lambda Functions
# =============================================================================
echo ">>> Step 8: Deploying Lambda Functions..."
echo "Replace <ACCOUNT_ID> with your AWS Account ID before running."
echo ""

ROLE_ARN="arn:aws:iam::<ACCOUNT_ID>:role/NoteStack-Lambda-Role"
LAMBDA_DIR="../lambda"

FUNCTIONS=("CreateNote" "GetNotes" "UpdateNote" "DeleteNote" "GenerateUploadUrl" "SearchNotes" "AutoDeleteOldNotes")

for FUNC in "${FUNCTIONS[@]}"; do
  echo "Deploying NoteStack-$FUNC..."
  cd "$LAMBDA_DIR/$FUNC"

  # Copy shared utils into function directory for bundling
  cp ../shared/utils.mjs ./utils.mjs 2>/dev/null

  # Update import path in index.mjs for Lambda (flat structure)
  sed 's|../shared/utils.mjs|./utils.mjs|g' index.mjs > index_deploy.mjs

  zip -j "NoteStack-$FUNC.zip" index_deploy.mjs utils.mjs

  aws lambda create-function \
    --function-name "NoteStack-$FUNC" \
    --runtime nodejs18.x \
    --role "$ROLE_ARN" \
    --handler index_deploy.handler \
    --zip-file "fileb://NoteStack-$FUNC.zip" \
    --region $REGION \
    --environment "Variables={BUCKET_NAME=$BUCKET_NAME}" \
    --timeout 30

  # Clean up temp files
  rm -f utils.mjs index_deploy.mjs "NoteStack-$FUNC.zip"
  cd - > /dev/null

  echo "  ✓ NoteStack-$FUNC deployed"
done

echo ""
echo ">>> All Lambda functions deployed!"
echo ""

# =============================================================================
# STEP 9: Attach EventBridge to AutoDelete Lambda
# =============================================================================
echo ">>> Step 9: Connecting EventBridge to AutoDeleteOldNotes..."
echo "Replace <ACCOUNT_ID> below."

# aws lambda add-permission \
#   --function-name NoteStack-AutoDeleteOldNotes \
#   --statement-id EventBridgeInvoke \
#   --action lambda:InvokeFunction \
#   --principal events.amazonaws.com \
#   --source-arn arn:aws:events:$REGION:<ACCOUNT_ID>:rule/NoteStack-AutoDelete

# aws events put-targets \
#   --rule NoteStack-AutoDelete \
#   --targets "Id"="1","Arn"="arn:aws:lambda:$REGION:<ACCOUNT_ID>:function:NoteStack-AutoDeleteOldNotes"

echo ""

# =============================================================================
# STEP 10: S3 Static Website Hosting
# =============================================================================
echo ">>> Step 10: Setting up S3 Static Website..."

aws s3 mb s3://$WEB_BUCKET --region $REGION

aws s3 website s3://$WEB_BUCKET \
  --index-document index.html

cat > /tmp/web-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$WEB_BUCKET/*"
  }]
}
EOF

aws s3api put-bucket-policy \
  --bucket $WEB_BUCKET \
  --policy file:///tmp/web-policy.json

echo ">>> Website bucket ready: http://$WEB_BUCKET.s3-website.$REGION.amazonaws.com"
echo ""

# To upload frontend files:
# aws s3 sync ../frontend/ s3://$WEB_BUCKET/ --region $REGION

echo "=========================================="
echo " Setup Complete!"
echo "=========================================="
echo ""
echo " Next steps:"
echo " 1. Create API Gateway (NoteStack-API) in AWS Console"
echo " 2. Add Cognito Authorizer"
echo " 3. Create routes and link to Lambda functions"
echo " 4. Enable CORS on all routes"
echo " 5. Deploy to 'dev' stage"
echo " 6. Update frontend/app.js with API URL + Client ID"
echo " 7. Upload frontend: aws s3 sync ../frontend/ s3://$WEB_BUCKET/"
echo ""
