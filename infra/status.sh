#!/usr/bin/env bash
# DocuVoice AWS Infrastructure Status
# Read-only check of all AWS resources — never modifies anything.
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
REGION="us-east-1"
DYNAMO_TABLE="docuvoice-main"
S3_BUCKET=""  # resolved after credential check

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
fail()  { echo -e "${RED}[MISS]${NC}  $*"; }
step()  { echo -e "\n${CYAN}${BOLD}==> $*${NC}"; }

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║     DocuVoice — Resource Status      ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ── 1. Credentials ───────────────────────────────────────────────────────────
step "AWS Credentials"

CALLER_IDENTITY=$(aws sts get-caller-identity --region "$REGION" 2>&1) || {
    fail "AWS credentials invalid or expired."
    exit 1
}
ARN=$(echo "$CALLER_IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Arn'])")
ACCOUNT=$(echo "$CALLER_IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Account'])")
ok "$ARN"
info "Account: $ACCOUNT | Region: $REGION"
S3_BUCKET="docuvoice-uploads-${ACCOUNT}"

# ── 2. S3 ────────────────────────────────────────────────────────────────────
step "S3 Bucket: $S3_BUCKET"

if aws s3api head-bucket --bucket "$S3_BUCKET" --region "$REGION" 2>/dev/null; then
    ok "Bucket exists"

    # CORS
    CORS=$(aws s3api get-bucket-cors --bucket "$S3_BUCKET" --region "$REGION" 2>&1) && {
        ORIGINS=$(echo "$CORS" | python3 -c \
            "import sys,json; rules=json.load(sys.stdin)['CORSRules']; print(', '.join(rules[0].get('AllowedOrigins',[])))" \
            2>/dev/null || echo "parse error")
        ok "CORS configured — origins: $ORIGINS"
    } || warn "No CORS configuration (presigned uploads will fail from browser)"

    # Public access block
    PAB=$(aws s3api get-public-access-block --bucket "$S3_BUCKET" --region "$REGION" 2>&1) && {
        BLOCK=$(echo "$PAB" | python3 -c \
            "import sys,json; c=json.load(sys.stdin)['PublicAccessBlockConfiguration']; print(all(c.values()))" \
            2>/dev/null || echo "False")
        if [ "$BLOCK" = "True" ]; then
            ok "Public access blocked"
        else
            warn "Public access NOT fully blocked"
        fi
    } || warn "Could not check public access block"

    # Object count
    OBJECT_COUNT=$(aws s3 ls "s3://$S3_BUCKET" --recursive --region "$REGION" 2>/dev/null | wc -l | tr -d ' ')
    info "Objects in bucket: $OBJECT_COUNT"
else
    fail "Bucket '$S3_BUCKET' does not exist — run ./infra/setup.sh"
fi

# ── 3. DynamoDB ──────────────────────────────────────────────────────────────
step "DynamoDB Table: $DYNAMO_TABLE"

TABLE_DESC=$(aws dynamodb describe-table --table-name "$DYNAMO_TABLE" --region "$REGION" 2>&1) && {
    STATUS=$(echo "$TABLE_DESC" | python3 -c \
        "import sys,json; print(json.load(sys.stdin)['Table']['TableStatus'])")
    ITEM_COUNT=$(echo "$TABLE_DESC" | python3 -c \
        "import sys,json; print(json.load(sys.stdin)['Table']['ItemCount'])")
    SIZE=$(echo "$TABLE_DESC" | python3 -c \
        "import sys,json; print(json.load(sys.stdin)['Table']['TableSizeBytes'])")
    BILLING=$(echo "$TABLE_DESC" | python3 -c \
        "import sys,json; t=json.load(sys.stdin)['Table']; print(t.get('BillingModeSummary',{}).get('BillingMode','PROVISIONED'))" \
        2>/dev/null || echo "UNKNOWN")

    if [ "$STATUS" = "ACTIVE" ]; then
        ok "Table ACTIVE"
    else
        warn "Table status: $STATUS"
    fi
    info "Items: $ITEM_COUNT | Size: ${SIZE} bytes | Billing: $BILLING"
} || fail "Table '$DYNAMO_TABLE' does not exist — run ./infra/setup.sh"

# ── 4. Bedrock ───────────────────────────────────────────────────────────────
step "Bedrock Model Access"

NOVA_MODELS=$(aws bedrock list-foundation-models \
    --region "$REGION" \
    --query "modelSummaries[?contains(modelId, 'nova')].[modelId,modelName]" \
    --output text 2>&1) || NOVA_MODELS=""

if [ -n "$NOVA_MODELS" ] && [ "$NOVA_MODELS" != "None" ]; then
    ok "Nova models visible:"
    echo "$NOVA_MODELS" | while IFS= read -r line; do
        echo -e "     ${CYAN}$line${NC}"
    done
else
    fail "No Nova models visible — enable at:"
    fail "  https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess"
fi

# ── 5. Cost summary ──────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}${BOLD}── Cost when idle ──────────────────────────────────────${NC}"
echo -e "  S3        ${GREEN}\$0${NC}  (pay per GB stored + per request when used)"
echo -e "  DynamoDB  ${GREEN}\$0${NC}  (on-demand: pay per read/write when used)"
echo -e "  Bedrock   ${GREEN}\$0${NC}  (pay per token when agent is active)"
echo ""
echo -e "  To tear down: ${BOLD}./infra/cleanup.sh${NC}"
echo ""
