#!/usr/bin/env bash
# Update S3 CORS to include the production domain
set -euo pipefail

REGION="us-east-1"

# Get account ID for bucket name
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$REGION")
S3_BUCKET="docuvoice-uploads-${ACCOUNT_ID}"

echo "Updating CORS for bucket: $S3_BUCKET"

CORS_CONFIG='{
    "CORSRules": [{
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://novasonic-hackathon.sumanpaudel.me",
            "https://*.vercel.app"
        ],
        "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-request-id", "x-amz-version-id"],
        "MaxAgeSeconds": 3600
    }]
}'

aws s3api put-bucket-cors \
    --bucket "$S3_BUCKET" \
    --cors-configuration "$CORS_CONFIG" \
    --region "$REGION"

echo "CORS updated — production domain added: https://novasonic-hackathon.sumanpaudel.me"
