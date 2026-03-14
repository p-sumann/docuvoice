#!/usr/bin/env bash
# DocuVoice — Resume
# Unlocks S3 (removes the write-deny policy applied by pause.sh).
# DynamoDB and Bedrock are always ready — no action needed for those.
set -euo pipefail

REGION="us-east-1"
DYNAMO_TABLE="docuvoice-main"
S3_BUCKET=""

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
step()  { echo -e "\n${CYAN}${BOLD}==> $*${NC}"; }

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║     DocuVoice — Resume               ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

step "Checking AWS credentials"
CALLER_IDENTITY=$(aws sts get-caller-identity --region "$REGION" 2>&1) || {
    echo -e "${RED}[FAIL]${NC}  AWS credentials invalid or expired."
    exit 1
}
ACCOUNT=$(echo "$CALLER_IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Account'])")
S3_BUCKET="docuvoice-uploads-${ACCOUNT}"
ok "Account: $ACCOUNT"

# ── Unlock S3 ─────────────────────────────────────────────────────────────────
step "Unlocking S3 bucket"

if aws s3api get-bucket-policy --bucket "$S3_BUCKET" --region "$REGION" &>/dev/null; then
    aws s3api delete-bucket-policy \
        --bucket "$S3_BUCKET" \
        --region "$REGION" \
    && ok "S3 unlocked — writes enabled" \
    || warn "Could not remove bucket policy"
else
    ok "S3 already unlocked (no policy to remove)"
fi

# ── DynamoDB: always ready ────────────────────────────────────────────────────
step "DynamoDB: $DYNAMO_TABLE"
TABLE_STATUS=$(aws dynamodb describe-table \
    --table-name "$DYNAMO_TABLE" \
    --region "$REGION" \
    --query "Table.TableStatus" \
    --output text 2>/dev/null) || TABLE_STATUS="NOT_FOUND"

if [ "$TABLE_STATUS" = "ACTIVE" ]; then
    ok "Table ACTIVE and ready"
elif [ "$TABLE_STATUS" = "NOT_FOUND" ]; then
    warn "Table not found — run ./infra/setup.sh first"
else
    warn "Table status: $TABLE_STATUS"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  DocuVoice is LIVE                                   ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  S3       ${GREEN}UNLOCKED${NC}  s3://$S3_BUCKET"
echo -e "  DynamoDB ${GREEN}ACTIVE${NC}    $DYNAMO_TABLE"
echo -e "  Bedrock  ${GREEN}READY${NC}     Nova Sonic 2 + Nova Lite 2"
echo ""
echo -e "${YELLOW}Start your services:${NC}"
echo -e "  Backend:  ${BOLD}cd backend && uv run uvicorn app.main:app --reload${NC}"
echo -e "  Agent:    ${BOLD}cd agent  && uv run python -m agent.entrypoint dev${NC}"
echo -e "  Frontend: ${BOLD}cd frontend && pnpm dev${NC}"
echo ""
echo -e "  To pause:  ${BOLD}./infra/pause.sh${NC}"
echo ""
