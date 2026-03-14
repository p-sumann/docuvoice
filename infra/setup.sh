#!/usr/bin/env bash
# DocuVoice AWS Infrastructure Setup
# Creates S3 bucket, DynamoDB table, and verifies Bedrock model access.
# Safe to re-run — idempotent (skips resources that already exist).
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
REGION="us-east-1"
DYNAMO_TABLE="docuvoice-main"
# S3 bucket names are globally unique — derived from account ID to avoid collisions
# Resolved after credential check below
S3_BUCKET=""

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[  OK]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }
step()  { echo -e "\n${CYAN}${BOLD}==> $*${NC}"; }

# ── Banner ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║     DocuVoice — AWS Setup            ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ── 1. Credentials check ─────────────────────────────────────────────────────
step "Checking AWS credentials"

if ! command -v aws &> /dev/null; then
    fail "AWS CLI not found. Install: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi

CALLER_IDENTITY=$(aws sts get-caller-identity --region "$REGION" 2>&1) || {
    fail "AWS credentials invalid or expired."
    fail "Make sure these are exported in your shell:"
    fail "  export AWS_ACCESS_KEY_ID=..."
    fail "  export AWS_SECRET_ACCESS_KEY=..."
    fail "  export AWS_SESSION_TOKEN=...   (if using temporary creds)"
    exit 1
}

ACCOUNT_ID=$(echo "$CALLER_IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Account'])")
ARN=$(echo "$CALLER_IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Arn'])")
ok "Authenticated as: $ARN"
info "Account: $ACCOUNT_ID | Region: $REGION"

# Derive globally-unique bucket name from account ID
S3_BUCKET="docuvoice-uploads-${ACCOUNT_ID}"
info "S3 bucket name: $S3_BUCKET"

# ── 2. S3 Bucket ─────────────────────────────────────────────────────────────
step "S3 Bucket: $S3_BUCKET"

if aws s3api head-bucket --bucket "$S3_BUCKET" --region "$REGION" 2>/dev/null; then
    ok "Bucket already exists — skipping creation"
else
    # NOTE: us-east-1 must NOT have --create-bucket-configuration (AWS quirk)
    aws s3api create-bucket \
        --bucket "$S3_BUCKET" \
        --region "$REGION" \
    && ok "Bucket created" \
    || { fail "Failed to create bucket (name may be taken globally)"; exit 1; }
fi

# Apply CORS (PUT for presigned uploads from browser, GET for downloads)
CORS_CONFIG='{
    "CORSRules": [{
        "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001", "https://*.vercel.app"],
        "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-request-id", "x-amz-version-id"],
        "MaxAgeSeconds": 3600
    }]
}'
aws s3api put-bucket-cors \
    --bucket "$S3_BUCKET" \
    --cors-configuration "$CORS_CONFIG" \
    --region "$REGION" \
&& ok "CORS policy applied (localhost:3000, localhost:3001, *.vercel.app)" \
|| { fail "Failed to apply CORS policy"; exit 1; }

# Block all public access — uploads only via presigned URLs
aws s3api put-public-access-block \
    --bucket "$S3_BUCKET" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    --region "$REGION" \
&& ok "Public access blocked (presigned URLs only)" \
|| warn "Could not set public access block (non-critical)"

# ── 3. DynamoDB Table ─────────────────────────────────────────────────────────
step "DynamoDB Table: $DYNAMO_TABLE"

if aws dynamodb describe-table --table-name "$DYNAMO_TABLE" --region "$REGION" &>/dev/null; then
    ok "Table already exists — skipping creation"
else
    # Single-table design matching agent/agent/utils/dynamo.py key patterns:
    #   PK examples: WS#<id>, SESSION#<id>
    #   SK examples: WS#<id>, DOC#<id>, SESSION#<id>, FINDING#<n>
    aws dynamodb create-table \
        --table-name "$DYNAMO_TABLE" \
        --attribute-definitions \
            AttributeName=PK,AttributeType=S \
            AttributeName=SK,AttributeType=S \
        --key-schema \
            AttributeName=PK,KeyType=HASH \
            AttributeName=SK,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --region "$REGION" \
    && ok "Table creation initiated (PAY_PER_REQUEST — \$0 when idle)" \
    || { fail "Failed to create DynamoDB table"; exit 1; }

    info "Waiting for table to become ACTIVE..."
    aws dynamodb wait table-exists \
        --table-name "$DYNAMO_TABLE" \
        --region "$REGION" \
    && ok "Table is ACTIVE" \
    || { fail "Table did not become active in time"; exit 1; }
fi

# ── 4. Bedrock Model Access ───────────────────────────────────────────────────
step "Bedrock Model Access (Nova Sonic 2 + Nova Lite 2)"

NOVA_MODELS=$(aws bedrock list-foundation-models \
    --region "$REGION" \
    --query "modelSummaries[?contains(modelId, 'nova')].[modelId,modelName]" \
    --output text 2>&1) || NOVA_MODELS=""

if [ -n "$NOVA_MODELS" ] && [ "$NOVA_MODELS" != "None" ]; then
    ok "Nova models visible in Bedrock:"
    echo "$NOVA_MODELS" | while IFS= read -r line; do
        echo -e "     ${CYAN}$line${NC}"
    done
    echo ""
    warn "Visibility ≠ access. If the agent fails with AccessDeniedException,"
    warn "enable model access at:"
    warn "  https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess"
else
    warn "Could not list Bedrock models (may be a permissions issue)."
    warn "Enable Nova model access manually:"
    warn "  https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess"
fi

# ── 5. Textract Access ────────────────────────────────────────────────────────
step "Textract Access (Document Text Detection)"

# Quick smoke test: call DetectDocumentText with a tiny 1x1 white PNG
# If the call succeeds (or fails with InvalidDocument), Textract is accessible.
# If it fails with AccessDeniedException, permissions need fixing.
TINY_PNG=$(python3 -c "
import base64
# minimal valid 1x1 white PNG
b = bytes([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
    0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
    0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC,0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
    0x44,0xAE,0x42,0x60,0x82
])
print(base64.b64encode(b).decode())
")

TEXTRACT_RESULT=$(aws textract detect-document-text \
    --document "{\"Bytes\":\"$TINY_PNG\"}" \
    --region "$REGION" 2>&1) && TEXTRACT_OK=true || TEXTRACT_OK=false

if $TEXTRACT_OK; then
    ok "Textract DetectDocumentText is accessible"
elif echo "$TEXTRACT_RESULT" | grep -q "AccessDeniedException"; then
    fail "Textract access denied. Your IAM role/SCP blocks textract:DetectDocumentText."
    warn "Fix: Add textract:DetectDocumentText permission to your IAM role or ask your"
    warn "AWS org admin to allow Textract in the Service Control Policy."
    warn "  Console: https://console.aws.amazon.com/iam/home#/policies"
    exit 1
else
    # Any other error (e.g. throttling) — Textract is reachable but call failed for other reasons
    ok "Textract endpoint is reachable (call returned: non-access error)"
fi

# ── 6. Write .env snippets ────────────────────────────────────────────────────
step "Writing .env snippet"
ENV_SNIPPET="# DocuVoice AWS resources (generated by infra/setup.sh)
AWS_DEFAULT_REGION=$REGION
S3_BUCKET_NAME=$S3_BUCKET
DYNAMODB_TABLE_NAME=$DYNAMO_TABLE
STORAGE_BACKEND=dynamodb
"
echo "$ENV_SNIPPET" > infra/.env.aws
ok "AWS env vars written to infra/.env.aws — copy into backend/.env and agent/.env"

# ── 7. Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Setup complete!                                     ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  S3 Bucket:       ${CYAN}s3://$S3_BUCKET${NC}"
echo -e "  DynamoDB Table:  ${CYAN}$DYNAMO_TABLE${NC}  (region: $REGION)"
echo ""
echo -e "${YELLOW}Cost reminder:${NC} S3, DynamoDB (on-demand), and Bedrock are all"
echo -e "serverless. They cost ${GREEN}\$0 when idle${NC} — no need to 'stop' them."
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Set ${BOLD}STORAGE_BACKEND=dynamodb${NC} in ${CYAN}backend/.env${NC}"
echo -e "  2. Add your AWS creds to ${CYAN}backend/.env${NC} and ${CYAN}agent/.env${NC}"
echo -e "  3. Run ${BOLD}./infra/status.sh${NC} to verify everything"
echo -e "  4. When done: ${BOLD}./infra/cleanup.sh${NC} to tear down"
echo ""
